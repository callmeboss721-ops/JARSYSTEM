import { useMemo } from "react";
import {
  getGetAiNoteConversationQueryKey,
  getGetAiNotesOverviewQueryKey,
  getListAiNoteConversationsQueryKey,
  getStreamAiNoteMessageUrl,
  useCreateAiNoteConversation,
  useDeleteAiNoteConversation,
  useGetAiNoteConversation,
  useGetAiNotesOverview,
  useListAiNoteConversations,
  useUpdateAiNoteConversation,
} from "@workspace/api-client-react";
import type { AiNoteMessage, AiNoteMode } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useAiNotes(search: string, conversationId: string | null) {
  const queryClient = useQueryClient();
  const params = useMemo(
    () => ({ search: search.trim() || undefined, limit: 100 }),
    [search],
  );
  const overview = useGetAiNotesOverview();
  const conversations = useListAiNoteConversations(params, {
    query: { queryKey: getListAiNoteConversationsQueryKey(params) },
  });
  const conversation = useGetAiNoteConversation(conversationId ?? "", {
    query: {
      enabled: Boolean(conversationId),
      queryKey: getGetAiNoteConversationQueryKey(conversationId ?? ""),
    },
  });
  const createConversation = useCreateAiNoteConversation();
  const updateConversation = useUpdateAiNoteConversation();
  const deleteConversation = useDeleteAiNoteConversation();

  const refreshCollection = () => {
    void queryClient.invalidateQueries({ queryKey: getListAiNoteConversationsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetAiNotesOverviewQueryKey() });
  };

  return {
    overview,
    conversations,
    conversation,
    createConversation,
    updateConversation,
    deleteConversation,
    refreshCollection,
    refreshConversation: (id: string) =>
      queryClient.invalidateQueries({ queryKey: getGetAiNoteConversationQueryKey(id) }),
  };
}

export async function streamAiNoteResponse({
  conversationId,
  mode,
  prompt,
  signal,
  onText,
  onStart,
  onComplete,
}: {
  conversationId: string;
  mode: AiNoteMode;
  prompt: string;
  signal: AbortSignal;
  onText: (text: string) => void;
  onStart: (userMessage: AiNoteMessage, title: string) => void;
  onComplete: (assistantMessage: AiNoteMessage) => void;
}) {
  const response = await fetch(
    getStreamAiNoteMessageUrl(encodeURIComponent(conversationId)),
    {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ mode, prompt }),
    },
  );

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const safeError = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : `The request could not be completed (${response.status}).`;
    throw new Error(safeError);
  }
  if (!response.body) {
    throw new Error("This browser could not open the response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";
  const emitEvent = (eventText: string) => {
    const lines = eventText.split(/\r?\n/);
    const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
    const payload = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!payload) return;
    let data: unknown;
    try {
      data = JSON.parse(payload);
    } catch {
      return;
    }
    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;
    if (eventName === "start") {
      const userMessage = record.user_message as AiNoteMessage;
      const title = typeof record.title === "string" ? record.title : "";
      onStart(userMessage, title);
      return;
    }
    if (eventName === "delta") {
      const text = record.text;
      if (typeof text === "string") {
        result += text;
        onText(result);
      }
      return;
    }
    if (eventName === "complete") {
      onComplete(record.assistant_message as AiNoteMessage);
      return;
    }
    if (eventName === "error") {
      const message = typeof record.message === "string" ? record.message : "The response could not be completed.";
      throw new Error(message);
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      events.forEach(emitEvent);
      if (done) break;
    }
    if (buffer.trim()) emitEvent(buffer);
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  return result;
}
