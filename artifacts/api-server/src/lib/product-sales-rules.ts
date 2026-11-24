export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class QuickSaleValidationError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function fail(status: number, message: string): never {
  throw new QuickSaleValidationError(status, message);
}

export type QuickSaleItemInput = { product_id: string; quantity: number };

export function normalizeQuickSaleItems(items: QuickSaleItemInput[]): QuickSaleItemInput[] {
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
    fail(400, "เลือกสินค้า 1–30 รายการต่อบิล");
  }
  const combined = new Map<string, number>();
  for (const item of items) {
    if (!UUID_PATTERN.test(item.product_id)) fail(400, "รหัสสินค้าไม่ถูกต้อง");
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      fail(400, "จำนวนสินค้าต้องเป็นจำนวนเต็ม 1–999");
    }
    const quantity = (combined.get(item.product_id) ?? 0) + item.quantity;
    if (quantity > 999) fail(400, "จำนวนสินค้าต่อรายการต้องไม่เกิน 999");
    combined.set(item.product_id, quantity);
  }
  return [...combined.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([product_id, quantity]) => ({ product_id, quantity }));
}

export function calculateStockDeduction(
  stockQuantity: number | null,
  soldQuantity: number,
): { tracked: boolean; newQuantity: number | null; deductedQuantity: number; shortageQuantity: number } {
  if (stockQuantity === null) {
    return { tracked: false, newQuantity: null, deductedQuantity: 0, shortageQuantity: 0 };
  }
  if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0 ||
      !Number.isSafeInteger(soldQuantity) || soldQuantity < 1 || soldQuantity > 999) {
    fail(400, "จำนวนสต็อกหรือจำนวนขายไม่ถูกต้อง");
  }
  const deductedQuantity = Math.min(stockQuantity, soldQuantity);
  return {
    tracked: true,
    newQuantity: stockQuantity - deductedQuantity,
    deductedQuantity,
    shortageQuantity: soldQuantity - deductedQuantity,
  };
}

export function getBangkokBusinessDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function validateBusinessDate(value?: string): string {
  const date = value ?? getBangkokBusinessDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(400, "รูปแบบวันที่ไม่ถูกต้อง");
  const [year, month, day] = date.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    fail(400, "วันที่ไม่ถูกต้อง");
  }
  return date;
}
