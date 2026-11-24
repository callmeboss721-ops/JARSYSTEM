import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  and,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import {
  Router,
  type IRouter,
  type Request,
  type RequestHandler,
  type Response as ExpressResponse,
} from "express";
import {
  aiNoteConversations,
  aiNoteMessages,
  aiNoteUsage,
  db,
} from "@workspace/db";
import {
  CreateAiNoteConversationBody,
  CreateAiNoteConversationResponse,
  DeleteAiNoteConversationParams,
  GetAiNoteConversationParams,
  GetAiNoteConversationResponse,
  GetAiNotesOverviewResponse,
  ListAiNoteConversationsQueryParams,
  ListAiNoteConversationsResponse,
  StreamAiNoteMessageBody,
  StreamAiNoteMessageParams,
  UpdateAiNoteConversationBody,
  UpdateAiNoteConversationParams,
  UpdateAiNoteConversationResponse,
} from "@workspace/api-zod";
import {
  GeminiApiError,
  openGeminiStream,
  readGeminiTextDeltas,
  type AiNoteMode,
} from "../lib/ai-notes-gemini";

const router: IRouter = Router();
const DAILY_AI_LIMIT = 40;
const PER_MINUTE_LIMIT = 5;
const STREAM_TIMEOUT_MS = 60_000;
const NOTE_SESSION_COOKIE = "stillnote_session";
const NOTE_SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const rateWindows = new Map<string, { count: number; resetAt: number }>();
let requestsSinceRateCleanup = 0;

type NoteSessionPayload = { sub: string; name: string; exp: number };

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function signToken(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function readNoteSession(req: Request): NoteSessionPayload | null {
  const raw: unknown = req.cookies?.[NOTE_SESSION_COOKIE];
  if (typeof raw !== "string" || raw.length > 1024) return null;
  const [payload, sig, extra] = raw.split(".");
  if (!payload || !sig || extra) return null;
  const expected = Buffer.from(signToken(payload));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as NoteSessionPayload;
    if (
      typeof parsed.sub !== "string" ||
      !parsed.sub ||
      typeof parsed.name !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const requireSameOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  const forwardedHost = req.get("x-forwarded-host");
  const host = (forwardedHost || req.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (!origin || !host) {
    res.status(403).json({ error: "This request could not be verified." });
    return;
  }

  try {
    if (new URL(origin).host.toLowerCase() !== host) {
      res.status(403).json({ error: "This request could not be verified." });
      return;
    }
  } catch {
    res.status(403).json({ error: "This request could not be verified." });
    return;
  }

  next();
};

router.get("/ai-notes/session", (req, res): void => {
  const session = readNoteSession(req);
  if (!session) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({ authenticated: true, user: { id: session.sub, name: session.name } });
});

router.post("/ai-notes/session", requireSameOrigin, (req, res): void => {
  const existing = readNoteSession(req);
  const rawName = typeof req.body?.name === "string" ? req.body.name.normalize("NFC").trim() : "";
  const cleanName = Array.from(rawName).slice(0, 32).join("") || existing?.name || "Your space";
  const sub = existing?.sub ?? `note_${randomUUID()}`;
  const exp = Math.floor(Date.now() / 1000) + NOTE_SESSION_MAX_AGE_SEC;
  const encoded = Buffer.from(JSON.stringify({ sub, name: cleanName, exp })).toString("base64url");
  res.cookie(NOTE_SESSION_COOKIE, `${encoded}.${signToken(encoded)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/ai-notes",
    maxAge: NOTE_SESSION_MAX_AGE_SEC * 1000,
  });
  res.json({ authenticated: true, user: { id: sub, name: cleanName } });
});

router.delete("/ai-notes/session", requireSameOrigin, (_req, res): void => {
  res.clearCookie(NOTE_SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/ai-notes",
  });
  res.json({ ok: true });
});

const requireSignedIn: RequestHandler = (req, res, next) => {
  const session = readNoteSession(req);
  if (!session) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  res.locals.aiNotesOwnerId = session.sub;
  next();
};

router.use("/ai-notes", requireSignedIn);

router.get("/ai-notes/overview", async (_req, res): Promise<void> => {
  const ownerId = getOwnerId(res);
  const [conversationTotals] = await db
    .select({ total: count() })
    .from(aiNoteConversations)
    .where(eq(aiNoteConversations.ownerId, ownerId));
  const [messageTotals] = await db
    .select({ total: count() })
    .from(aiNoteMessages)
    .innerJoin(
      aiNoteConversations,
      eq(aiNoteMessages.conversationId, aiNoteConversations.id),
    )
    .where(eq(aiNoteConversations.ownerId, ownerId));
  const [usage] = await db
    .select({ total: aiNoteUsage.requestCount })
    .from(aiNoteUsage)
    .where(
      and(
        eq(aiNoteUsage.ownerId, ownerId),
        eq(aiNoteUsage.usageDay, getBangkokDate()),
      ),
    );
  const [recent] = await db
    .select({ updatedAt: aiNoteConversations.updatedAt })
    .from(aiNoteConversations)
    .where(eq(aiNoteConversations.ownerId, ownerId))
    .orderBy(desc(aiNoteConversations.updatedAt))
    .limit(1);

  res.json(
    GetAiNotesOverviewResponse.parse({
      conversation_count: conversationTotals?.total ?? 0,
      message_count: messageTotals?.total ?? 0,
      requests_today: usage?.total ?? 0,
      daily_limit: DAILY_AI_LIMIT,
      recent_activity_at: recent?.updatedAt ?? null,
    }),
  );
});

router.get("/ai-notes/conversations", async (req, res): Promise<void> => {
  const query = ListAiNoteConversationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Search filters are invalid." });
    return;
  }

  const ownerId = getOwnerId(res);
  const filters = [eq(aiNoteConversations.ownerId, ownerId)];
  const search = query.data.search?.normalize("NFC").trim();
  if (search?.includes("\u0000")) {
    res.status(400).json({ error: "Search filters are invalid." });
    return;
  }
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(
      or(
        ilike(aiNoteConversations.title, pattern),
        exists(
          db
            .select({ id: aiNoteMessages.id })
            .from(aiNoteMessages)
            .where(
              and(
                eq(aiNoteMessages.conversationId, aiNoteConversations.id),
                ilike(aiNoteMessages.content, pattern),
              ),
            ),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: aiNoteConversations.id,
      title: aiNoteConversations.title,
      mode: aiNoteConversations.mode,
      preview: sql<string>`coalesce((select left(m.content, 240) from ai_note_messages as m where m.conversation_id = ${aiNoteConversations.id} order by m.created_at desc limit 1), '')`,
      message_count: sql<number>`(select count(*)::int from ai_note_messages as m where m.conversation_id = ${aiNoteConversations.id})`,
      created_at: aiNoteConversations.createdAt,
      updated_at: aiNoteConversations.updatedAt,
    })
    .from(aiNoteConversations)
    .where(and(...filters))
    .orderBy(desc(aiNoteConversations.updatedAt))
    .limit(query.data.limit ?? 50);

  res.json(ListAiNoteConversationsResponse.parse(rows));
});

router.post(
  "/ai-notes/conversations",
  requireSameOrigin,
  async (req, res): Promise<void> => {
    const body = CreateAiNoteConversationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Conversation details are invalid." });
      return;
    }

    const [conversation] = await db
      .insert(aiNoteConversations)
      .values({
        ownerId: getOwnerId(res),
        mode: body.data.mode,
      })
      .returning();

    if (!conversation) {
      res.status(500).json({ error: "Could not create the conversation." });
      return;
    }

    res
      .status(201)
      .json(
        CreateAiNoteConversationResponse.parse({
          id: conversation.id,
          title: conversation.title,
          mode: conversation.mode,
          messages: [],
          created_at: conversation.createdAt,
          updated_at: conversation.updatedAt,
        }),
      );
  },
);

router.get(
  "/ai-notes/conversations/:id",
  async (req, res): Promise<void> => {
    const params = GetAiNoteConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Conversation ID is invalid." });
      return;
    }
    const conversation = await loadConversation(
      getOwnerId(res),
      params.data.id,
    );
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.json(GetAiNoteConversationResponse.parse(conversation));
  },
);

router.patch(
  "/ai-notes/conversations/:id",
  requireSameOrigin,
  async (req, res): Promise<void> => {
    const params = UpdateAiNoteConversationParams.safeParse(req.params);
    const body = UpdateAiNoteConversationBody.safeParse(req.body);
    const title = body.success ? body.data.title.normalize("NFC").trim() : "";
    if (
      !params.success ||
      !body.success ||
      !title ||
      title.length > 120 ||
      title.includes("\u0000")
    ) {
      res.status(400).json({ error: "Conversation title is invalid." });
      return;
    }

    const [updated] = await db
      .update(aiNoteConversations)
      .set({ title, updatedAt: new Date() })
      .where(
        and(
          eq(aiNoteConversations.id, params.data.id),
          eq(aiNoteConversations.ownerId, getOwnerId(res)),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    const conversation = await loadConversation(getOwnerId(res), updated.id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.json(UpdateAiNoteConversationResponse.parse(conversation));
  },
);

router.delete(
  "/ai-notes/conversations/:id",
  requireSameOrigin,
  async (req, res): Promise<void> => {
    const params = DeleteAiNoteConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Conversation ID is invalid." });
      return;
    }

    const [deleted] = await db
      .delete(aiNoteConversations)
      .where(
        and(
          eq(aiNoteConversations.id, params.data.id),
          eq(aiNoteConversations.ownerId, getOwnerId(res)),
        ),
      )
      .returning({ id: aiNoteConversations.id });

    if (!deleted) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.sendStatus(204);
  },
);

router.post(
  "/ai-notes/conversations/:id/messages/stream",
  requireSameOrigin,
  async (req, res): Promise<void> => {
    const params = StreamAiNoteMessageParams.safeParse(req.params);
    const body = StreamAiNoteMessageBody.safeParse(req.body);
    const prompt = body.success ? body.data.prompt.normalize("NFC").trim() : "";
    if (
      !params.success ||
      !body.success ||
      !prompt ||
      prompt.length > 16_000 ||
      prompt.includes("\u0000")
    ) {
      res.status(400).json({ error: "Message details are invalid." });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: "The AI assistant is not configured yet." });
      return;
    }

    const ownerId = getOwnerId(res);
    const conversation = await findOwnedConversation(ownerId, params.data.id);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const retryAfter = consumeMinuteLimit(ownerId);
    if (retryAfter > 0) {
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Please wait before sending another message." });
      return;
    }
    const usageAllowed = await consumeDailyLimit(ownerId);
    if (!usageAllowed) {
      res.setHeader("Retry-After", String(secondsUntilBangkokDayEnds()));
      res.status(429).json({ error: "Today's AI request limit has been reached." });
      return;
    }

    const history = await db
      .select({ role: aiNoteMessages.role, content: aiNoteMessages.content })
      .from(aiNoteMessages)
      .where(
        and(
          eq(aiNoteMessages.conversationId, conversation.id),
          eq(aiNoteMessages.status, "complete"),
        ),
      )
      .orderBy(desc(aiNoteMessages.createdAt))
      .limit(12);

    const mode = body.data.mode as AiNoteMode;
    const now = new Date();
    const title =
      conversation.title === "New conversation"
        ? makeTitle(prompt)
        : conversation.title;
    let userMessage: typeof aiNoteMessages.$inferSelect;
    let assistantMessage: typeof aiNoteMessages.$inferSelect;

    try {
      const messages = await db.transaction(async (tx) => {
        await tx
          .update(aiNoteConversations)
          .set({ title, mode, updatedAt: now })
          .where(
            and(
              eq(aiNoteConversations.id, conversation.id),
              eq(aiNoteConversations.ownerId, ownerId),
            ),
          );
        const [user] = await tx
          .insert(aiNoteMessages)
          .values({
            conversationId: conversation.id,
            role: "user",
            mode,
            content: prompt,
            status: "complete",
          })
          .returning();
        const [assistant] = await tx
          .insert(aiNoteMessages)
          .values({
            conversationId: conversation.id,
            role: "assistant",
            mode,
            content: "",
            status: "interrupted",
          })
          .returning();
        if (!user || !assistant) throw new Error("Could not create message records");
        return { user, assistant };
      });
      userMessage = messages.user;
      assistantMessage = messages.assistant;
    } catch (error) {
      req.log.error(
        { errorName: error instanceof Error ? error.name : "unknown" },
        "Could not save AI note prompt",
      );
      res.status(500).json({ error: "Could not save this message." });
      return;
    }

    const startedAt = Date.now();
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), STREAM_TIMEOUT_MS);
    let upstream: globalThis.Response;
    try {
      upstream = await openGeminiStream({
        mode,
        prompt,
        history: limitContext(
          history
            .reverse()
            .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
              content: message.content,
            })),
          24_000,
        ),
        signal: abortController.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      await markMessageStatus(assistantMessage.id, "error");
      if (error instanceof GeminiApiError) {
        req.log.warn({ status: error.status }, "Gemini request could not start");
        const status =
          error.status === 429
            ? 429
            : error.status === 503
              ? 503
              : error.status
                ? 502
                : 503;
        if (error.retryAfter) {
          res.setHeader("Retry-After", error.retryAfter);
        }
        res.status(status).json({
          error:
            status === 429 || status === 503
              ? "The AI assistant is temporarily busy. Please try again shortly."
              : "The AI assistant could not start a response.",
        });
        return;
      }
      req.log.error({ err: error }, "Gemini request could not start");
      res.status(502).json({ error: "The AI assistant could not start a response." });
      return;
    }

    res.on("close", () => {
      if (!res.writableEnded) abortController.abort();
    });
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    sendEvent(res, "start", {
      conversation_id: conversation.id,
      title,
      user_message: toMessage(userMessage),
      assistant_message: toMessage(assistantMessage),
    });

    let responseText = "";
    try {
      for await (const delta of readGeminiTextDeltas(upstream)) {
        if (delta.includes("\u0000")) {
          throw new GeminiApiError("Gemini returned invalid text");
        }
        responseText += delta;
        if (responseText.length > 60_000) {
          throw new GeminiApiError("Gemini response exceeded the response limit");
        }
        sendEvent(res, "delta", { text: delta });
      }

      if (!responseText.trim()) {
        throw new GeminiApiError("Gemini returned an empty response");
      }

      const [savedAssistant] = await db
        .update(aiNoteMessages)
        .set({ content: responseText, status: "complete" })
        .where(eq(aiNoteMessages.id, assistantMessage.id))
        .returning();
      await db
        .update(aiNoteConversations)
        .set({ updatedAt: new Date() })
        .where(eq(aiNoteConversations.id, conversation.id));
      sendEvent(res, "complete", {
        assistant_message: savedAssistant
          ? toMessage(savedAssistant)
          : { ...toMessage(assistantMessage), content: responseText, status: "complete" },
      });
      req.log.info(
        {
          mode,
          durationMs: Date.now() - startedAt,
          outputChars: responseText.length,
        },
        "AI note response completed",
      );
    } catch (error) {
      await db
        .update(aiNoteMessages)
        .set({ content: responseText, status: "interrupted" })
        .where(eq(aiNoteMessages.id, assistantMessage.id));
      req.log.warn(
        { conversationId: conversation.id, reason: safeGeminiFailure(error) },
        "Gemini response stream was interrupted",
      );
      if (!res.destroyed && !res.writableEnded) {
        sendEvent(res, "error", {
          message: "The response stopped early. You can try again.",
        });
      }
    } finally {
      clearTimeout(timeout);
      if (!res.destroyed && !res.writableEnded) res.end();
    }
  },
);

async function findOwnedConversation(ownerId: string, id: string) {
  const [conversation] = await db
    .select()
    .from(aiNoteConversations)
    .where(
      and(
        eq(aiNoteConversations.id, id),
        eq(aiNoteConversations.ownerId, ownerId),
      ),
    )
    .limit(1);
  return conversation;
}

async function loadConversation(ownerId: string, id: string) {
  const conversation = await findOwnedConversation(ownerId, id);
  if (!conversation) return null;

  const messages = await db
    .select()
    .from(aiNoteMessages)
    .where(eq(aiNoteMessages.conversationId, id))
    .orderBy(desc(aiNoteMessages.createdAt))
    .limit(100);

  return {
    id: conversation.id,
    title: conversation.title,
    mode: conversation.mode,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    messages: messages.reverse().map(toMessage),
  };
}

async function markMessageStatus(
  messageId: string,
  status: "error" | "interrupted",
): Promise<void> {
  await db
    .update(aiNoteMessages)
    .set({ status })
    .where(eq(aiNoteMessages.id, messageId));
}

function toMessage(message: typeof aiNoteMessages.$inferSelect) {
  return {
    id: message.id,
    role: message.role,
    mode: message.mode,
    content: message.content,
    status: message.status,
    created_at: message.createdAt,
  };
}

function getOwnerId(res: ExpressResponse): string {
  const ownerId = res.locals.aiNotesOwnerId;
  if (typeof ownerId !== "string" || ownerId.length === 0) {
    throw new Error("Authenticated AI notes user was not attached.");
  }
  return ownerId;
}

function getBangkokDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function secondsUntilBangkokDayEnds(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const numberPart = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value ?? 0);
  const elapsed =
    numberPart("hour") * 3600 +
    numberPart("minute") * 60 +
    numberPart("second");
  return Math.max(1, 86_400 - elapsed);
}

async function consumeDailyLimit(ownerId: string): Promise<boolean> {
  const [usage] = await db
    .insert(aiNoteUsage)
    .values({
      ownerId,
      usageDay: getBangkokDate(),
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: [aiNoteUsage.ownerId, aiNoteUsage.usageDay],
      set: { requestCount: sql`${aiNoteUsage.requestCount} + 1` },
      setWhere: lt(aiNoteUsage.requestCount, DAILY_AI_LIMIT),
    })
    .returning({ count: aiNoteUsage.requestCount });

  return Boolean(usage && usage.count <= DAILY_AI_LIMIT);
}

function consumeMinuteLimit(ownerId: string): number {
  const now = Date.now();
  const current = rateWindows.get(ownerId);
  if (!current || current.resetAt <= now) {
    rateWindows.set(ownerId, { count: 1, resetAt: now + 60_000 });
  } else if (current.count >= PER_MINUTE_LIMIT) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  } else {
    current.count += 1;
  }

  requestsSinceRateCleanup += 1;
  if (requestsSinceRateCleanup >= 250 || rateWindows.size > 5_000) {
    requestsSinceRateCleanup = 0;
    for (const [key, window] of rateWindows) {
      if (window.resetAt <= now) rateWindows.delete(key);
    }
    if (rateWindows.size > 5_000) {
      const firstKey = rateWindows.keys().next().value;
      if (firstKey) rateWindows.delete(firstKey);
    }
  }
  return 0;
}

function makeTitle(prompt: string): string {
  const compact = prompt.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 71).trimEnd()}…` : compact;
}

function limitContext(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxCharacters: number,
): Array<{ role: "user" | "assistant"; content: string }> {
  let remaining = maxCharacters;
  const recent: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (let index = messages.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const message = messages[index];
    const content = message.content.slice(-remaining);
    if (!content) continue;
    recent.push({ role: message.role, content });
    remaining -= content.length;
  }
  return recent.reverse();
}

function sendEvent(
  res: ExpressResponse,
  event: string,
  data: Record<string, unknown>,
): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function safeGeminiFailure(error: unknown): string {
  if (error instanceof GeminiApiError) return error.message;
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "unknown";
}

export default router;
