import { pool } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";

export type OwnerProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_baht: number;
  stock_quantity: number | null;
  stock_unit: string | null;
  has_image: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductRow = OwnerProduct & { reference_image_path: string | null };
type ProductFields = {
  name: string;
  description: string;
  price_baht: number;
  category?: string;
  stock_quantity?: number | null;
  stock_unit?: string | null;
  reference_image_path?: string | null;
  is_active?: boolean;
};

export type OwnerProductStockEvent = {
  id: string;
  previous_quantity: number | null;
  new_quantity: number;
  stock_unit: string;
  reason: string;
  source: "manual" | "import";
  created_at: string;
};

export type ImportedOwnerProduct = {
  name: string;
  category: string;
  description: string;
  price_baht: number;
  stock_quantity?: number | null;
  stock_unit?: string | null;
};

const selectProduct = `select id,name,category,description,price_baht,stock_quantity,stock_unit,
  (reference_image_path is not null) as has_image,is_active,
  created_at::text as created_at,updated_at::text as updated_at
  from jaguar_products`;

function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

function normalizeText(value: string, min: number, max: number, label: string): string {
  const text = value.normalize("NFC").trim();
  if (Array.from(text).length < min || Array.from(text).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    fail(400, `${label}ต้องมี ${min}–${max} ตัวอักษร`);
  }
  return text;
}

function normalizeFields(input: ProductFields): ProductFields {
  const name = normalizeText(input.name, 1, 120, "ชื่อสินค้า");
  const description = normalizeText(input.description, 0, 600, "รายละเอียดสินค้า");
  const category = input.category === undefined
    ? undefined
    : normalizeText(input.category, 1, 80, "หมวดสินค้า");
  if (Array.from(name).length < 1 || Array.from(name).length > 120 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(name)) {
    fail(400, "ชื่อสินค้าต้องมี 1–120 ตัวอักษร");
  }
  if (!Number.isSafeInteger(input.price_baht) || input.price_baht < 1 || input.price_baht > 100_000_000) {
    fail(400, "ราคาต้องเป็นจำนวนเต็มตั้งแต่ 1–100,000,000 บาท");
  }
  const stockQuantity = input.stock_quantity;
  if (stockQuantity !== undefined && stockQuantity !== null &&
      (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1_000_000)) {
    fail(400, "สต็อกต้องเป็นจำนวนเต็ม 0–1,000,000");
  }
  const stockUnit = input.stock_unit == null
    ? input.stock_unit
    : normalizeText(input.stock_unit, 1, 24, "หน่วยสต็อก");
  if (stockQuantity !== undefined && stockQuantity !== null && !stockUnit) {
    fail(400, "กรุณาระบุหน่วยสต็อก");
  }
  if (input.reference_image_path != null && !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(input.reference_image_path)) {
    fail(400, "ไฟล์ภาพอ้างอิงไม่ถูกต้อง");
  }
  return { ...input, name, description, ...(category === undefined ? {} : { category }), stock_quantity: stockQuantity, stock_unit: stockUnit };
}

function shape(row: ProductRow): OwnerProduct {
  const { reference_image_path: _privatePath, ...product } = row;
  return product;
}

export async function listOwnerProducts(): Promise<OwnerProduct[]> {
  const result = await pool.query<ProductRow>(
    `${selectProduct} order by is_active desc,category asc,name asc limit 1000`,
  );
  return result.rows.map(shape);
}

export async function createOwnerProduct(input: ProductFields): Promise<OwnerProduct> {
  const fields = normalizeFields(input);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query<ProductRow>(
      `insert into jaguar_products(name,category,description,price_baht,stock_quantity,stock_unit,reference_image_path,is_active)
       values($1,$2,$3,$4,$5,$6,$7,$8) returning id,name,category,description,price_baht,stock_quantity,stock_unit,
          (reference_image_path is not null) as has_image,is_active,
          created_at::text as created_at,updated_at::text as updated_at`,
      [
        fields.name,
        fields.category ?? "ยังไม่จัดหมวด",
        fields.description,
        fields.price_baht,
        fields.stock_quantity ?? null,
        fields.stock_unit ?? null,
        fields.reference_image_path ?? null,
        fields.is_active ?? true,
      ],
    );
    if (!result.rows[0]) fail(503, "เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่");
    if (fields.stock_quantity !== undefined && fields.stock_quantity !== null && fields.stock_unit) {
      await client.query(
        `insert into jaguar_product_stock_events(product_id,previous_quantity,new_quantity,stock_unit,reason,source)
         values($1,null,$2,$3,'กำหนดสต็อกเริ่มต้น','manual')`,
        [result.rows[0].id, fields.stock_quantity, fields.stock_unit],
      );
    }
    await client.query("commit");
    return shape(result.rows[0]);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOwnerProduct(id: string, input: ProductFields): Promise<OwnerProduct> {
  const fields = normalizeFields(input);
  const values: unknown[] = [id, fields.name, fields.description, fields.price_baht, fields.is_active ?? true];
  const assignments = ["name=$2", "description=$3", "price_baht=$4", "is_active=$5", "updated_at=now()"];
  if (fields.category !== undefined) {
    values.push(fields.category);
    assignments.push(`category=$${values.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(input, "reference_image_path")) {
    values.push(fields.reference_image_path ?? null);
    assignments.push(`reference_image_path=$${values.length}`);
  }
  const result = await pool.query<ProductRow>(
    `update jaguar_products set ${assignments.join(",")}
     where id=$1
     returning id,name,category,description,price_baht,stock_quantity,stock_unit,
       (reference_image_path is not null) as has_image,is_active,
       created_at::text as created_at,updated_at::text as updated_at`,
    values,
  );
  if (!result.rows[0]) fail(404, "ไม่พบสินค้าที่ต้องการแก้ไข");
  return shape(result.rows[0]);
}

export async function updateOwnerProductStock(
  id: string,
  input: { quantity: number; stock_unit: string; reason: string },
): Promise<OwnerProduct> {
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 0 || input.quantity > 1_000_000) {
    fail(400, "สต็อกต้องเป็นจำนวนเต็ม 0–1,000,000");
  }
  const stockUnit = normalizeText(input.stock_unit, 1, 24, "หน่วยสต็อก");
  const reason = normalizeText(input.reason, 1, 160, "เหตุผล");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const current = (await client.query<{ stock_quantity: number | null; stock_unit: string | null }>(
      "select stock_quantity,stock_unit from jaguar_products where id=$1 for update",
      [id],
    )).rows[0];
    if (!current) fail(404, "ไม่พบสินค้าที่ต้องการแก้ไข");
    if (current.stock_unit && current.stock_unit !== stockUnit) {
      fail(409, `หน่วยสต็อกเดิมคือ ${current.stock_unit} กรุณาใช้หน่วยเดิม`);
    }
    const result = await client.query<ProductRow>(
      `update jaguar_products set stock_quantity=$2,stock_unit=$3,updated_at=now()
       where id=$1 returning id,name,category,description,price_baht,stock_quantity,stock_unit,
         (reference_image_path is not null) as has_image,is_active,
         created_at::text as created_at,updated_at::text as updated_at`,
      [id, input.quantity, stockUnit],
    );
    if (!result.rows[0]) fail(503, "บันทึกสต็อกไม่สำเร็จ กรุณาลองใหม่");
    await client.query(
      `insert into jaguar_product_stock_events(product_id,previous_quantity,new_quantity,stock_unit,reason,source)
       values($1,$2,$3,$4,$5,'manual')`,
      [id, current.stock_quantity, input.quantity, stockUnit, reason],
    );
    await client.query("commit");
    return shape(result.rows[0]);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOwnerProductStockHistory(id: string): Promise<OwnerProductStockEvent[]> {
  const result = await pool.query<OwnerProductStockEvent>(
    `select id::text,previous_quantity,new_quantity,stock_unit,reason,source,
       created_at::text as created_at
     from jaguar_product_stock_events where product_id=$1
     order by created_at desc,id desc limit 10`,
    [id],
  );
  return result.rows;
}

export async function importOwnerProducts(rows: ImportedOwnerProduct[]): Promise<{ created_count: number; skipped_count: number }> {
  if (rows.length < 1 || rows.length > 200) fail(400, "ไฟล์นำเข้าต้องมีสินค้า 1–200 รายการ");
  const products = rows.map((row) => {
    const fields = normalizeFields(row);
    const stockQuantity = fields.stock_quantity ?? null;
    const stockUnit = fields.stock_unit ?? null;
    if ((stockQuantity === null) !== (stockUnit === null)) {
      fail(400, "ระบุทั้งจำนวนและหน่วยสต็อก หรือเว้นว่างทั้งคู่เมื่อยังไม่ทราบ");
    }
    return {
      name: fields.name,
      category: fields.category ?? "ยังไม่จัดหมวด",
      description: fields.description,
      price_baht: fields.price_baht,
      stock_quantity: stockQuantity,
      stock_unit: stockUnit,
    };
  });
  const client = await pool.connect();
  let createdCount = 0;
  let skippedCount = 0;
  const seen = new Set<string>();
  try {
    await client.query("begin");
    for (const product of products) {
      const category = product.category ?? "ยังไม่จัดหมวด";
      const key = `${category.toLocaleLowerCase("th-TH")}\u0000${product.name.toLocaleLowerCase("th-TH")}`;
      if (seen.has(key)) {
        skippedCount += 1;
        continue;
      }
      seen.add(key);
      const exists = await client.query(
        `select id from jaguar_products
         where lower(name)=lower($1) and lower(category)=lower($2) limit 1`,
        [product.name, category],
      );
      if (exists.rowCount) {
        skippedCount += 1;
        continue;
      }
      const inserted = await client.query<{ id: string }>(
        `insert into jaguar_products(name,category,description,price_baht,stock_quantity,stock_unit,is_active)
         values($1,$2,$3,$4,$5,$6,true) returning id`,
        [product.name, category, product.description, product.price_baht, product.stock_quantity, product.stock_unit],
      );
      if (product.stock_quantity !== null && product.stock_unit !== null) {
        await client.query(
          `insert into jaguar_product_stock_events(product_id,previous_quantity,new_quantity,stock_unit,reason,source)
           values($1,null,$2,$3,'นำเข้าจากไฟล์ CSV','import')`,
          [inserted.rows[0].id, product.stock_quantity, product.stock_unit],
        );
      }
      createdCount += 1;
    }
    await client.query("commit");
    return { created_count: createdCount, skipped_count: skippedCount };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOwnerProductImagePath(id: string): Promise<string> {
  const result = await pool.query<{ reference_image_path: string | null }>(
    "select reference_image_path from jaguar_products where id=$1",
    [id],
  );
  const path = result.rows[0]?.reference_image_path;
  if (!path) fail(404, "ไม่พบภาพอ้างอิงสินค้า");
  return path;
}
