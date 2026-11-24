import assert from "node:assert/strict";
import test from "node:test";
import type { OwnerProduct } from "@workspace/api-client-react";
import { validateCsv } from "./owner-products-csv.ts";

const headers = "category,name,description,price_baht,stock_quantity,stock_unit";
const noProducts: OwnerProduct[] = [];

test("allows unknown stock when quantity and unit are both blank", () => {
  const result = validateCsv(`${headers}\nกระท่อม,น้ำ JAGUAR SPK,,50,,`, noProducts);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0]?.row.stock_quantity, null);
  assert.equal(result.rows[0]?.row.stock_unit, null);
});

test("keeps a real zero distinct from unknown stock", () => {
  const result = validateCsv(`${headers}\nบุหรี่,กรองทิพย์,,40,0,ซอง`, noProducts);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0]?.row.stock_quantity, 0);
  assert.equal(result.rows[0]?.row.stock_unit, "ซอง");
});

test("rejects a quantity without its unit", () => {
  const result = validateCsv(`${headers}\nบุหรี่,กรองทิพย์,,40,12,`, noProducts);
  assert.match(result.errors.join(" "), /จำนวนและหน่วยสต็อก/);
});

test("marks duplicate products in the same category", () => {
  const existing: OwnerProduct[] = [{
    id: "1",
    name: "กรองทิพย์",
    category: "บุหรี่",
    description: "",
    price_baht: 40,
    stock_quantity: null,
    stock_unit: null,
    has_image: false,
    is_active: true,
    created_at: "",
    updated_at: "",
  }];
  const result = validateCsv(`${headers}\nบุหรี่,กรองทิพย์,,40,,`, existing);
  assert.equal(result.rows[0]?.duplicate, true);
});

