import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const aiNoteConversations = pgTable(
  "ai_note_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull().default("New conversation"),
    mode: text("mode").notNull().default("chat"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "ai_note_conversations_mode_valid",
      sql`${table.mode} in ('chat', 'summarize', 'action_items')`,
    ),
    check(
      "ai_note_conversations_title_length",
      sql`char_length(btrim(${table.title})) between 1 and 120`,
    ),
    index("ai_note_conversations_owner_updated").on(
      table.ownerId,
      table.updatedAt,
    ),
  ],
);

export const aiNoteMessages = pgTable(
  "ai_note_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiNoteConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    mode: text("mode").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("complete"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "ai_note_messages_role_valid",
      sql`${table.role} in ('user', 'assistant')`,
    ),
    check(
      "ai_note_messages_mode_valid",
      sql`${table.mode} in ('chat', 'summarize', 'action_items')`,
    ),
    check(
      "ai_note_messages_status_valid",
      sql`${table.status} in ('complete', 'interrupted', 'error')`,
    ),
    check(
      "ai_note_messages_content_limit",
      sql`char_length(${table.content}) <= 60000`,
    ),
    index("ai_note_messages_conversation_created").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const aiNoteUsage = pgTable(
  "ai_note_usage",
  {
    ownerId: text("owner_id").notNull(),
    usageDay: date("usage_day", { mode: "string" }).notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.usageDay] }),
    check("ai_note_usage_count_range", sql`${table.requestCount} between 0 and 40`),
  ],
);

export type AiNoteConversation = typeof aiNoteConversations.$inferSelect;
export type AiNoteMessage = typeof aiNoteMessages.$inferSelect;
export type AiNoteUsage = typeof aiNoteUsage.$inferSelect;
