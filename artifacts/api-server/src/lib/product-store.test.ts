import assert from "node:assert/strict";
import test from "node:test";
const { normalizeImportedProducts } = await import(new URL("./product-store.ts", import.meta.url).href);

test("keeps a known stock unit when the starting quantity is unknown", () => {
  const [product] = normalizeImportedProducts([{
    name: "JAGUAR SPK JG01",
    category: "กระท่อม",
    description: "รวมฝาทองและฝาแดงเป็น SKU เดียว",
    price_baht: 50,
    stock_quantity: null,
    stock_unit: "ขวด",
  }]);

  assert.equal(product.stock_quantity, null);
  assert.equal(product.stock_unit, "ขวด");
});

test("requires a stock unit when an imported quantity is known", () => {
  assert.throws(
    () => normalizeImportedProducts([{
      name: "ตัวอย่างสินค้า",
      category: "ทดสอบ",
      description: "",
      price_baht: 40,
      stock_quantity: 12,
      stock_unit: null,
    }]),
    /ระบุหน่วยสต็อก/,
  );
});
