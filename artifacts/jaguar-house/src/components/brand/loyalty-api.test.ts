import assert from "node:assert/strict";
import test from "node:test";
import { bundlePrice } from "./loyalty-api.ts";

test("prices every drink bottle at 50 baht", () => {
  assert.equal(bundlePrice(1), 50);
  assert.equal(bundlePrice(2), 100);
  assert.equal(bundlePrice(3), 150);
  assert.equal(bundlePrice(4), 200);
});
