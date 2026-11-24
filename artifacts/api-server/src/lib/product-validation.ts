import { LoyaltyError } from "./loyalty-errors";

export type ProductFields = {
  name: string;
  description: string;
  price_baht: number;
  category?: string;
  stock_quantity?: number | null;
  stock_unit?: string | null;
  reference_image_path?: string | null;
  is_active?: boolean;
};

export type ImportedOwnerProduct = {
  name: string;
  category: string;
  description: string;
  price_baht: number;
  stock_quantity?: number | null;
  stock_unit?: string | null;
};

export function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

export function normalizeText(value: string, min: number, max: number, label: string): string {
  const text = value.normalize("NFC").trim();
  if (Array.from(text).length < min || Array.from(text).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    fail(400, `${label}ต้องมี ${min}–${max} ตัวอักษร`);
  }
  return text;
}

export function normalizeFields(input: ProductFields): ProductFields {
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

export function normalizeImportedProducts(rows: ImportedOwnerProduct[]) {
  if (rows.length < 1 || rows.length > 200) fail(400, "ไฟล์นำเข้าต้องมีสินค้า 1–200 รายการ");
  return rows.map((row) => {
    const fields = normalizeFields(row);
    const stockQuantity = fields.stock_quantity ?? null;
    const stockUnit = fields.stock_unit ?? null;
    if (stockQuantity !== null && stockUnit === null) {
      fail(400, "เมื่อระบุจำนวนคงเหลือ ต้องระบุหน่วยสต็อกด้วย");
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
}
