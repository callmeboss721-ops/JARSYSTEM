import type { ImportOwnerProductRow, OwnerProduct } from "@workspace/api-client-react";

export const CSV_HEADERS = ["category", "name", "description", "price_baht", "stock_quantity", "stock_unit"] as const;
const CSV_MAX_ROWS = 200;

export type CsvPreviewRow = {
  rowNumber: number;
  row: ImportOwnerProductRow;
  duplicate: boolean;
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let afterQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
      afterQuote = false;
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      afterQuote = false;
    } else {
      if (afterQuote && !/\s/.test(character)) throw new Error("พบข้อความต่อท้ายช่องที่ปิดเครื่องหมายอัญประกาศ");
      cell += character;
    }
  }
  if (quoted) throw new Error("พบเครื่องหมายอัญประกาศที่ไม่ปิดในไฟล์ CSV");
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export function validateCsv(text: string, existingProducts: OwnerProduct[]): { rows: CsvPreviewRow[]; errors: string[] } {
  const parsed = parseCsvText(text);
  if (parsed.length < 2) throw new Error("ไฟล์ต้องมีหัวตารางและข้อมูลสินค้าอย่างน้อย 1 แถว");
  const headers = parsed[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  const hasBaseColumns = headers.length === CSV_HEADERS.length &&
    headers.every((header, index) => header === CSV_HEADERS[index]);
  if (!hasBaseColumns) {
    throw new Error(`หัวตารางต้องเรียงตามนี้: ${CSV_HEADERS.join(", ")}`);
  }
  const dataRows = parsed.slice(1);
  if (dataRows.length > CSV_MAX_ROWS) throw new Error(`ไฟล์มีได้ไม่เกิน ${CSV_MAX_ROWS} แถว`);
  const productKey = (productCategory: string, productName: string) =>
    `${productCategory.trim().toLocaleLowerCase("th-TH")}\u0000${productName.trim().toLocaleLowerCase("th-TH")}`;
  const knownNames = new Set(existingProducts.map((product) => productKey(product.category, product.name)));
  const seenNames = new Set<string>();
  const errors: string[] = [];
  const rows = dataRows.map((cells, index): CsvPreviewRow | null => {
    const rowNumber = index + 2;
    if (cells.length !== headers.length) {
      errors.push(`แถว ${rowNumber}: จำนวนช่องไม่ตรงกับหัวตาราง`);
      return null;
    }
    const [categoryRaw, nameRaw, descriptionRaw, priceRaw, quantityRaw, unitRaw] = cells.map((cell) => cell.trim());
    const category = categoryRaw;
    const name = nameRaw;
    const description = descriptionRaw;
    const price = Number(priceRaw);
    const quantity = quantityRaw === "" ? null : Number(quantityRaw);
    const stockUnit = unitRaw;
    const hasQuantity = quantityRaw !== "";
    const hasUnit = stockUnit !== "";
    const rowErrors: string[] = [];
    if (!category || category.length > 80) rowErrors.push("หมวดหมู่ต้องมี 1–80 ตัวอักษร");
    if (!name || Array.from(name).length > 120) rowErrors.push("ชื่อต้องมี 1–120 ตัวอักษร");
    if (Array.from(description).length > 600) rowErrors.push("รายละเอียดต้องไม่เกิน 600 ตัวอักษร");
    if (!/^\d+$/.test(priceRaw) || !Number.isInteger(price) || price < 1 || price > 100_000_000) rowErrors.push("ราคาต้องเป็นจำนวนเต็ม 1–100,000,000 บาท");
    if (hasQuantity !== hasUnit) rowErrors.push("กรอกทั้งจำนวนและหน่วยสต็อก หรือเว้นว่างทั้งคู่เมื่อยังไม่ทราบ");
    if (hasQuantity && (!/^\d+$/.test(quantityRaw) || !Number.isInteger(quantity) || quantity === null || quantity < 0 || quantity > 1_000_000)) rowErrors.push("สต็อกต้องเป็นจำนวนเต็ม 0–1,000,000");
    if (hasUnit && Array.from(stockUnit).length > 24) rowErrors.push("หน่วยสต็อกต้องไม่เกิน 24 ตัวอักษร");
    if (rowErrors.length) {
      errors.push(`แถว ${rowNumber}: ${rowErrors.join(" · ")}`);
      return null;
    }
    const key = productKey(category, name);
    const duplicate = knownNames.has(key) || seenNames.has(key);
    seenNames.add(key);
    return {
      rowNumber,
      duplicate,
      row: {
        category,
        name,
        description,
        price_baht: price,
        stock_quantity: quantity,
        stock_unit: hasUnit ? stockUnit : null,
      },
    };
  }).filter((row): row is CsvPreviewRow => row !== null);
  return { rows, errors };
}
