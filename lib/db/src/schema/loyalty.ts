import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const loyaltyMembers = pgTable("jaguar_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberCode: text("member_code").notNull().unique(),
  displayName: text("display_name").notNull().default("สมาชิก"),
  phoneE164: text("phone_e164").unique(),
  qrTokenHash: text("qr_token_hash").unique(),
  isDemo: boolean("is_demo").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_member_code_compact", sql`${t.memberCode} ~ '^[A-Z0-9][A-Z0-9-]{4,6}[A-Z0-9]$'`),
]);

export const loyaltyBalances = pgTable("jaguar_point_balances", {
  memberId: uuid("member_id").primaryKey().references(() => loyaltyMembers.id),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
}, (t) => [check("jaguar_balances_nonnegative", sql`${t.balance} >= 0 and ${t.lifetimeEarned} >= 0 and ${t.lifetimeRedeemed} >= 0`)]);

export const loyaltyRewards = pgTable("jaguar_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pointsCost: integer("points_cost").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
}, (t) => [check("jaguar_reward_cost", sql`${t.pointsCost} between 10 and 100000`)]);

export const loyaltyRedemptions = pgTable("jaguar_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => loyaltyMembers.id),
  rewardId: uuid("reward_id").notNull().references(() => loyaltyRewards.id),
  requestId: uuid("request_id").unique(),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_redemption_cost", sql`${t.pointsSpent} >= 10`),
  check("jaguar_redemption_status", sql`${t.status} in ('pending','confirmed')`),
  uniqueIndex("jaguar_one_pending_per_member").on(t.memberId).where(sql`${t.status} = 'pending'`),
  index("jaguar_redemption_created").on(t.createdAt),
]);

export const loyaltyTransactions = pgTable("jaguar_point_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => loyaltyMembers.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("jaguar_transaction_member").on(t.memberId, t.createdAt)]);

export const loyaltySales = pgTable("jaguar_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => loyaltyMembers.id),
  requestId: uuid("request_id").notNull().unique(),
  bottleCount: integer("bottle_count").notNull(),
  amountBaht: integer("amount_baht").notNull(),
  formula: text("formula").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_sale_amount", sql`${t.amountBaht} between 1 and 100000000`),
  check("jaguar_sale_bottle_quantity", sql`${t.bottleCount} between 1 and 999`),
  check("jaguar_sale_bundle_price", sql`${t.amountBaht} = (${t.bottleCount}/3)*150 + (${t.bottleCount}%3)*60`),
  check("jaguar_sale_formula", sql`${t.formula} in ('red','silver','gold')`),
  check("jaguar_sale_point_rule", sql`${t.pointsAwarded}=${t.bottleCount}/3`),
  index("jaguar_sale_formula_time").on(t.formula, t.createdAt),
  index("jaguar_sale_member_time").on(t.memberId, t.createdAt),
]);

export const loyaltyRequests = pgTable("jaguar_point_requests", {
  requestId: uuid("request_id").primaryKey(),
  memberId: uuid("member_id").notNull().references(() => loyaltyMembers.id),
  points: integer("points").notNull(),
}, (t) => [check("jaguar_credit_amount", sql`${t.points} between 1 and 20`)]);

export const loyaltySettings = pgTable("jaguar_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
