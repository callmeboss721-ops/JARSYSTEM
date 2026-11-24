/**
 * Development-only end-to-end test. It creates uniquely scoped test data and
 * removes only those fixtures, even when an assertion fails. Never run in prod.
 * Run: node scripts/test-loyalty.mjs
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { calculateCarryPoints, calculateCumulativePointDelta } from "../artifacts/api-server/src/lib/points-policy.ts";

if (process.env.NODE_ENV === "production") throw new Error("Development test only");

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = require("pg");
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const base = process.env.LOYALTY_TEST_BASE ||
  `http://127.0.0.1:${process.env.LOYALTY_TEST_PORT || "8080"}`;
const testIp = `2001:db8:${randomUUID().replaceAll("-", "").slice(0, 4)}:${randomUUID().replaceAll("-", "").slice(0, 4)}::1`;
const memberJar = new Map();
const staffJar = new Map();
const ownerJar = new Map();
const memberCode = `T${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase();
const phone = `08${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
const nickname = `M${randomUUID().replaceAll("-", "").slice(0, 10)}`;
const testCatalogCategory = `TEST-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const testCatalogPrefix = `TEST-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
const unknownLoginCode = `Z${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase();
const unknownLoginPhone = `07${String(Number.parseInt(randomUUID().replaceAll("-", "").slice(0, 8), 16) % 100_000_000).padStart(8, "0")}`;
const unknownLoginNickname = `U${randomUUID().replaceAll("-", "").slice(0, 10)}`;
const testStartedAt = new Date();
let memberId;
let createdMemberId;
let createdMemberCode;
let rewardId;
let staffPinHash;
let ownerPinHash;
const productIds = [];
const storedPinCount = (await db.query(`select count(*)::integer as count from jaguar_settings
  where key in ('staff_pin_hash','owner_pin_hash')`)).rows[0].count;
const adminTestsAvailable = !Object.hasOwn(process.env, "STAFF_PIN") &&
  !Object.hasOwn(process.env, "OWNER_PIN") && storedPinCount === 0;
const originalCannabisFeature = (await db.query("select value from jaguar_settings where key='cannabis_points_enabled'")).rows[0]?.value;

async function request(path, { method = "GET", body, jar = memberJar, status = 200 } = {}) {
  const response = await fetch(`${base}/api/loyalty${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Forwarded-For": testIp, Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(";");
    const at = pair.indexOf("=");
    jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
  const value = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${response.status} ${JSON.stringify(value)}`);
  return value;
}

try {
  assert.deepEqual(calculateCarryPoints(20, 60), { points: 0, remainder: 80 });
  assert.deepEqual(calculateCarryPoints(80, 40), { points: 1, remainder: 20 });
  assert.deepEqual(calculateCarryPoints(0, 100), { points: 1, remainder: 0 });
  assert.deepEqual(calculateCarryPoints(60, 50), { points: 1, remainder: 10 });
  assert.deepEqual(calculateCarryPoints(90, 10), { points: 1, remainder: 0 });
  assert.equal(calculateCumulativePointDelta(180, 210), 1, "correction to 210 baht changes earned sales points by +1");
  assert.equal(calculateCumulativePointDelta(210, 180), -1, "correction down to 180 baht changes earned sales points by -1");
  assert.equal(calculateCumulativePointDelta(60, 110), 1, "correction uses cumulative grams across the 100g threshold");
  assert.equal(calculateCumulativePointDelta(110, 95), -1, "correction below the 100-point threshold removes one earned point");
  assert.throws(() => calculateCumulativePointDelta(-1, 100), RangeError);
  for (let cycle = 0; cycle < 50; cycle++) {
    const previousKratomBaht = cycle * 79 + ((cycle * 37) % 100);
    const nextKratomBaht = Math.max(0, previousKratomBaht + ((cycle * 73) % 201) - 100);
    const kratomDelta = calculateCumulativePointDelta(previousKratomBaht, nextKratomBaht);
    assert.equal(kratomDelta, Math.floor(nextKratomBaht / 100) - Math.floor(previousKratomBaht / 100), `kratom correction simulation ${cycle + 1}`);
    const kratomAdded = (cycle * 31) % 333;
    const kratomCarry = calculateCarryPoints(previousKratomBaht % 100, kratomAdded);
    assert.equal(kratomCarry.points, Math.floor(((previousKratomBaht % 100) + kratomAdded) / 100), `kratom carry simulation ${cycle + 1}`);
    assert.equal(kratomCarry.remainder, ((previousKratomBaht % 100) + kratomAdded) % 100);

    const previousCannabisGrams = cycle * 83 + ((cycle * 41) % 100);
    const nextCannabisGrams = Math.max(0, previousCannabisGrams + ((cycle * 67) % 201) - 100);
    const cannabisDelta = calculateCumulativePointDelta(previousCannabisGrams, nextCannabisGrams);
    assert.equal(cannabisDelta, Math.floor(nextCannabisGrams / 100) - Math.floor(previousCannabisGrams / 100), `cannabis correction simulation ${cycle + 1}`);
    const cannabisAdded = (cycle * 43) % 333;
    const cannabisCarry = calculateCarryPoints(previousCannabisGrams % 100, cannabisAdded);
    assert.equal(cannabisCarry.points, Math.floor(((previousCannabisGrams % 100) + cannabisAdded) / 100), `cannabis carry simulation ${cycle + 1}`);
    assert.equal(cannabisCarry.remainder, ((previousCannabisGrams % 100) + cannabisAdded) % 100);
  }
  const health = await request("/health");
  assert.equal(health.storage, "postgresql");

  await request("/card", { jar: new Map(), status: 401 });
  assert.equal((await request("/session")).authenticated, false);
  await request("/owner/summary", { jar: new Map(), status: 401 });
  const invalidLogin = await request("/login", { method: "POST", body: { member_code: "bad" }, status: 401 });
  assert.equal(invalidLogin.error, "ไม่พบสมาชิก กรุณาตรวจสอบข้อมูล");
  const registered = await request("/register", { method: "POST", body: { member_code: memberCode, phone, nickname }, status: 201 });
  memberId = registered.id;
  assert.equal(registered.balance, 0);
  assert.equal(registered.nickname, nickname);
  assert.equal(registered.phone_masked, `08x-xxx-${phone.slice(-4)}`);
  assert.equal("phone" in registered, false, "customer card must not expose the full phone");
  assert.equal((await request("/session")).authenticated, true);
  await request("/register", { method: "POST", body: {
    member_code: `D${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase(),
    phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    nickname: ` ${nickname.toLowerCase()} `,
  }, status: 409 });
  const badNickname = await request("/register", { method: "POST", body: {
    member_code: `D${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase(),
    phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    nickname: "123456",
  }, status: 400 });
  assert.equal(badNickname.error, "ชื่อเล่นต้องมี 2–20 ตัวอักษร และไม่เป็นเบอร์โทรหรือตัวเลขล้วน");
  await request("/logout", { method: "POST" });
  await request("/card", { status: 401 });
  const phoneLogin = await request("/login", { method: "POST", body: { method: "phone", identifier: phone } });
  assert.equal(phoneLogin.id, memberId);
  await request("/logout", { method: "POST" });
  const nicknameLogin = await request("/login", { method: "POST", body: { method: "nickname", identifier: nickname.toLowerCase() } });
  assert.equal(nicknameLogin.id, memberId);
  await request("/logout", { method: "POST" });
  const card = await request("/login", { method: "POST", body: { method: "member_code", identifier: memberCode.toLowerCase() } });
  assert.equal(card.id, memberId);
  assert.equal(card.cannabis_balance, 0);
  assert.equal(card.kratom_remainder_baht, 0);

  const failedByCode = await request("/login", { method: "POST", body: { method: "member_code", identifier: unknownLoginCode }, status: 401 });
  const failedByPhone = await request("/login", { method: "POST", body: { method: "phone", identifier: unknownLoginPhone }, status: 401 });
  const failedByNickname = await request("/login", { method: "POST", body: { method: "nickname", identifier: unknownLoginNickname }, status: 401 });
  assert.equal(failedByCode.error, failedByPhone.error);
  assert.equal(failedByPhone.error, failedByNickname.error);
  for (let attempt = 0; attempt < 5; attempt++) {
    await request("/login", { method: "POST", body: { method: "member_code", identifier: unknownLoginCode }, status: 401 });
  }
  const lockedLogin = await request("/login", { method: "POST", body: { method: "member_code", identifier: unknownLoginCode }, status: 429 });
  assert.equal(lockedLogin.error, failedByCode.error);
  const lockedTargets = await db.query(`select count(*)::integer as count from jaguar_security_limits
    where locked_until > now() and window_started_at >= $1`, [testStartedAt]);
  assert.ok(lockedTargets.rows[0].count > 0, "failed login lock must persist in PostgreSQL");

  if (adminTestsAvailable) {
  const qrResponse = await request("/qr");
  const qrToken = qrResponse.qr;
  assert.match(qrToken, /^JAGUAR1:[0-9a-f]{64}$/);
  const staffLogin = await request("/staff/login", { method: "POST", jar: staffJar, body: { pin: "2024" } });
  assert.equal(staffLogin.ok, true);
  await request("/owner/summary", { jar: staffJar, status: 401 });
  await request("/owner/products", { jar: staffJar, status: 401 });
  const memberViaQr = await request("/staff/member?qr_token=" + encodeURIComponent(qrToken), { jar: staffJar });
  assert.equal(memberViaQr.id, memberId);
  const defaultReward = (await request("/rewards")).find((reward) => reward.is_active && reward.points_cost === 10);
  assert.ok(defaultReward, "development environment must contain the 10-point demo reward");
  const ownerLogin = await request("/owner/login", { method: "POST", jar: ownerJar, body: { pin: "8899" } });
  assert.equal(ownerLogin.ok, true);
  const catalogProduct = await request("/owner/products", {
    method: "POST", jar: ownerJar, status: 201,
    body: {
      name: `${testCatalogPrefix} manual`,
      category: testCatalogCategory,
      description: "temporary inventory test",
      price_baht: 123,
      stock_quantity: 10,
      stock_unit: "ขวด",
    },
  });
  productIds.push(catalogProduct.id);
  assert.equal(catalogProduct.stock_quantity, 10);
  const changedStock = await request(`/owner/products/${catalogProduct.id}/stock`, {
    method: "PATCH", jar: ownerJar,
    body: { quantity: 8, stock_unit: "ขวด", reason: "ทดสอบตรวจนับสต็อก" },
  });
  assert.equal(changedStock.stock_quantity, 8);
  const manualStockHistory = await request(`/owner/products/${catalogProduct.id}/stock-history`, { jar: ownerJar });
  assert.equal(manualStockHistory[0].previous_quantity, 10);
  assert.equal(manualStockHistory[0].new_quantity, 8);
  assert.equal(manualStockHistory[0].source, "manual");

  const importRows = [
    {
      name: catalogProduct.name,
      category: testCatalogCategory,
      description: "must not overwrite existing product",
      price_baht: 999,
      stock_quantity: 88,
      stock_unit: "ขวด",
    },
    {
      name: `${testCatalogPrefix} imported`,
      category: testCatalogCategory,
      description: "temporary CSV import test",
      price_baht: 456,
      stock_quantity: 5,
      stock_unit: "ถุง",
    },
  ];
  const firstImport = await request("/owner/products/import", { method: "POST", jar: ownerJar, body: { rows: importRows } });
  assert.deepEqual(firstImport, { created_count: 1, skipped_count: 1 });
  const repeatedImport = await request("/owner/products/import", { method: "POST", jar: ownerJar, body: { rows: importRows } });
  assert.deepEqual(repeatedImport, { created_count: 0, skipped_count: 2 });
  const largeImportRows = Array.from({ length: 8 }, (_, index) => ({
    name: `${testCatalogPrefix} large ${index + 1}`,
    category: testCatalogCategory,
    description: "ก".repeat(600),
    price_baht: 100 + index,
    stock_quantity: index,
    stock_unit: "ชิ้น",
  }));
  const largeImport = await request("/owner/products/import", {
    method: "POST", jar: ownerJar, body: { rows: largeImportRows },
  });
  assert.deepEqual(largeImport, { created_count: 8, skipped_count: 0 },
    "the bounded CSV import payload may exceed the small default JSON limit");
  const catalogAfterImport = await request("/owner/products", { jar: ownerJar });
  const unchangedExisting = catalogAfterImport.find((item) => item.id === catalogProduct.id);
  const importedProduct = catalogAfterImport.find((item) => item.name === `${testCatalogPrefix} imported`);
  assert.equal(unchangedExisting.price_baht, 123, "duplicate import must not overwrite price");
  assert.equal(unchangedExisting.stock_quantity, 8, "duplicate import must not overwrite manual stock");
  assert.equal(importedProduct.stock_quantity, 5);
  assert.ok(catalogAfterImport.some((item) => item.category === testCatalogCategory));
  if (importedProduct) productIds.push(importedProduct.id);
  const importHistory = await request(`/owner/products/${importedProduct.id}/stock-history`, { jar: ownerJar });
  assert.equal(importHistory[0].source, "import");
  const ownerReportBeforePurchases = await request("/owner/summary", { jar: ownerJar });
  await request("/owner/summary", { jar: staffJar, status: 401 });
  await request("/staff/members", { jar: ownerJar, status: 401 });
  assert.equal((await request("/owner/security", { jar: ownerJar })).cannabis_points_enabled, false);
  const disabledCannabis = await request("/staff/cannabis-stamp", {
    method: "POST", jar: staffJar,
    body: { member_code: memberCode, grams: 50, request_id: randomUUID() },
    status: 403,
  });
  assert.match(disabledCannabis.error, /ยังปิดอยู่/);
  assert.equal((await request("/owner/features/cannabis-points", {
    method: "PATCH", jar: ownerJar, body: { enabled: true },
  })).cannabis_points_enabled, true);
  assert.equal((await request("/staff/security", { jar: staffJar })).cannabis_points_enabled, true);
  await request("/staff/cannabis-stamp", {
    method: "POST", jar: staffJar,
    body: { member_code: memberCode, grams: 60, request_id: randomUUID() },
  });
  const after60g = await request("/staff/cannabis-card?code=" + memberCode, { jar: staffJar });
  assert.equal(after60g.balance, 0);
  assert.equal(after60g.grams_remainder, 60);
  await request("/staff/cannabis-stamp", {
    method: "POST", jar: staffJar,
    body: { member_code: memberCode, grams: 50, request_id: randomUUID() },
  });
  const after110g = await request("/staff/cannabis-card?code=" + memberCode, { jar: staffJar });
  assert.equal(after110g.balance, 1);
  assert.equal(after110g.grams_remainder, 10);
  const reportAfterCannabisPurchase = await request("/owner/summary", { jar: ownerJar });
  assert.ok(reportAfterCannabisPurchase.cannabis_members >= ownerReportBeforePurchases.cannabis_members + 1);
  const dualBalance = await request("/card");
  assert.equal(dualBalance.cannabis_balance, 1);
  assert.equal(dualBalance.cannabis_remainder_grams, 10);
  assert.equal(dualBalance.balance, 0, "cannabis points must not change the kratom balance");

  const staffMember = await request("/staff/member?code=" + memberCode, { jar: staffJar });
  assert.equal(staffMember.id, memberId);
  const badSale = { member_code: memberCode, bottle_count: 0, formula: "red", request_id: randomUUID() };
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: badSale, status: 400 });
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: { ...badSale, bottle_count: 1000 }, status: 400 });
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: { ...badSale, bottle_count: 3, formula: "blue" }, status: 400 });

  const twoBottles = { member_code: memberCode, bottle_count: 2, formula: "red", request_id: randomUUID() };
  assert.equal((await request("/staff/stamp", { method: "POST", jar: staffJar, body: twoBottles })).balance, 1);
  const oneBottle = { member_code: memberCode, bottle_count: 1, formula: "silver", request_id: randomUUID() };
  assert.equal((await request("/staff/stamp", { method: "POST", jar: staffJar, body: oneBottle })).balance, 1);
  const belowThreshold = await request("/sales");
  assert.ok(belowThreshold.some((sale) => sale.bottle_count === 2 && sale.amount_baht === 100 && sale.points_awarded === 1));
  assert.ok(belowThreshold.some((sale) => sale.bottle_count === 1 && sale.amount_baht === 50 && sale.points_awarded === 0));

  const stampRows = Array.from({ length: 8 }, (_, index) => ({
    member_code: memberCode,
    bottle_count: 3,
    formula: ["red", "silver", "gold"][index % 3],
    request_id: randomUUID(),
  }));
  for (const stamp of stampRows) await request("/staff/stamp", { method: "POST", jar: staffJar, body: stamp });
  const finalStamp = { member_code: memberCode, bottle_count: 6, formula: "gold", request_id: randomUUID() };
  const [sameA, sameB] = await Promise.all([
    request("/staff/stamp", { method: "POST", jar: staffJar, body: finalStamp }),
    request("/staff/stamp", { method: "POST", jar: staffJar, body: finalStamp }),
  ]);
  assert.equal(sameA.balance, 16);
  assert.equal(sameB.balance, 16);
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: { ...finalStamp, bottle_count: 3 }, status: 409 });
  let updated = await request("/card");
  assert.equal(updated.lifetime_earned, 16);
  assert.equal(updated.balance, 16);
  const purchases = await request("/sales");
  assert.equal(purchases.length, 5);
  assert.ok(purchases.every((sale) => sale.amount_baht > 0 && sale.bottle_count >= 1 && ["red", "silver", "gold"].includes(sale.formula)));
  assert.ok(purchases.some((sale) => sale.bottle_count === 6 && sale.amount_baht === 300 && sale.points_awarded === 3));
  const search = await request("/staff/members?q=" + memberCode, { jar: staffJar });
  assert.ok(search.some((member) => member.id === memberId));
  const memberQrLookup = await request("/staff/member?qr_token=" + encodeURIComponent(qrToken), { jar: staffJar });
  assert.equal(memberQrLookup.id, memberId);
  const stockAfterSales = await request("/owner/products", { jar: ownerJar });
  assert.equal(stockAfterSales.find((item) => item.id === catalogProduct.id).stock_quantity, 8,
    "sales must not alter the separate product catalog stock");

  const stampViaQr = { qr_token: qrToken, bottle_count: 3, formula: "red", request_id: randomUUID() };
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: stampViaQr });
  updated = await request("/card");
  assert.equal(updated.balance, 18);
  const redeemRequest = { member_code: memberCode, request_id: randomUUID() };
  const [staffRedeem, duplicateRedeem] = await Promise.all([1, 2].map(() =>
    request("/staff/redeem", { method: "POST", jar: staffJar, body: redeemRequest })));
  assert.equal(staffRedeem.balance, 8);
  assert.equal(duplicateRedeem.balance, 8);
  assert.equal(staffRedeem.lifetime_redeemed, 10);
  const members = await request("/owner/members?q=" + memberCode, { jar: ownerJar });
  assert.ok(members.some((member) => member.id === memberId));
  const reportAfterFirstSales = await request("/owner/summary", { jar: ownerJar });
  assert.ok(reportAfterFirstSales.kratom_members >= ownerReportBeforePurchases.kratom_members + 1);
  assert.ok(reportAfterFirstSales.total_sales >= 1770);
  assert.ok(reportAfterFirstSales.by_formula.some((item) => item.formula === "gold"));
  assert.ok(reportAfterFirstSales.by_formula.some((item) => item.bottles_sold >= 3 && item.points_awarded >= 1));
  assert.ok(Number.isInteger(reportAfterFirstSales.today_redemptions));
  const todayFormula = reportAfterFirstSales.by_formula.find((item) => item.formula === "gold");
  assert.ok(todayFormula && Number.isInteger(todayFormula.today_sales_count) && Number.isInteger(todayFormula.today_amount_baht));
  assert.equal((await request("/owner/security", { jar: ownerJar })).staff_default_pin, true);

  const created = await request("/staff/members", {
    method: "POST", jar: staffJar, status: 201,
    body: { name: "Temporary integration member", member_code: `C${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase(),
      phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
      nickname: `C${randomUUID().replaceAll("-", "").slice(0, 10)}` },
  });
  createdMemberId = created.id;
  createdMemberCode = created.member_code;
  const tempReward = await request("/owner/rewards", {
    method: "POST", jar: ownerJar, status: 201,
    body: { name: "TEST ONLY — temporary integration fixture", description: "Removed automatically after testing", points_cost: 10 },
  });
  rewardId = tempReward.id;
  const stampsForPending = Array.from({ length: 10 }, (_, index) => ({
    member_code: memberCode, bottle_count: 3, formula: "silver", request_id: randomUUID(),
  }));
  for (const stamp of stampsForPending) await request("/staff/stamp", { method: "POST", jar: staffJar, body: stamp });
  const pending = await request("/redemptions", { method: "POST", body: { reward_id: rewardId }, status: 201 });
  assert.equal(pending.status, "pending");
  assert.equal(pending.member_nickname, nickname);
  assert.equal(pending.phone_last4, phone.slice(-4));
  assert.equal((await request("/card")).balance, 23);
  await request("/owner/members/" + memberId, { method: "DELETE", jar: ownerJar, status: 409 });
  assert.ok((await request("/staff/redemptions", { jar: staffJar })).some((item) => item.id === pending.id));
  await Promise.all([1, 2].map(() => request(`/staff/redemptions/${pending.id}/confirm`, { method: "POST", jar: staffJar })));
  updated = await request("/card");
  assert.equal(updated.balance, 13);
  assert.equal(updated.lifetime_earned, 33);
  assert.equal(updated.lifetime_redeemed, 20);

  const balanceBeforeCorrection = updated.balance;
  const kratomSalesForCorrection = await request("/staff/member-sales?code=" + memberCode, { jar: staffJar });
  const editableSale = kratomSalesForCorrection.find((sale) => sale.editable);
  assert.ok(editableSale, "staff can list today's editable kratom sales");
  const correctedSale = await request(`/staff/sales/${editableSale.id}`, {
    method: "PATCH", jar: staffJar,
    body: { bottle_count: editableSale.bottle_count, formula: editableSale.formula, reason: "ทดสอบตรวจสอบยอดขาย" },
  });
  assert.equal(correctedSale.member.balance, balanceBeforeCorrection);
  assert.equal(correctedSale.sales.find((sale) => sale.id === editableSale.id).corrected, true);

  const cannabisForCorrection = await request("/staff/cannabis-card?code=" + memberCode, { jar: staffJar });
  const editableCannabis = cannabisForCorrection.recent_transactions.find((transaction) => transaction.editable && transaction.grams_purchased > 0);
  assert.ok(editableCannabis, "staff can list today's editable cannabis purchase");
  const correctedCannabis = await request(`/staff/cannabis-transactions/${editableCannabis.id}`, {
    method: "PATCH", jar: staffJar,
    body: { grams: editableCannabis.grams_purchased, reason: "ทดสอบตรวจสอบยอดกรัม" },
  });
  assert.equal(correctedCannabis.balance, cannabisForCorrection.balance);
  assert.equal(correctedCannabis.recent_transactions.find((transaction) => transaction.id === editableCannabis.id).corrected, true);

  const redemptionHistory = await request("/staff/redemptions/recent", { jar: staffJar });
  const redemptionForCorrection = redemptionHistory.find((redemption) => redemption.id === pending.id);
  assert.ok(redemptionForCorrection, "staff can list today's redemptions");
  const correctedRedemption = await request(`/staff/redemptions/${pending.id}`, {
    method: "PATCH", jar: staffJar,
    body: { reward_id: redemptionForCorrection.reward_id, reason: "ทดสอบตรวจสอบรายการแลก" },
  });
  assert.equal(correctedRedemption.points_spent, redemptionForCorrection.points_spent);
  assert.equal(correctedRedemption.corrected, true);

  const bonusRequest = { member_code: memberCode, points: 5, request_id: randomUUID() };
  updated = await request("/card");
  const balanceBeforeBonus = updated.balance;
  const earnedBeforeBonus = updated.lifetime_earned;
  const [bonusFirst, bonusRetry] = await Promise.all([1, 2].map(() =>
    request("/staff/points", { method: "POST", jar: staffJar, body: bonusRequest })));
  assert.equal(bonusFirst.balance, balanceBeforeBonus + 5);
  assert.equal(bonusRetry.balance, balanceBeforeBonus + 5, "a repeated bonus request must not credit points twice");
  assert.equal(bonusFirst.lifetime_earned, earnedBeforeBonus + 5);
  assert.equal(bonusRetry.lifetime_earned, earnedBeforeBonus + 5);
  assert.ok((await request("/owner/audit-log", { jar: ownerJar })).some((event) =>
    event.member_code === memberCode && event.event_type === "points" && event.points_delta === 5),
  "manual bonus credits must appear in the owner audit trail");

  await request(`/owner/rewards/${rewardId}`, { method: "PATCH", jar: ownerJar, body: { is_active: false } });
  assert.ok(!(await request("/rewards")).some((reward) => reward.id === rewardId));

  await request("/owner/members/" + createdMemberId, { method: "DELETE", jar: ownerJar });
  await request("/staff/member?code=" + created.member_code, { jar: staffJar, status: 403 });
  const pinStaff = `5${String(Math.floor(Math.random() * 90000 + 10000))}`;
  const pinOwner = `6${String(Math.floor(Math.random() * 90000 + 10000))}`;
  const oldOwner = new Map(ownerJar);
  await request("/owner/pins", { method: "POST", jar: ownerJar, body: { staff_pin: pinStaff, owner_pin: pinOwner } });
  staffPinHash = (await db.query("select value from jaguar_settings where key='staff_pin_hash'")).rows[0]?.value;
  ownerPinHash = (await db.query("select value from jaguar_settings where key='owner_pin_hash'")).rows[0]?.value;
  await request("/owner/summary", { jar: oldOwner, status: 401 });
  await request("/staff/login", { method: "POST", jar: new Map(), body: { pin: "2024" }, status: 401 });
  const newStaff = new Map();
  await request("/staff/login", { method: "POST", jar: newStaff, body: { pin: pinStaff } });
  const newOwner = new Map();
  await request("/owner/login", { method: "POST", jar: newOwner, body: { pin: pinOwner } });
   console.log("PASS: 50 kratom/cannabis accumulation and correction simulations; 3 login methods; nickname uniqueness; generic errors and PostgreSQL lock; masked phone; separate balances; owner feature flag; idempotency, rewards, staff/owner sessions and PIN rotation.");
  } else {
    console.log("PASS: 50 kratom/cannabis accumulation and correction simulations; 3 login methods; nickname uniqueness; generic errors and PostgreSQL lock; masked phone; point carry-over calculations (฿100 and 100 g).");
    console.log("SKIP: staff/owner end-to-end scenarios; existing PIN configuration was preserved and not read or modified.");
  }
} finally {
  if (productIds.length) {
    await db.query("delete from jaguar_product_stock_events where product_id = any($1::uuid[])", [productIds]);
    await db.query("delete from jaguar_products where id = any($1::uuid[])", [productIds]);
  }
  await db.query("delete from jaguar_product_stock_events where product_id in (select id from jaguar_products where category=$1 and name like $2)", [
    testCatalogCategory,
    `${testCatalogPrefix}%`,
  ]);
  await db.query("delete from jaguar_products where category=$1 and name like $2", [testCatalogCategory, `${testCatalogPrefix}%`]);
  for (const id of [memberId, createdMemberId].filter(Boolean)) {
    await db.query("delete from jaguar_transaction_corrections where member_id=$1", [id]);
    await db.query("delete from jaguar_sales where member_id=$1", [id]);
    await db.query("delete from jaguar_cannabis_transactions where member_id=$1", [id]);
    await db.query("delete from jaguar_cannabis_balances where member_id=$1", [id]);
    await db.query("delete from jaguar_point_requests where member_id=$1", [id]);
    await db.query("delete from jaguar_point_transactions where member_id=$1", [id]);
    await db.query("delete from jaguar_redemptions where member_id=$1", [id]);
    await db.query("delete from jaguar_points_policy_snapshots where member_id=$1", [id]);
    await db.query("delete from jaguar_point_balances where member_id=$1", [id]);
    await db.query("delete from jaguar_members where id=$1", [id]);
  }
  if (rewardId) await db.query("delete from jaguar_rewards where id=$1", [rewardId]);
  if (staffPinHash) await db.query("delete from jaguar_settings where key='staff_pin_hash' and value=$1", [staffPinHash]);
  if (ownerPinHash) await db.query("delete from jaguar_settings where key='owner_pin_hash' and value=$1", [ownerPinHash]);
  if (originalCannabisFeature === undefined) {
    await db.query("delete from jaguar_settings where key='cannabis_points_enabled'");
  } else {
    await db.query(`insert into jaguar_settings(key,value) values('cannabis_points_enabled',$1)
      on conflict(key) do update set value=excluded.value`, [originalCannabisFeature]);
  }
  await db.end();
  console.log("Temporary integration data removed.");
}
