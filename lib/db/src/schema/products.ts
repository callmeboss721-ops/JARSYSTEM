import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const jaguarProducts = pgTable("jaguar_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceBaht: integer("price_baht").notNull(),
  referenceImagePath: text("reference_image_path"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("jaguar_product_name_length", sql`char_length(btrim(${t.name})) between 1 and 120`),
  check("jaguar_product_description_length", sql`char_length(${t.description}) <= 600`),
  check("jaguar_product_price_range", sql`${t.priceBaht} between 1 and 100000000`),
  check("jaguar_product_image_path_shape", sql`${t.referenceImagePath} is null or ${t.referenceImagePath} ~ '^/objects/uploads/[0-9a-f-]{36}$'`),
  index("jaguar_product_active_updated").on(t.isActive, t.updatedAt),
]);

export const insertJaguarProductSchema = createInsertSchema(jaguarProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJaguarProduct = z.infer<typeof insertJaguarProductSchema>;
export type JaguarProduct = typeof jaguarProducts.$inferSelect;
