/**
 * Development-only end-to-end test. It creates uniquely scoped test data and
 * removes only those fixtures, even when an assertion fails. Never run in prod.
 * Run: node scripts/test-loyalty.mjs
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { calculateCarryPoints } from "../artifacts/api-server/src/lib/points-policy.ts";

if (process.env.NODE_ENV === "production") throw new Error("Development test only");

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = require("pg");
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const base = process.env.LOYALTY_TEST_BASE ||
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80");
const memberJar = new Map();
const staffJar = new Map();
const ownerJar = new Map();
const memberCode = `T${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase();
const phone = `08${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
const nickname = `M${randomUUID().replaceAll("-", "").slice(0, 10)}`;
const unknownLoginCode = `Z${randomUUID().replaceAll("-", "").slice(0, 5)}`.toUpperCase();
const testStartedAt = new Date();
let memberId;
let createdMemberId;
let createdMemberCode;
let rewardId;
let staffPinHash;
let ownerPinHash;
const storedPinCount = (await db.query(`select count(*)::integer as count from jaguar_settings
  where key in ('staff_pin_hash','owner_pin_hash')`)).rows[0].count;
const adminTestsAvailable = !Object.hasOwn(process.env, "STAFF_PIN") &&
  !Object.hasOwn(process.env, "OWNER_PIN") && storedPinCount === 0;
const originalCannabisFeature = (await db.query("select value from jaguar_settings where key='cannabis_points_enabled'")).rows[0]?.value;

async function request(path, { method = "GET", body, jar = memberJar, status = 200 } = {}) {
  const response = await fetch(`${base}/api/loyalty${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") },
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
  const failedByPhone = await request("/login", { method: "POST", body: { method: "phone", identifier: "0811111111" }, status: 401 });
  const failedByNickname = await request("/login", { method: "POST", body: { method: "nickname", identifier: "UnknownPerson" }, status: 401 });
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
  const memberViaQr = await request("/staff/member?qr_token=" + encodeURIComponent(qrToken), { jar: staffJar });
  assert.equal(memberViaQr.id, memberId);
  const defaultReward = (await request("/rewards")).find((reward) => reward.is_active && reward.points_cost === 10);
  assert.ok(defaultReward, "development environment must contain the 10-point demo reward");
  const ownerLogin = await request("/owner/login", { method: "POST", jar: ownerJar, body: { pin: "8899" } });
  assert.equal(ownerLogin.ok, true);
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
  assert.ok(belowThreshold.some((sale) => sale.bottle_count === 2 && sale.amount_baht === 120 && sale.points_awarded === 1));
  assert.ok(belowThreshold.some((sale) => sale.bottle_count === 1 && sale.amount_baht === 60 && sale.points_awarded === 0));

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
  assert.equal(sameA.balance, 19);
  assert.equal(sameB.balance, 19);
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: { ...finalStamp, bottle_count: 3 }, status: 409 });
  let updated = await request("/card");
  assert.equal(updated.lifetime_earned, 19);
  assert.equal(updated.balance, 19);
  const purchases = await request("/sales");
  assert.equal(purchases.length, 5);
  assert.ok(purchases.every((sale) => sale.amount_baht > 0 && sale.bottle_count >= 1 && ["red", "silver", "gold"].includes(sale.formula)));
  assert.ok(purchases.some((sale) => sale.bottle_count === 6 && sale.amount_baht === 300 && sale.points_awarded === 3));
  const search = await request("/staff/members?q=" + memberCode, { jar: staffJar });
  assert.ok(search.some((member) => member.id === memberId));
  const memberQrLookup = await request("/staff/member?qr_token=" + encodeURIComponent(qrToken), { jar: staffJar });
  assert.equal(memberQrLookup.id, memberId);

  const stampViaQr = { qr_token: qrToken, bottle_count: 3, formula: "red", request_id: randomUUID() };
  await request("/staff/stamp", { method: "POST", jar: staffJar, body: stampViaQr });
  updated = await request("/card");
  assert.equal(updated.balance, 21);
  const redeemRequest = { member_code: memberCode, request_id: randomUUID() };
  const [staffRedeem, duplicateRedeem] = await Promise.all([1, 2].map(() =>
    request("/staff/redeem", { method: "POST", jar: staffJar, body: redeemRequest })));
  assert.equal(staffRedeem.balance, 11);
  assert.equal(duplicateRedeem.balance, 11);
  assert.equal(staffRedeem.lifetime_redeemed, 10);
  const members = await request("/owner/members?q=" + memberCode, { jar: ownerJar });
  assert.ok(members.some((member) => member.id === memberId));
  const reportAfterFirstSales = await request("/owner/summary", { jar: ownerJar });
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
  assert.equal((await request("/card")).balance, 29);
  await request("/owner/members/" + memberId, { method: "DELETE", jar: ownerJar, status: 409 });
  assert.ok((await request("/staff/redemptions", { jar: staffJar })).some((item) => item.id === pending.id));
  await Promise.all([1, 2].map(() => request(`/staff/redemptions/${pending.id}/confirm`, { method: "POST", jar: staffJar })));
  updated = await request("/card");
  assert.equal(updated.balance, 19);
  assert.equal(updated.lifetime_earned, 39);
  assert.equal(updated.lifetime_redeemed, 20);
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
  console.log("PASS: 3 login methods; nickname uniqueness; generic errors and PostgreSQL lock; masked phone; separate kratom/cannabis balances; 100-baht/100-gram carry-over; owner feature flag; idempotency, rewards, staff/owner sessions and PIN rotation.");
  } else {
    console.log("PASS: 3 login methods; nickname uniqueness; generic errors and PostgreSQL lock; masked phone; point carry-over calculations (฿100 and 100 g).");
    console.log("SKIP: staff/owner end-to-end scenarios; existing PIN configuration was preserved and not read or modified.");
  }
} finally {
  for (const id of [memberId, createdMemberId].filter(Boolean)) {
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
