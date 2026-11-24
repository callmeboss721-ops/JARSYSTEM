import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { jaguarProducts } from "./products";

export const jaguarProductSales = pgTable("jaguar_product_sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().unique(),
  requestHash: text("request_hash").notNull(),
  paymentMethod: text("payment_method").notNull(),
  amountBaht: integer("amount_baht").notNull(),
  status: text("status").notNull().default("completed"),
  recordedBy: text("recorded_by").notNull(),
  slipPath: text("slip_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  voidedBy: text("voided_by"),
}, (t) => [
  check("jaguar_product_sale_request_hash_shape", sql`${t.requestHash} ~ '^[0-9a-f]{64}$'`),
  check("jaguar_product_sale_payment_method", sql`${t.paymentMethod} in ('cash','transfer','other')`),
  check("jaguar_product_sale_amount_range", sql`${t.amountBaht} between 1 and 100000000`),
  check("jaguar_product_sale_status", sql`${t.status} in ('completed','voided')`),
  check("jaguar_product_sale_recorded_by", sql`${t.recordedBy} in ('staff','owner')`),
  check("jaguar_product_sale_slip_path", sql`${t.slipPath} is null or ${t.slipPath} ~ '^/objects/uploads/[0-9a-fA-F-]{36}$'`),
  check("jaguar_product_sale_void_state", sql`
    (${t.status} = 'completed' and ${t.voidedAt} is null and ${t.voidReason} is null and ${t.voidedBy} is null)
    or
    (${t.status} = 'voided' and ${t.voidedAt} is not null and ${t.voidReason} is not null and ${t.voidedBy} is not null)
  `),
  check("jaguar_product_sale_void_reason_length", sql`${t.voidReason} is null or char_length(btrim(${t.voidReason})) between 3 and 200`),
  index("jaguar_product_sale_created").on(t.createdAt),
  index("jaguar_product_sale_status_created").on(t.status, t.createdAt),
]);

export const jaguarProductSaleItems = pgTable("jaguar_product_sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => jaguarProductSales.id, { onDelete: "restrict" }),
  productId: uuid("product_id").notNull().references(() => jaguarProducts.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  productCategory: text("product_category").notNull(),
  unitPriceBaht: integer("unit_price_baht").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalBaht: integer("line_total_baht").notNull(),
  stockUnit: text("stock_unit"),
  stockTracked: boolean("stock_tracked").notNull(),
  stockDeductedQuantity: integer("stock_deducted_quantity").notNull().default(0),
  stockShortageQuantity: integer("stock_shortage_quantity").notNull().default(0),
  stockReversedQuantity: integer("stock_reversed_quantity").notNull().default(0),
}, (t) => [
  check("jaguar_product_sale_item_name_length", sql`char_length(btrim(${t.productName})) between 1 and 120`),
  check("jaguar_product_sale_item_category_length", sql`char_length(btrim(${t.productCategory})) between 1 and 80`),
  check("jaguar_product_sale_item_price_range", sql`${t.unitPriceBaht} between 1 and 100000000`),
  check("jaguar_product_sale_item_quantity_range", sql`${t.quantity} between 1 and 999`),
  check("jaguar_product_sale_item_total_range", sql`${t.lineTotalBaht} = (${t.unitPriceBaht}::bigint * ${t.quantity}::bigint) and ${t.lineTotalBaht} between 1 and 100000000`),
  check("jaguar_product_sale_item_stock_counts", sql`
    ${t.stockDeductedQuantity} between 0 and ${t.quantity}
    and ${t.stockShortageQuantity} between 0 and ${t.quantity}
    and ${t.stockReversedQuantity} between 0 and ${t.stockDeductedQuantity}
    and (
      (${t.stockTracked} and ${t.stockDeductedQuantity} + ${t.stockShortageQuantity} = ${t.quantity})
      or
      (not ${t.stockTracked} and ${t.stockDeductedQuantity} = 0 and ${t.stockShortageQuantity} = 0)
    )
  `),
  check("jaguar_product_sale_item_stock_unit", sql`${t.stockUnit} is null or char_length(btrim(${t.stockUnit})) between 1 and 24`),
  unique("jaguar_product_sale_item_unique_product").on(t.saleId, t.productId),
  index("jaguar_product_sale_item_sale").on(t.saleId),
  index("jaguar_product_sale_item_product").on(t.productId),
]);

export type JaguarProductSale = typeof jaguarProductSales.$inferSelect;
export type JaguarProductSaleItem = typeof jaguarProductSaleItems.$inferSelect;
