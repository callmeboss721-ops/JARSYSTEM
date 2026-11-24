import { createHash } from "node:crypto";
import { pool } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";
import {
  calculateStockDeduction,
  QuickSaleValidationError,
  normalizeQuickSaleItems,
  UUID_PATTERN,
  validateBusinessDate,
} from "./product-sales-rules";

const PRIVATE_OBJECT_PATTERN = /^\/objects\/uploads\/[0-9a-f-]{36}$/i;
const MAX_SALE_BAHT = 100_000_000;

export type QuickSalePaymentMethod = "cash" | "transfer" | "other";
export type QuickSaleItemInput = { product_id: string; quantity: number };
export type QuickSaleInput = {
  request_id: string;
  payment_method: QuickSalePaymentMethod;
  items: QuickSaleItemInput[];
  slip_path: string | null;
};

export type QuickSaleProduct = {
  id: string;
  name: string;
  category: string;
  price_baht: number;
  stock_quantity: number | null;
  stock_unit: string | null;
  has_image: boolean;
};

export type QuickSaleItem = {
  id: string;
  product_id: string;
  name: string;
  category: string;
  unit_price_baht: number;
  quantity: number;
  line_total_baht: number;
  stock_unit: string | null;
  stock_tracked: boolean;
  stock_deducted_quantity: number;
  stock_shortage_quantity: number;
  stock_reversed_quantity: number;
};

export type QuickSale = {
  id: string;
  request_id: string;
  payment_method: QuickSalePaymentMethod;
  amount_baht: number;
  status: "completed" | "voided";
  created_at: string;
  recorded_by: "staff" | "owner";
  has_slip: boolean;
  voided_at: string | null;
  void_reason: string | null;
  items: QuickSaleItem[];
};

export type QuickSaleList = {
  business_date: string;
  total_amount_baht: number;
  completed_count: number;
  voided_count: number;
  sales: QuickSale[];
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price_baht: number;
  stock_quantity: number | null;
  stock_unit: string | null;
};

type SaleRow = Omit<QuickSale, "items">;
type SaleItemRow = QuickSaleItem & { sale_id: string };

function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

function withRuleErrors<T>(action: () => T): T {
  try {
    return action();
  } catch (error) {
    if (error instanceof QuickSaleValidationError) fail(error.status, error.message);
    throw error;
  }
}

function normalizeReason(value: string): string {
  const reason = value.normalize("NFC").trim();
  if (Array.from(reason).length < 3 || Array.from(reason).length > 200 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(reason)) {
    fail(400, "เหตุผลต้องมี 3–200 ตัวอักษร");
  }
  return reason;
}

function businessDateOrFail(value?: string): string {
  return withRuleErrors(() => validateBusinessDate(value));
}

function requestHash(input: QuickSaleInput, items: QuickSaleItemInput[]): string {
  return createHash("sha256").update(JSON.stringify({
    payment_method: input.payment_method,
    items,
    slip_path: input.slip_path,
  })).digest("hex");
}

async function getItemsBySaleIds(saleIds: string[]): Promise<Map<string, QuickSaleItem[]>> {
  const bySale = new Map<string, QuickSaleItem[]>();
  if (!saleIds.length) return bySale;
  const result = await pool.query<SaleItemRow>(
    `select id::text as id,sale_id::text as sale_id,product_id::text as product_id,
       product_name as name,product_category as category,unit_price_baht,quantity,line_total_baht,
       stock_unit,stock_tracked,stock_deducted_quantity,stock_shortage_quantity,stock_reversed_quantity
     from jaguar_product_sale_items
     where sale_id = any($1::uuid[])
     order by sale_id,product_name`,
    [saleIds],
  );
  for (const item of result.rows) {
    const { sale_id, ...saleItem } = item;
    const items = bySale.get(sale_id) ?? [];
    items.push(saleItem);
    bySale.set(sale_id, items);
  }
  return bySale;
}

function withItems(row: SaleRow, itemsBySale: Map<string, QuickSaleItem[]>): QuickSale {
  return { ...row, items: itemsBySale.get(row.id) ?? [] };
}

async function getSaleById(id: string): Promise<QuickSale> {
  const result = await pool.query<SaleRow>(
    `select id::text as id,request_id::text as request_id,payment_method,amount_baht,status,
       created_at::text as created_at,recorded_by,(slip_path is not null) as has_slip,
       voided_at::text as voided_at,void_reason
     from jaguar_product_sales where id=$1`,
    [id],
  );
  const sale = result.rows[0];
  if (!sale) fail(404, "ไม่พบรายการขาย");
  return withItems(sale, await getItemsBySaleIds([sale.id]));
}

export async function listStaffSaleProducts(): Promise<QuickSaleProduct[]> {
  const result = await pool.query<QuickSaleProduct>(
    `select id::text as id,name,category,price_baht,stock_quantity,stock_unit,
       (reference_image_path is not null) as has_image
     from jaguar_products
     where is_active=true
     order by category asc,name asc
     limit 500`,
  );
  return result.rows;
}

export async function listQuickSales(dateInput?: string): Promise<QuickSaleList> {
  const businessDate = businessDateOrFail(dateInput);
  const [summary, salesResult] = await Promise.all([
    pool.query<{ total_amount_baht: string; completed_count: number; voided_count: number }>(
      `select coalesce(sum(amount_baht) filter (where status='completed'),0)::text as total_amount_baht,
         count(*) filter (where status='completed')::int as completed_count,
         count(*) filter (where status='voided')::int as voided_count
       from jaguar_product_sales
       where created_at >= ($1::date::timestamp at time zone 'Asia/Bangkok')
         and created_at < (($1::date + 1)::timestamp at time zone 'Asia/Bangkok')`,
      [businessDate],
    ),
    pool.query<SaleRow>(
      `select id::text as id,request_id::text as request_id,payment_method,amount_baht,status,
         created_at::text as created_at,recorded_by,(slip_path is not null) as has_slip,
         voided_at::text as voided_at,void_reason
       from jaguar_product_sales
       where created_at >= ($1::date::timestamp at time zone 'Asia/Bangkok')
         and created_at < (($1::date + 1)::timestamp at time zone 'Asia/Bangkok')
       order by created_at desc,id desc limit 100`,
      [businessDate],
    ),
  ]);
  const totals = summary.rows[0];
  if (!totals) fail(503, "โหลดสรุปยอดขายไม่สำเร็จ กรุณาลองใหม่");
  const totalAmount = Number(totals.total_amount_baht);
  if (!Number.isSafeInteger(totalAmount)) fail(503, "ยอดขายสะสมเกินขอบเขตที่ระบบรองรับ");
  const sales = salesResult.rows;
  const itemsBySale = await getItemsBySaleIds(sales.map((sale) => sale.id));
  return {
    business_date: businessDate,
    total_amount_baht: totalAmount,
    completed_count: totals.completed_count,
    voided_count: totals.voided_count,
    sales: sales.map((sale) => withItems(sale, itemsBySale)),
  };
}

export async function createQuickSale(input: QuickSaleInput): Promise<QuickSale> {
  if (!UUID_PATTERN.test(input.request_id)) fail(400, "รหัสคำขอไม่ถูกต้อง");
  if (!["cash", "transfer", "other"].includes(input.payment_method)) fail(400, "วิธีชำระเงินไม่ถูกต้อง");
  if (input.slip_path !== null && !PRIVATE_OBJECT_PATTERN.test(input.slip_path)) {
    fail(400, "ไฟล์แนบไม่ถูกต้อง");
  }
  const items = withRuleErrors(() => normalizeQuickSaleItems(input.items));
  const hash = requestHash(input, items);
  const existing = await pool.query<{ id: string; request_hash: string }>(
    "select id::text as id,request_hash from jaguar_product_sales where request_id=$1",
    [input.request_id],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== hash) fail(409, "รหัสคำขอนี้ถูกใช้กับรายการอื่นแล้ว กรุณาลองบันทึกใหม่");
    return getSaleById(existing.rows[0].id);
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const productIds = items.map((item) => item.product_id);
    const productResult = await client.query<ProductRow>(
      `select id::text as id,name,category,price_baht,stock_quantity,stock_unit
       from jaguar_products
       where id=any($1::uuid[]) and is_active=true
       order by id
       for update`,
      [productIds],
    );
    if (productResult.rows.length !== items.length) {
      fail(409, "มีสินค้าถูกปิดใช้งานหรือไม่พบในคลัง กรุณาโหลดรายการสินค้าใหม่");
    }
    const products = new Map(productResult.rows.map((product) => [product.id, product]));
    const lines = items.map((item) => {
      const product = products.get(item.product_id);
      if (!product) fail(409, "ไม่พบสินค้าที่เลือก");
      const lineTotal = product.price_baht * item.quantity;
      if (!Number.isSafeInteger(lineTotal) || lineTotal < 1 || lineTotal > MAX_SALE_BAHT) {
        fail(400, "ยอดต่อรายการต้องไม่เกิน 100,000,000 บาท");
      }
      return { input: item, product, lineTotal };
    });
    const amount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_SALE_BAHT) {
      fail(400, "ยอดรวมต่อบิลต้องไม่เกิน 100,000,000 บาท");
    }

    const header = await client.query<{ id: string }>(
      `insert into jaguar_product_sales(request_id,request_hash,payment_method,amount_baht,recorded_by,slip_path)
       values($1,$2,$3,$4,'staff',$5)
       returning id::text as id`,
      [input.request_id, hash, input.payment_method, amount, input.slip_path],
    );
    const saleId = header.rows[0]?.id;
    if (!saleId) fail(503, "บันทึกรายการขายไม่สำเร็จ กรุณาลองใหม่");

    for (const line of lines) {
      const { product, input: saleItem } = line;
      const stock = withRuleErrors(() => calculateStockDeduction(product.stock_quantity, saleItem.quantity));
      if (stock.tracked && stock.newQuantity !== null) {
        await client.query(
          "update jaguar_products set stock_quantity=$2,updated_at=now() where id=$1",
          [product.id, stock.newQuantity],
        );
        if (stock.deductedQuantity > 0 && product.stock_unit) {
          await client.query(
            `insert into jaguar_product_stock_events(product_id,previous_quantity,new_quantity,stock_unit,reason,source)
             values($1,$2,$3,$4,$5,'sale')`,
            [product.id, product.stock_quantity, stock.newQuantity, product.stock_unit, `ขายสินค้า บิล ${saleId.slice(0, 8)}`],
          );
        }
      }
      await client.query(
        `insert into jaguar_product_sale_items(
           sale_id,product_id,product_name,product_category,unit_price_baht,quantity,line_total_baht,
           stock_unit,stock_tracked,stock_deducted_quantity,stock_shortage_quantity
         ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          saleId,
          product.id,
          product.name,
          product.category,
          product.price_baht,
          saleItem.quantity,
          line.lineTotal,
          product.stock_unit,
          stock.tracked,
          stock.deductedQuantity,
          stock.shortageQuantity,
        ],
      );
    }
    await client.query("commit");
    return getSaleById(saleId);
  } catch (error) {
    await client.query("rollback");
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      const duplicate = await pool.query<{ id: string; request_hash: string }>(
        "select id::text as id,request_hash from jaguar_product_sales where request_id=$1",
        [input.request_id],
      );
      if (duplicate.rows[0]?.request_hash === hash) return getSaleById(duplicate.rows[0].id);
      if (duplicate.rows[0]) fail(409, "รหัสคำขอนี้ถูกใช้กับรายการอื่นแล้ว กรุณาลองบันทึกใหม่");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function voidQuickSale(id: string, reasonInput: string): Promise<QuickSale> {
  if (!UUID_PATTERN.test(id)) fail(400, "รหัสรายการขายไม่ถูกต้อง");
  const reason = normalizeReason(reasonInput);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const saleResult = await client.query<{ status: string }>(
      "select status from jaguar_product_sales where id=$1 for update",
      [id],
    );
    const sale = saleResult.rows[0];
    if (!sale) fail(404, "ไม่พบรายการขาย");
    if (sale.status === "voided") {
      await client.query("commit");
      return getSaleById(id);
    }

    const itemResult = await client.query<{
      id: string;
      product_id: string;
      stock_tracked: boolean;
      stock_deducted_quantity: number;
      stock_reversed_quantity: number;
    }>(
      `select id::text as id,product_id::text as product_id,stock_tracked,
         stock_deducted_quantity,stock_reversed_quantity
       from jaguar_product_sale_items where sale_id=$1 order by product_id`,
      [id],
    );
    if (!itemResult.rows.length) fail(409, "รายการขายไม่มีสินค้า กรุณาติดต่อเจ้าของร้าน");
    const trackedItems = itemResult.rows.filter((item) => item.stock_tracked && item.stock_deducted_quantity > 0);
    const productIds = [...new Set(trackedItems.map((item) => item.product_id))].sort();
    const products = new Map<string, { stock_quantity: number | null; stock_unit: string | null }>();
    if (productIds.length) {
      const locked = await client.query<{ id: string; stock_quantity: number | null; stock_unit: string | null }>(
        `select id::text as id,stock_quantity,stock_unit
         from jaguar_products where id=any($1::uuid[]) order by id for update`,
        [productIds],
      );
      for (const product of locked.rows) products.set(product.id, product);
      if (products.size !== productIds.length) fail(409, "สินค้าบางรายการไม่อยู่ในคลัง กรุณาตรวจสอบกับเจ้าของร้านก่อนยกเลิก");
    }

    for (const item of trackedItems) {
      if (item.stock_reversed_quantity !== 0) fail(409, "สต็อกของรายการนี้ถูกคืนแล้ว");
      const product = products.get(item.product_id);
      if (!product || product.stock_quantity === null || !product.stock_unit) {
        fail(409, "สินค้าบางรายการไม่ได้ติดตามสต็อกแล้ว กรุณาตรวจนับก่อนยกเลิก");
      }
      const nextQuantity = product.stock_quantity + item.stock_deducted_quantity;
      if (nextQuantity > 1_000_000) fail(409, "การคืนสต็อกจะเกินเพดาน กรุณาปรับจำนวนคงเหลือก่อน");
      await client.query(
        "update jaguar_products set stock_quantity=$2,updated_at=now() where id=$1",
        [item.product_id, nextQuantity],
      );
      await client.query(
        `insert into jaguar_product_stock_events(product_id,previous_quantity,new_quantity,stock_unit,reason,source)
         values($1,$2,$3,$4,$5,'sale_void')`,
        [item.product_id, product.stock_quantity, nextQuantity, product.stock_unit, `คืนสต็อกจากบิล ${id.slice(0, 8)}`],
      );
      await client.query(
        "update jaguar_product_sale_items set stock_reversed_quantity=stock_deducted_quantity where id=$1",
        [item.id],
      );
    }
    await client.query(
      `update jaguar_product_sales set status='voided',voided_at=now(),void_reason=$2,voided_by='staff'
       where id=$1`,
      [id, reason],
    );
    await client.query("commit");
    return getSaleById(id);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getProductSaleSlipPath(id: string): Promise<string> {
  const result = await pool.query<{ slip_path: string | null }>(
    "select slip_path from jaguar_product_sales where id=$1",
    [id],
  );
  const slipPath = result.rows[0]?.slip_path;
  if (!slipPath) fail(404, "ไม่พบสลิปของรายการนี้");
  return slipPath;
}
