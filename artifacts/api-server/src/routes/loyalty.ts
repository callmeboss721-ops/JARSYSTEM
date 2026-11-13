import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  RegisterMemberBody, LoginMemberBody, UpdateMemberNicknameBody, UpdateCannabisPointsFeatureBody,
  UpdateCannabisPointsFeatureResponse, RequestRedemptionBody, ConfirmRedemptionParams,
  LoginStaffBody, LoginOwnerBody, ChangeStaffPinBody, ChangeOwnerPinsBody,
  CreateStaffMemberBody, CreateOwnerMemberBody, RecordStaffSaleBody, RedeemAtCounterBody,
  AddCannabisStampsBody, RedeemCannabisAtCounterBody, GetStaffCannabisCardQueryParams,
  CreateOwnerRewardBody, UpdateOwnerRewardBody, FindMemberQueryParams,
  ListStaffMembersQueryParams, ListOwnerMembersQueryParams,
  GetMemberCardResponse, UpdateMemberNicknameResponse, ListRewardsResponse, ListMemberActivityResponse, ListMemberSalesResponse,
  GetCannabisMemberCardResponse, GetStaffCannabisCardResponse, AddCannabisStampsResponse, RedeemCannabisAtCounterResponse,
  ListMemberRedemptionsResponse, RequestRedemptionResponse, GetMemberQrResponse,
  ListStaffMembersResponse, RedeemAtCounterResponse, ListStaffRewardsResponse,
  ListPendingRedemptionsResponse, ConfirmRedemptionResponse, GetOwnerSummaryResponse,
  ListOwnerMembersResponse, ListOwnerRewardsResponse, CreateOwnerRewardResponse, UpdateOwnerRewardResponse,
  ListOwnerPendingResponse, ConfirmOwnerRedemptionResponse,
  GetStaffBankingResponse, RecordStaffBankTransferBody, RecordStaffBankTransferResponse,
  GetOwnerBankingResponse, CreateOwnerBankAccountBody, CreateOwnerBankAccountResponse,
  UpdateOwnerBankAccountBody, UpdateOwnerBankAccountResponse, SelectOwnerBankAccountForTodayResponse,
  ListStaffSalesQueryParams, ListStaffSalesResponse, CorrectStaffSaleParams, CorrectStaffSaleBody, CorrectStaffSaleResponse,
  CorrectStaffCannabisTransactionParams, CorrectStaffCannabisTransactionBody, CorrectStaffCannabisTransactionResponse,
  ListRecentStaffRedemptionsResponse, CorrectStaffRedemptionParams, CorrectStaffRedemptionBody, CorrectStaffRedemptionResponse,
  CorrectStaffBankTransferParams, CorrectStaffBankTransferBody, CorrectStaffBankTransferResponse,
} from "@workspace/api-zod";
import {
  loyaltyStore, listStaffRewards, createReward, setRewardActive, listStaffMembers,
  createMember, softDeleteMember, ownerReport, getMemberQr, isCannabisPointsEnabled, normalizeNickname,
} from "../lib/loyalty-store";
import {
  getStaffBanking, getOwnerBanking, createBankAccount, updateBankAccount,
  selectBankAccountForToday, recordBankTransfer, correctStaffBankTransfer,
} from "../lib/banking-store";
import {
  listStaffSales, correctStaffSale, correctStaffCannabisSale,
  listRecentStaffRedemptions, correctStaffRedemption,
} from "../lib/loyalty-corrections";
import { LoyaltyError } from "../lib/loyalty-errors";
import {
  clearSession, issueSession, loyaltyGuard, ownerSetPins, privateKey, rateLimit,
  readSession, verifyPin, usesDefaultPin, changePin, adminSessionSubject,
  assertRateLimitAvailable, recordFailedAttempt,
} from "../lib/loyalty-security";

type MemberCard = { id: string; member_code: string; status: string; balance: number; lifetime_earned: number; lifetime_redeemed: number };
type Role = "staff" | "owner";
const router: IRouter = Router();
router.use(loyaltyGuard);

async function authLimit(req: Request, category: string, limit = 10) {
  await rateLimit(`${category}:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`, limit, 15 * 60_000);
}
const loginError = "ไม่พบสมาชิก กรุณาตรวจสอบข้อมูล";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function codeValue(value: string): string { return value.trim().toUpperCase(); }
function phoneValue(value: string): string {
  const trimmed = value.trim().replace(/[\s()-]/g, "");
  const normalized = trimmed.startsWith("0") ? `+66${trimmed.slice(1)}` : trimmed;
  if (!/^\+66[689]\d{8}$/.test(normalized)) throw new LoyaltyError(400, "กรุณากรอกเบอร์มือถือไทย 10 หลัก");
  return normalized;
}
function parse<T>(schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } }, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new LoyaltyError(400, "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
  return result.data;
}
function sendJson<T>(res: Response, schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } }, value: unknown, status = 200): void {
  // Validate the JSON representation sent over the wire, including ISO timestamps.
  const result = schema.safeParse(JSON.parse(JSON.stringify(value)) as unknown);
  if (!result.success) throw new Error("Loyalty response contract mismatch");
  res.status(status).json(result.data);
}
function requireRole(role: Role) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const session = readSession(req, role);
    if (session.sub !== await adminSessionSubject(role)) throw new LoyaltyError(401, "เปลี่ยนรหัสแล้ว กรุณาเข้าสู่ระบบใหม่");
    next();
  };
}
async function loginRole(role: Role, pin: unknown, req: Request, res: Response) {
  const roleAttemptKey = `${role}-pin-role`;
  const ipAttemptKey = `${role}-pin-ip:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`;
  await assertRateLimitAvailable(roleAttemptKey, "PIN ไม่ถูกต้อง กรุณารอ 15 นาทีแล้วลองใหม่");
  await authLimit(req, `${role}-login`, 20);
  if (typeof pin !== "string" || !/^\d{4,12}$/.test(pin) || !await verifyPin(role, pin)) {
    await recordFailedAttempt(roleAttemptKey);
    await recordFailedAttempt(ipAttemptKey);
    throw new LoyaltyError(401, "PIN ไม่ถูกต้อง");
  }
  issueSession(res, role, await adminSessionSubject(role));
  res.json({ ok: true });
}
function validatePin(value: unknown, role: Role) {
  const min = role === "staff" ? 4 : 6;
  if (typeof value !== "string" || !new RegExp(`^\\d{${min},12}$`).test(value) ||
      /^(.)\1+$/.test(value) || value === (role === "staff" ? "2024" : "8899")) {
    throw new LoyaltyError(400, `PIN ใหม่ต้องเป็นตัวเลข ${min}–12 หลัก และไม่ใช้ PIN เริ่มต้น/ตัวเลขซ้ำ`);
  }
  return value;
}

// Customers: private member-code-only session.
router.post("/register", async (req, res) => {
  await authLimit(req, "register", 3);
  const { member_code, phone, nickname } = parse(RegisterMemberBody, req.body);
  const normalizedPhone = phoneValue(phone);
  const normalizedCode = codeValue(member_code);
  await rateLimit(`register-phone:${privateKey(normalizedPhone)}`, 3, 15 * 60_000, 15 * 60_000);
  await rateLimit(`register-code:${privateKey(normalizedCode)}`, 3, 15 * 60_000, 15 * 60_000);
  const card = await loyaltyStore<MemberCard>("jaguar_register", {
    p_code: normalizedCode, p_phone: normalizedPhone, p_nickname: normalizeNickname(nickname),
  });
  issueSession(res, "member", card.id);
  sendJson(res, GetMemberCardResponse, card, 201);
});
router.post("/login", async (req, res) => {
  const started = Date.now();
  let status = 401;
  let result: MemberCard | null = null;
  let targetKey = `member-login-target:${privateKey("empty")}`;
  const ipKey = `member-login-ip:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`;
  try {
    await authLimit(req, "member-login", 60);
    const body = parse(LoginMemberBody, req.body);
    const method = body.method ?? (body.member_code ? "member_code" : undefined);
    const raw = body.identifier ?? body.member_code ?? "";
    let identifier = raw.trim().normalize("NFC");
    if (method === "member_code") identifier = codeValue(identifier);
    if (method === "phone") {
      try { identifier = phoneValue(identifier); } catch { identifier = identifier.slice(0, 64); }
    }
    if (method === "nickname") {
      try { identifier = normalizeNickname(identifier).toLocaleLowerCase("en-US"); }
      catch { identifier = identifier.toLocaleLowerCase("en-US").slice(0, 64); }
    }
    targetKey = `member-login-target:${privateKey(identifier.toLocaleLowerCase("en-US").slice(0, 64))}`;
    await assertRateLimitAvailable(ipKey, loginError);
    await assertRateLimitAvailable(targetKey, loginError);
    if (!method || !["phone", "member_code", "nickname"].includes(method) || !identifier || identifier.length > 64) {
      throw new LoyaltyError(401, loginError);
    }
    if (method === "phone") {
      try { identifier = phoneValue(identifier); } catch { throw new LoyaltyError(401, loginError); }
    } else if (method === "nickname") {
      try { identifier = normalizeNickname(identifier); } catch { throw new LoyaltyError(401, loginError); }
    }
    const card = await loyaltyStore<MemberCard>("jaguar_member_login_by", {
      p_method: method as "phone" | "member_code" | "nickname",
      p_identifier: identifier,
    });
    await rateLimit(`member-login-account:${privateKey(card.id)}`, 50, 15 * 60_000, 15 * 60_000);
    result = card;
  } catch (error) {
    if (error instanceof LoyaltyError && error.status === 429) {
      status = 429;
    } else {
      status = error instanceof LoyaltyError && error.status >= 500 ? 503 : 401;
      if (!(error instanceof LoyaltyError) || error.status < 500) {
        await recordFailedAttempt(ipKey, 20).catch(() => undefined);
        await recordFailedAttempt(targetKey).catch(() => undefined);
      }
    }
  }
  if (result) {
    issueSession(res, "member", result.id);
    status = 200;
  }
  await wait(Math.max(0, 500 - (Date.now() - started)));
  if (result) sendJson(res, GetMemberCardResponse, result);
  else res.status(status).json({ error: loginError });
});
router.post("/logout", (_req, res) => { clearSession(res, "member"); res.json({ ok: true }); });
router.get("/session", (req, res) => {
  try {
    readSession(req, "member");
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});
router.get("/card", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_card", { p_member: sub }));
});
router.patch("/nickname", async (req, res) => {
  const { sub } = readSession(req, "member");
  await authLimit(req, "member-nickname", 10);
  const { nickname } = parse(UpdateMemberNicknameBody, req.body);
  sendJson(res, UpdateMemberNicknameResponse, await loyaltyStore("jaguar_update_nickname", {
    p_member: sub, p_nickname: normalizeNickname(nickname),
  }));
});
router.get("/cannabis-card", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, GetCannabisMemberCardResponse, await loyaltyStore("jaguar_cannabis_card", { p_member: sub }));
});
router.get("/rewards", async (_req, res) => sendJson(res, ListRewardsResponse, await loyaltyStore("jaguar_rewards")));
router.get("/activity", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, ListMemberActivityResponse, await loyaltyStore("jaguar_activity", { p_member: sub }));
});
router.get("/sales", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, ListMemberSalesResponse, await loyaltyStore("jaguar_member_sales", { p_member: sub }));
});
router.get("/qr", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, GetMemberQrResponse, { qr: `JAGUAR1:${await getMemberQr(sub)}` });
});
router.get("/redemptions", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, ListMemberRedemptionsResponse, await loyaltyStore("jaguar_redemptions", { p_member: sub, p_pending_only: false }));
});
router.post("/redemptions", async (req, res) => {
  const { sub } = readSession(req, "member");
  await rateLimit(`redeem:${sub}`, 5, 60_000);
  const data = parse(RequestRedemptionBody, req.body);
  sendJson(res, RequestRedemptionResponse, await loyaltyStore("jaguar_request_redemption", { p_member: sub, p_reward: data.reward_id }), 201);
});

// Employee desk: its own PIN, cookie, permissions, and limited routes.
router.post("/staff/login", async (req, res) => loginRole("staff", parse(LoginStaffBody, req.body).pin, req, res));
router.post("/staff/logout", (_req, res) => { clearSession(res, "staff"); res.json({ ok: true }); });
router.use("/staff", requireRole("staff"));
router.get("/staff/security", async (_req, res) => res.json({
  default_pin: await usesDefaultPin("staff"),
  cannabis_points_enabled: await isCannabisPointsEnabled(),
}));
router.post("/staff/pin", async (req, res) => {
  await authLimit(req, "staff-change-pin", 5);
  const { current_pin, new_pin } = parse(ChangeStaffPinBody, req.body);
  await changePin("staff", current_pin, validatePin(new_pin, "staff"));
  clearSession(res, "staff");
  res.json({ ok: true });
});
router.get("/staff/member", async (req, res) => {
  const data = parse(FindMemberQueryParams, req.query);
  if (Boolean(data.code) === Boolean(data.qr_token)) throw new LoyaltyError(400, "ระบุรหัสสมาชิกหรือ QR อย่างใดอย่างหนึ่ง");
  const token = data.qr_token?.replace(/^JAGUAR1:/, "") ?? null;
  if (token) {
    await rateLimit(`qr-scan:${privateKey(token)}`, 20, 60_000);
    sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_resolve_qr", { p_qr_token: token }));
    return;
  }
  sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_member_login", { p_code: codeValue(data.code!) }));
});
router.get("/staff/cannabis-card", async (req, res) => {
  const data = parse(GetStaffCannabisCardQueryParams, req.query);
  if (Boolean(data.code) === Boolean(data.qr_token)) throw new LoyaltyError(400, "ระบุรหัสสมาชิกหรือ QR อย่างใดอย่างหนึ่ง");
  const member = data.qr_token
    ? await loyaltyStore<MemberCard>("jaguar_resolve_qr", { p_qr_token: data.qr_token.replace(/^JAGUAR1:/, "") })
    : await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(data.code!) });
  sendJson(res, GetStaffCannabisCardResponse, await loyaltyStore("jaguar_cannabis_card", { p_member: member.id, p_staff: true }));
});
router.get("/staff/members", async (req, res) => {
  const { q = "" } = parse(ListStaffMembersQueryParams, req.query);
  sendJson(res, ListStaffMembersResponse, await listStaffMembers(q));
});
router.post("/staff/members", async (req, res) => {
  await authLimit(req, "staff-create-member", 30);
  const { name, member_code, phone, nickname } = parse(CreateStaffMemberBody, req.body);
  if (!name.trim()) throw new LoyaltyError(400, "กรุณาระบุชื่อสมาชิก");
  sendJson(res, GetMemberCardResponse, await createMember(name.trim(), codeValue(member_code), phoneValue(phone), normalizeNickname(nickname)), 201);
});
router.post("/staff/stamp", async (req, res) => {
  await authLimit(req, "staff-stamp", 60);
  const { member_code, qr_token, bottle_count, formula, request_id } = parse(RecordStaffSaleBody, req.body);
  if (Boolean(member_code) === Boolean(qr_token)) throw new LoyaltyError(400, "ระบุรหัสสมาชิกหรือ QR อย่างใดอย่างหนึ่ง");
  const member = typeof member_code === "string"
    ? await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(member_code) })
    : await loyaltyStore<MemberCard>("jaguar_resolve_qr", { p_qr_token: qr_token!.replace(/^JAGUAR1:/, "") });
  await rateLimit(`staff-credit-member:${privateKey(member.id)}`, 30, 60_000);
  sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_staff_stamp", {
    p_member: member.id, p_bottle_count: bottle_count, p_formula: formula, p_request: request_id,
  }));
});
router.get("/staff/member-sales", async (req, res) => {
  await authLimit(req, "staff-member-sales-read", 120);
  const { code } = parse(ListStaffSalesQueryParams, req.query);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(code) });
  sendJson(res, ListStaffSalesResponse, await listStaffSales(member.id));
});
router.patch("/staff/sales/:id", async (req, res) => {
  await authLimit(req, "staff-sale-correction", 30);
  const { id } = parse(CorrectStaffSaleParams, req.params);
  const data = parse(CorrectStaffSaleBody, req.body);
  const result = await correctStaffSale(id, data);
  const member = await loyaltyStore<MemberCard>("jaguar_card", { p_member: result.member_id });
  sendJson(res, CorrectStaffSaleResponse, { member, sales: result.sales });
});
router.post("/staff/cannabis-stamp", async (req, res) => {
  await authLimit(req, "staff-cannabis-stamp", 60);
  const data = parse(AddCannabisStampsBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(data.member_code) });
  await rateLimit(`staff-cannabis-credit:${privateKey(member.id)}`, 30, 60_000);
  sendJson(res, AddCannabisStampsResponse, await loyaltyStore("jaguar_staff_cannabis_stamp", {
    p_member: member.id, p_grams: data.grams, p_request: data.request_id,
  }));
});
router.patch("/staff/cannabis-transactions/:id", async (req, res) => {
  await authLimit(req, "staff-cannabis-correction", 30);
  const { id } = parse(CorrectStaffCannabisTransactionParams, req.params);
  const data = parse(CorrectStaffCannabisTransactionBody, req.body);
  const memberId = await correctStaffCannabisSale(id, data);
  sendJson(res, CorrectStaffCannabisTransactionResponse, await loyaltyStore("jaguar_cannabis_card", { p_member: memberId, p_staff: true }));
});
router.post("/staff/cannabis-redeem", async (req, res) => {
  await authLimit(req, "staff-cannabis-redeem", 30);
  const data = parse(RedeemCannabisAtCounterBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(data.member_code) });
  await rateLimit(`staff-cannabis-redeem:${privateKey(member.id)}`, 15, 60_000);
  sendJson(res, RedeemCannabisAtCounterResponse, await loyaltyStore("jaguar_staff_cannabis_redeem", {
    p_member: member.id, p_request: data.request_id,
  }));
});
router.post("/staff/redeem", async (req, res) => {
  await authLimit(req, "staff-redeem", 30);
  const { member_code: code, request_id: requestId } = parse(RedeemAtCounterBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(code) });
  await rateLimit(`staff-redeem-member:${privateKey(member.id)}`, 15, 60_000);
  sendJson(res, RedeemAtCounterResponse, await loyaltyStore("jaguar_staff_redeem", { p_member: member.id, p_request: requestId }));
});
router.get("/staff/redemptions", async (_req, res) => sendJson(res, ListPendingRedemptionsResponse,
  await loyaltyStore("jaguar_redemptions", { p_member: null, p_pending_only: true }),
));
router.get("/staff/redemptions/recent", async (req, res) => {
  await authLimit(req, "staff-redemptions-recent-read", 60);
  sendJson(res, ListRecentStaffRedemptionsResponse, await listRecentStaffRedemptions());
});
router.patch("/staff/redemptions/:id", async (req, res) => {
  await authLimit(req, "staff-redemption-correction", 30);
  const { id } = parse(CorrectStaffRedemptionParams, req.params);
  const data = parse(CorrectStaffRedemptionBody, req.body);
  sendJson(res, CorrectStaffRedemptionResponse, await correctStaffRedemption(id, data));
});
router.post("/staff/redemptions/:id/confirm", async (req, res) => {
  await authLimit(req, "staff-redemption-confirm", 60);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  sendJson(res, ConfirmRedemptionResponse, await loyaltyStore("jaguar_confirm_redemption", { p_redemption: id }));
});
router.get("/staff/rewards", async (req, res) => {
  await authLimit(req, "staff-rewards-read", 60);
  sendJson(res, ListStaffRewardsResponse, await listStaffRewards());
});
router.get("/staff/banking/today", async (_req, res) =>
  sendJson(res, GetStaffBankingResponse, await getStaffBanking()));
router.post("/staff/banking/transfers", async (req, res) => {
  await authLimit(req, "staff-bank-transfer", 90);
  const data = parse(RecordStaffBankTransferBody, req.body);
  sendJson(res, RecordStaffBankTransferResponse, await recordBankTransfer(data, "staff"), 201);
});
router.patch("/staff/banking/transfers/:id", async (req, res) => {
  await authLimit(req, "staff-bank-transfer-correction", 30);
  const { id } = parse(CorrectStaffBankTransferParams, req.params);
  const data = parse(CorrectStaffBankTransferBody, req.body);
  sendJson(res, CorrectStaffBankTransferResponse, await correctStaffBankTransfer(id, data));
});

// Owner suite: separate cookie and access boundary, no staff-session escalation.
router.post("/owner/login", async (req, res) => loginRole("owner", parse(LoginOwnerBody, req.body).pin, req, res));
router.post("/owner/logout", (_req, res) => { clearSession(res, "owner"); res.json({ ok: true }); });
router.use("/owner", requireRole("owner"));
router.get("/owner/security", async (_req, res) => res.json({
  staff_default_pin: await usesDefaultPin("staff"),
  owner_default_pin: await usesDefaultPin("owner"),
  cannabis_points_enabled: await isCannabisPointsEnabled(),
}));
router.post("/owner/pins", async (req, res) => {
  await authLimit(req, "owner-change-pins", 5);
  const { staff_pin, owner_pin } = parse(ChangeOwnerPinsBody, req.body);
  const pins = {
    ...(staff_pin === undefined ? {} : { staff: validatePin(staff_pin, "staff") }),
    ...(owner_pin === undefined ? {} : { owner: validatePin(owner_pin, "owner") }),
  };
  await ownerSetPins(pins);
  clearSession(res, "owner");
  res.json({ ok: true, staff_default_pin: await usesDefaultPin("staff"), owner_default_pin: await usesDefaultPin("owner") });
});
router.get("/owner/summary", async (_req, res) => sendJson(res, GetOwnerSummaryResponse, await ownerReport()));
router.patch("/owner/features/cannabis-points", async (req, res) => {
  await authLimit(req, "owner-cannabis-feature", 20);
  const { enabled } = parse(UpdateCannabisPointsFeatureBody, req.body);
  sendJson(res, UpdateCannabisPointsFeatureResponse, await loyaltyStore("jaguar_cannabis_feature_set", { p_enabled: enabled }));
});
router.get("/owner/banking", async (_req, res) =>
  sendJson(res, GetOwnerBankingResponse, await getOwnerBanking()));
router.post("/owner/banking/accounts", async (req, res) => {
  await authLimit(req, "owner-bank-account-create", 20);
  const data = parse(CreateOwnerBankAccountBody, req.body);
  sendJson(res, CreateOwnerBankAccountResponse, await createBankAccount(data), 201);
});
router.patch("/owner/banking/accounts/:id", async (req, res) => {
  await authLimit(req, "owner-bank-account-update", 30);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  const data = parse(UpdateOwnerBankAccountBody, req.body);
  sendJson(res, UpdateOwnerBankAccountResponse, await updateBankAccount(id, data));
});
router.post("/owner/banking/accounts/:id/select-today", async (req, res) => {
  await authLimit(req, "owner-bank-account-select", 20);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  sendJson(res, SelectOwnerBankAccountForTodayResponse, await selectBankAccountForToday(id));
});
router.get("/owner/members", async (req, res) => {
  const { q = "" } = parse(ListOwnerMembersQueryParams, req.query);
  sendJson(res, ListOwnerMembersResponse, await listStaffMembers(q));
});
router.post("/owner/members", async (req, res) => {
  await authLimit(req, "owner-create-member", 30);
  const { name, member_code, phone, nickname } = parse(CreateOwnerMemberBody, req.body);
  if (!name.trim()) throw new LoyaltyError(400, "กรุณาระบุชื่อสมาชิก");
  sendJson(res, GetMemberCardResponse, await createMember(name.trim(), codeValue(member_code), phoneValue(phone), normalizeNickname(nickname)), 201);
});
router.delete("/owner/members/:id", async (req, res) => {
  await authLimit(req, "owner-delete-member", 30);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  await softDeleteMember(id);
  res.json({ ok: true });
});
router.get("/owner/rewards", async (_req, res) => sendJson(res, ListOwnerRewardsResponse, await listStaffRewards()));
router.post("/owner/rewards", async (req, res) => {
  await authLimit(req, "owner-create-reward", 30);
  const { name, description = "", points_cost: cost } = parse(CreateOwnerRewardBody, req.body);
  if (!name.trim()) {
    throw new LoyaltyError(400, "กรุณาระบุชื่อรางวัล รายละเอียดไม่เกิน 500 ตัวอักษร และแต้ม 10–100000");
  }
  sendJson(res, CreateOwnerRewardResponse, await createReward(name.trim(), description.trim(), cost), 201);
});
router.patch("/owner/rewards/:id", async (req, res) => {
  await authLimit(req, "owner-update-reward", 30);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  const { is_active } = parse(UpdateOwnerRewardBody, req.body);
  sendJson(res, UpdateOwnerRewardResponse, await setRewardActive(id, is_active));
});
router.get("/owner/pending", async (_req, res) => sendJson(res, ListOwnerPendingResponse, await loyaltyStore("jaguar_redemptions", { p_member: null, p_pending_only: true })));
router.post("/owner/redemptions/:id/confirm", async (req, res) => {
  await authLimit(req, "owner-redemption-confirm", 60);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  sendJson(res, ConfirmOwnerRedemptionResponse, await loyaltyStore("jaguar_confirm_redemption", { p_redemption: id }));
});

router.get("/health", async (_req, res) => {
  await loyaltyStore("jaguar_health");
  res.json({
    status: "ok",
    storage: "postgresql",
  });
});
router.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const known = err instanceof LoyaltyError;
  const status = known ? err.status : 500;
  if (status >= 500) req.log.error({ operation: "loyalty_request", status }, "Loyalty request failed");
  if (status === 429) res.setHeader("Retry-After", "900");
  res.status(status).json({ error: known ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง" });
});

export default router;
