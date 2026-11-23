import { pool } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";

export type OwnerProduct = {
  id: string;
  name: string;
  description: string;
  price_baht: number;
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
  reference_image_path?: string | null;
  is_active?: boolean;
};

const selectProduct = `select id,name,description,price_baht,
  (reference_image_path is not null) as has_image,is_active,
  created_at::text as created_at,updated_at::text as updated_at
  from jaguar_products`;

function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

function normalizeFields(input: ProductFields): ProductFields {
  const name = input.name.normalize("NFC").trim();
  const description = input.description.normalize("NFC").trim();
  if (Array.from(name).length < 1 || Array.from(name).length > 120 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(name)) {
    fail(400, "ชื่อสินค้าต้องมี 1–120 ตัวอักษร");
  }
  if (Array.from(description).length > 600 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(description)) {
    fail(400, "รายละเอียดสินค้ายาวเกินกำหนด");
  }
  if (!Number.isSafeInteger(input.price_baht) || input.price_baht < 1 || input.price_baht > 100_000_000) {
    fail(400, "ราคาต้องเป็นจำนวนเต็มตั้งแต่ 1–100,000,000 บาท");
  }
  if (input.reference_image_path != null && !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(input.reference_image_path)) {
    fail(400, "ไฟล์ภาพอ้างอิงไม่ถูกต้อง");
  }
  return { ...input, name, description };
}

function shape(row: ProductRow): OwnerProduct {
  const { reference_image_path: _privatePath, ...product } = row;
  return product;
}

export async function listOwnerProducts(): Promise<OwnerProduct[]> {
  const result = await pool.query<ProductRow>(
    `${selectProduct} order by is_active desc,updated_at desc,name asc limit 200`,
  );
  return result.rows.map(shape);
}

export async function createOwnerProduct(input: ProductFields): Promise<OwnerProduct> {
  const fields = normalizeFields(input);
  const result = await pool.query<ProductRow>(
    `insert into jaguar_products(name,description,price_baht,reference_image_path,is_active)
     values($1,$2,$3,$4,$5) returning id,name,description,price_baht,
       (reference_image_path is not null) as has_image,is_active,
       created_at::text as created_at,updated_at::text as updated_at`,
    [
      fields.name,
      fields.description,
      fields.price_baht,
      fields.reference_image_path ?? null,
      fields.is_active ?? true,
    ],
  );
  if (!result.rows[0]) fail(503, "เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่");
  return shape(result.rows[0]);
}

export async function updateOwnerProduct(id: string, input: ProductFields): Promise<OwnerProduct> {
  const fields = normalizeFields(input);
  const values: unknown[] = [id, fields.name, fields.description, fields.price_baht, fields.is_active ?? true];
  const assignments = ["name=$2", "description=$3", "price_baht=$4", "is_active=$5", "updated_at=now()"];
  if (Object.prototype.hasOwnProperty.call(input, "reference_image_path")) {
    values.push(fields.reference_image_path ?? null);
    assignments.push(`reference_image_path=$${values.length}`);
  }
  const result = await pool.query<ProductRow>(
    `update jaguar_products set ${assignments.join(",")}
     where id=$1
     returning id,name,description,price_baht,
       (reference_image_path is not null) as has_image,is_active,
       created_at::text as created_at,updated_at::text as updated_at`,
    values,
  );
  if (!result.rows[0]) fail(404, "ไม่พบสินค้าที่ต้องการแก้ไข");
  return shape(result.rows[0]);
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
