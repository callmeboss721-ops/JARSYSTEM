import { sql } from "drizzle-orm";
import { bigint, boolean, check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const jaguarBankAccounts = pgTable("jaguar_bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolder: text("account_holder").notNull(),
  dailyLimitSatang: bigint("daily_limit_satang", { mode: "number" }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("jaguar_bank_account_number_digits", sql`${table.accountNumber} ~ '^[0-9]{6,20}$'`),
  check("jaguar_bank_daily_limit_positive", sql`${table.dailyLimitSatang} > 0`),
  index("jaguar_bank_accounts_active_created").on(table.isActive, table.createdAt),
]);

export const jaguarDailyReceivingAccounts = pgTable("jaguar_daily_receiving_accounts", {
  businessDate: date("business_date", { mode: "string" }).primaryKey(),
  accountId: uuid("account_id").notNull().references(() => jaguarBankAccounts.id),
  selectedBy: text("selected_by").notNull().default("owner"),
  selectedAt: timestamp("selected_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("jaguar_daily_receiving_selected_by", sql`${table.selectedBy} in ('owner')`),
  index("jaguar_daily_receiving_account").on(table.accountId, table.businessDate),
]);

export const jaguarBankTransfers = pgTable("jaguar_bank_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().unique(),
  accountId: uuid("account_id").notNull().references(() => jaguarBankAccounts.id),
  businessDate: date("business_date", { mode: "string" }).notNull(),
  direction: text("direction").notNull(),
  amountSatang: bigint("amount_satang", { mode: "number" }).notNull(),
  note: text("note").notNull().default(""),
  recordedBy: text("recorded_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("jaguar_bank_transfer_direction", sql`${table.direction} in ('in','out')`),
  check("jaguar_bank_transfer_amount_positive", sql`${table.amountSatang} > 0`),
  check("jaguar_bank_transfer_recorded_by", sql`${table.recordedBy} in ('staff','owner')`),
  index("jaguar_bank_transfer_day_account").on(table.businessDate, table.accountId, table.createdAt),
]);
