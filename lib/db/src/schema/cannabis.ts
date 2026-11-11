import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { loyaltyMembers } from "./loyalty";

export const cannabisBalances = pgTable("jaguar_cannabis_balances", {
  memberId: uuid("member_id").primaryKey().references(() => loyaltyMembers.id),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
}, (t) => [
  check("jaguar_cannabis_balance_nonnegative", sql`${t.balance} >= 0 and ${t.lifetimeEarned} >= 0 and ${t.lifetimeRedeemed} >= 0`),
]);

export const cannabisTransactions = pgTable("jaguar_cannabis_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => loyaltyMembers.id),
  requestId: uuid("request_id").notNull().unique(),
  delta: integer("delta").notNull(),
  gramsPurchased: integer("grams_purchased").notNull().default(0),
  reason: text("reason").notNull(),
  pointsPolicy: text("points_policy").notNull().default("legacy-gram-v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_cannabis_transaction_delta_v2", sql`(${t.delta} >= 0 and ${t.gramsPurchased} > 0) or (${t.delta} < 0 and ${t.gramsPurchased} = 0)`),
  check("jaguar_cannabis_grams_range", sql`${t.gramsPurchased} between 0 and 999`),
  index("jaguar_cannabis_transaction_member_time").on(t.memberId, t.createdAt),
]);

export const insertCannabisBalanceSchema = createInsertSchema(cannabisBalances);
export const insertCannabisTransactionSchema = createInsertSchema(cannabisTransactions);
export type CannabisBalance = typeof cannabisBalances.$inferSelect;
export type InsertCannabisBalance = z.infer<typeof insertCannabisBalanceSchema>;
export type CannabisTransaction = typeof cannabisTransactions.$inferSelect;
export type InsertCannabisTransaction = z.infer<typeof insertCannabisTransactionSchema>;
