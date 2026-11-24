import assert from "node:assert/strict";
import test from "node:test";
const {
  calculateStockDeduction,
  getBangkokBusinessDate,
  normalizeQuickSaleItems,
} = await import(new URL("./product-sales-rules.ts", import.meta.url).href);

const firstProduct = "00000000-0000-4000-8000-000000000001";
const secondProduct = "00000000-0000-4000-8000-000000000002";

test("normalizes duplicate cart lines and gives them a stable order", () => {
  assert.deepEqual(
    normalizeQuickSaleItems([
      { product_id: secondProduct, quantity: 2 },
      { product_id: firstProduct, quantity: 1 },
      { product_id: secondProduct, quantity: 3 },
    ]),
    [
      { product_id: firstProduct, quantity: 1 },
      { product_id: secondProduct, quantity: 5 },
    ],
  );
});

test("rejects a cart quantity that exceeds the per-item limit", () => {
  assert.throws(
    () => normalizeQuickSaleItems([
      { product_id: firstProduct, quantity: 600 },
      { product_id: firstProduct, quantity: 400 },
    ]),
    /ไม่เกิน 999/,
  );
});

test("deducts only available tracked stock and reports the shortage", () => {
  assert.deepEqual(calculateStockDeduction(2, 5), {
    tracked: true,
    newQuantity: 0,
    deductedQuantity: 2,
    shortageQuantity: 3,
  });
});

test("records a sale from zero stock without allowing inventory below zero", () => {
  assert.deepEqual(calculateStockDeduction(0, 5), {
    tracked: true,
    newQuantity: 0,
    deductedQuantity: 0,
    shortageQuantity: 5,
  });
});

test("untracked stock remains untouched and does not produce a false shortage", () => {
  assert.deepEqual(calculateStockDeduction(null, 5), {
    tracked: false,
    newQuantity: null,
    deductedQuantity: 0,
    shortageQuantity: 0,
  });
});

test("uses the Bangkok business date across the UTC day boundary", () => {
  assert.equal(getBangkokBusinessDate(new Date("2026-11-25T16:59:59.000Z")), "2026-11-25");
  assert.equal(getBangkokBusinessDate(new Date("2026-11-25T17:00:00.000Z")), "2026-11-26");
});
