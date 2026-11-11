import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const loyaltyMembers = pgTable("jaguar_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberCode: text("member_code").notNull().unique(),
  displayName: text("display_name").notNull().default("สมาชิก"),
  nickname: text("nickname"),
  phoneE164: text("phone_e164").unique(),
  qrTokenHash: text("qr_token_hash").unique(),
  isDemo: boolean("is_demo").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_member_code_compact", sql`${t.memberCode} ~ '^[A-Z0-9][A-Z0-9-]{4,6}[A-Z0-9]$'`),
  check("jaguar_member_nickname_shape", sql`${t.nickname} is null or (
    ${t.nickname} = btrim(${t.nickname}) and char_length(${t.nickname}) between 2 and 20
    and ${t.nickname} !~ '^[0-9]+$'
    and ${t.nickname} !~ '^\\+?([0-9][0-9 ()-]{7,18})$'
  )`),
  uniqueIndex("jaguar_member_nickname_normalized_unique").on(sql`lower(btrim(${t.nickname}))`).where(sql`${t.nickname} is not null`),
]);

export const loyaltyBalances = pgTable("jaguar_point_balances", {
  memberId: uuid("member_id").primaryKey().references(() => loyaltyMembers.id),
  balance: integer("balance").notNull().default(0),
  cannabisBalance: integer("cannabis_balance"),
  kratomAmountRemainder: integer("kratom_amount_remainder").notNull().default(0),
  cannabisGramsRemainder: integer("cannabis_grams_remainder").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
}, (t) => [
  check("jaguar_balances_nonnegative", sql`${t.balance} >= 0 and ${t.lifetimeEarned} >= 0 and ${t.lifetimeRedeemed} >= 0`),
  check("jaguar_cannabis_point_balance_nonnegative", sql`${t.cannabisBalance} is null or ${t.cannabisBalance} >= 0`),
  check("jaguar_point_remainders_range", sql`${t.kratomAmountRemainder} between 0 and 99 and ${t.cannabisGramsRemainder} between 0 and 99`),
]);

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
  pointsPolicy: text("points_policy").notNull().default("legacy-bottle-v1"),
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

export const loyaltySecurityLimits = pgTable("jaguar_security_limits", {
  keyHash: text("key_hash").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull().defaultNow(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_security_limit_attempts_nonnegative", sql`${t.attempts} >= 0`),
  index("jaguar_security_limit_updated").on(t.updatedAt),
]);

export const loyaltyPolicySnapshots = pgTable("jaguar_points_policy_snapshots", {
  memberId: uuid("member_id").primaryKey().references(() => loyaltyMembers.id),
  policyVersion: text("policy_version").notNull(),
  oldKratomBalance: integer("old_kratom_balance").notNull(),
  oldKratomLifetimeEarned: integer("old_kratom_lifetime_earned").notNull(),
  oldKratomLifetimeRedeemed: integer("old_kratom_lifetime_redeemed").notNull(),
  oldCannabisBalance: integer("old_cannabis_balance").notNull(),
  oldCannabisLifetimeEarned: integer("old_cannabis_lifetime_earned").notNull(),
  oldCannabisLifetimeRedeemed: integer("old_cannabis_lifetime_redeemed").notNull(),
  migratedAt: timestamp("migrated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("jaguar_points_snapshot_policy").on(t.policyVersion, t.migratedAt)]);
