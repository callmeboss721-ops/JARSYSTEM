import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const jaguarProducts = pgTable("jaguar_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull().default("ยังไม่จัดหมวด"),
  description: text("description").notNull().default(""),
  priceBaht: integer("price_baht").notNull(),
  stockQuantity: integer("stock_quantity"),
  stockUnit: text("stock_unit"),
  referenceImagePath: text("reference_image_path"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_product_name_length", sql`char_length(btrim(${t.name})) between 1 and 120`),
  check("jaguar_product_category_length", sql`char_length(btrim(${t.category})) between 1 and 80`),
  check("jaguar_product_description_length", sql`char_length(${t.description}) <= 600`),
  check("jaguar_product_price_range", sql`${t.priceBaht} between 1 and 100000000`),
  check("jaguar_product_stock_range", sql`${t.stockQuantity} is null or ${t.stockQuantity} between 0 and 1000000`),
  check("jaguar_product_stock_unit_length", sql`${t.stockUnit} is null or char_length(btrim(${t.stockUnit})) between 1 and 24`),
  check("jaguar_product_image_path_shape", sql`${t.referenceImagePath} is null or ${t.referenceImagePath} ~ '^/objects/uploads/[0-9a-f-]{36}$'`),
  index("jaguar_product_active_updated").on(t.isActive, t.updatedAt),
]);

export const jaguarProductStockEvents = pgTable("jaguar_product_stock_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => jaguarProducts.id, { onDelete: "restrict" }),
  previousQuantity: integer("previous_quantity"),
  newQuantity: integer("new_quantity").notNull(),
  stockUnit: text("stock_unit").notNull(),
  reason: text("reason").notNull(),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_product_stock_event_previous_range", sql`${t.previousQuantity} is null or ${t.previousQuantity} between 0 and 1000000`),
  check("jaguar_product_stock_event_new_range", sql`${t.newQuantity} between 0 and 1000000`),
  check("jaguar_product_stock_event_unit_length", sql`char_length(btrim(${t.stockUnit})) between 1 and 24`),
  check("jaguar_product_stock_event_reason_length", sql`char_length(btrim(${t.reason})) between 1 and 160`),
  check("jaguar_product_stock_event_source", sql`${t.source} in ('manual','import')`),
  index("jaguar_product_stock_event_product_created").on(t.productId, t.createdAt),
]);

export const insertJaguarProductSchema = createInsertSchema(jaguarProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJaguarProduct = z.infer<typeof insertJaguarProductSchema>;
export type JaguarProduct = typeof jaguarProducts.$inferSelect;
