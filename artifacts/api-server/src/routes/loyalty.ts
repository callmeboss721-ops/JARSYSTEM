import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  RegisterMemberBody, LoginMemberBody, RequestRedemptionBody, ConfirmRedemptionParams,
  LoginStaffBody, LoginOwnerBody, ChangeStaffPinBody, ChangeOwnerPinsBody,
  CreateStaffMemberBody, CreateOwnerMemberBody, RecordStaffSaleBody, RedeemAtCounterBody,
  AddCannabisStampsBody, RedeemCannabisAtCounterBody, GetStaffCannabisCardQueryParams,
  CreateOwnerRewardBody, UpdateOwnerRewardBody, FindMemberQueryParams,
  ListStaffMembersQueryParams, ListOwnerMembersQueryParams,
  GetMemberCardResponse, ListRewardsResponse, ListMemberActivityResponse, ListMemberSalesResponse,
  GetCannabisMemberCardResponse, GetStaffCannabisCardResponse, AddCannabisStampsResponse, RedeemCannabisAtCounterResponse,
  ListMemberRedemptionsResponse, RequestRedemptionResponse, GetMemberQrResponse,
  ListStaffMembersResponse, RedeemAtCounterResponse, ListStaffRewardsResponse,
  ListPendingRedemptionsResponse, ConfirmRedemptionResponse, GetOwnerSummaryResponse,
  ListOwnerMembersResponse, ListOwnerRewardsResponse, CreateOwnerRewardResponse, UpdateOwnerRewardResponse,
  ListOwnerPendingResponse, ConfirmOwnerRedemptionResponse,
  GetStaffBankingResponse, RecordStaffBankTransferBody, RecordStaffBankTransferResponse,
  GetOwnerBankingResponse, CreateOwnerBankAccountBody, CreateOwnerBankAccountResponse,
  UpdateOwnerBankAccountBody, UpdateOwnerBankAccountResponse, SelectOwnerBankAccountForTodayResponse,
} from "@workspace/api-zod";
import {
  loyaltyStore, listStaffRewards, createReward, setRewardActive, listStaffMembers,
  createMember, softDeleteMember, ownerReport, getMemberQr,
} from "../lib/loyalty-store";
import {
  getStaffBanking, getOwnerBanking, createBankAccount, updateBankAccount,
  selectBankAccountForToday, recordBankTransfer,
} from "../lib/banking-store";
import { LoyaltyError } from "../lib/loyalty-errors";
import {
  clearSession, issueSession, loyaltyGuard, ownerSetPins, privateKey, rateLimit,
  readSession, verifyPin, usesDefaultPin, changePin, adminSessionSubject,
} from "../lib/loyalty-security";

type MemberCard = { id: string; member_code: string; status: string; balance: number; lifetime_earned: number; lifetime_redeemed: number };
type Role = "staff" | "owner";
const router: IRouter = Router();
router.use(loyaltyGuard);

function authLimit(req: Request, category: string, limit = 10) {
  rateLimit(`${category}:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`, limit, 15 * 60_000);
}
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
  authLimit(req, `${role}-login`, 5);
  if (typeof pin !== "string" || !/^\d{4,12}$/.test(pin)) throw new LoyaltyError(400, "PIN เป็นตัวเลข 4–12 หลัก");
  if (!await verifyPin(role, pin)) throw new LoyaltyError(401, "PIN ไม่ถูกต้อง");
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
  authLimit(req, "register", 5);
  const { member_code, phone } = parse(RegisterMemberBody, req.body);
  const card = await loyaltyStore<MemberCard>("jaguar_register", {
    p_code: codeValue(member_code), p_phone: phoneValue(phone),
  });
  issueSession(res, "member", card.id);
  sendJson(res, GetMemberCardResponse, card, 201);
});
router.post("/login", async (req, res) => {
  authLimit(req, "member-login");
  const { member_code } = parse(LoginMemberBody, req.body);
  const code = codeValue(member_code);
  rateLimit(`member-code:${privateKey(code)}`, 20, 15 * 60_000);
  const card = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: code });
  issueSession(res, "member", card.id);
  sendJson(res, GetMemberCardResponse, card);
});
router.post("/logout", (_req, res) => { clearSession(res, "member"); res.json({ ok: true }); });
router.get("/card", async (req, res) => {
  const { sub } = readSession(req, "member");
  sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_card", { p_member: sub }));
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
  rateLimit(`redeem:${sub}`, 5, 60_000);
  const data = parse(RequestRedemptionBody, req.body);
  sendJson(res, RequestRedemptionResponse, await loyaltyStore("jaguar_request_redemption", { p_member: sub, p_reward: data.reward_id }), 201);
});

// Employee desk: its own PIN, cookie, permissions, and limited routes.
router.post("/staff/login", async (req, res) => loginRole("staff", parse(LoginStaffBody, req.body).pin, req, res));
router.post("/staff/logout", (_req, res) => { clearSession(res, "staff"); res.json({ ok: true }); });
router.use("/staff", requireRole("staff"));
router.get("/staff/security", async (_req, res) => res.json({ default_pin: await usesDefaultPin("staff") }));
router.post("/staff/pin", async (req, res) => {
  authLimit(req, "staff-change-pin", 5);
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
    rateLimit(`qr-scan:${privateKey(token)}`, 20, 60_000);
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
  sendJson(res, GetStaffCannabisCardResponse, await loyaltyStore("jaguar_cannabis_card", { p_member: member.id }));
});
router.get("/staff/members", async (req, res) => {
  const { q = "" } = parse(ListStaffMembersQueryParams, req.query);
  sendJson(res, ListStaffMembersResponse, await listStaffMembers(q));
});
router.post("/staff/members", async (req, res) => {
  authLimit(req, "staff-create-member", 30);
  const { name, member_code, phone } = parse(CreateStaffMemberBody, req.body);
  if (!name.trim()) throw new LoyaltyError(400, "กรุณาระบุชื่อสมาชิก");
  sendJson(res, GetMemberCardResponse, await createMember(name.trim(), codeValue(member_code), phoneValue(phone)), 201);
});
router.post("/staff/stamp", async (req, res) => {
  authLimit(req, "staff-stamp", 60);
  const { member_code, qr_token, bottle_count, formula, request_id } = parse(RecordStaffSaleBody, req.body);
  if (Boolean(member_code) === Boolean(qr_token)) throw new LoyaltyError(400, "ระบุรหัสสมาชิกหรือ QR อย่างใดอย่างหนึ่ง");
  const member = typeof member_code === "string"
    ? await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(member_code) })
    : await loyaltyStore<MemberCard>("jaguar_resolve_qr", { p_qr_token: qr_token!.replace(/^JAGUAR1:/, "") });
  rateLimit(`staff-credit-member:${privateKey(member.id)}`, 30, 60_000);
  sendJson(res, GetMemberCardResponse, await loyaltyStore("jaguar_staff_stamp", {
    p_member: member.id, p_bottle_count: bottle_count, p_formula: formula, p_request: request_id,
  }));
});
router.post("/staff/cannabis-stamp", async (req, res) => {
  authLimit(req, "staff-cannabis-stamp", 60);
  const data = parse(AddCannabisStampsBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(data.member_code) });
  rateLimit(`staff-cannabis-credit:${privateKey(member.id)}`, 30, 60_000);
  sendJson(res, AddCannabisStampsResponse, await loyaltyStore("jaguar_staff_cannabis_stamp", {
    p_member: member.id, p_grams: data.grams, p_request: data.request_id,
  }));
});
router.post("/staff/cannabis-redeem", async (req, res) => {
  authLimit(req, "staff-cannabis-redeem", 30);
  const data = parse(RedeemCannabisAtCounterBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(data.member_code) });
  rateLimit(`staff-cannabis-redeem:${privateKey(member.id)}`, 15, 60_000);
  sendJson(res, RedeemCannabisAtCounterResponse, await loyaltyStore("jaguar_staff_cannabis_redeem", {
    p_member: member.id, p_request: data.request_id,
  }));
});
router.post("/staff/redeem", async (req, res) => {
  const { member_code: code, request_id: requestId } = parse(RedeemAtCounterBody, req.body);
  const member = await loyaltyStore<MemberCard>("jaguar_member_login", { p_code: codeValue(code) });
  sendJson(res, RedeemAtCounterResponse, await loyaltyStore("jaguar_staff_redeem", { p_member: member.id, p_request: requestId }));
});
router.get("/staff/redemptions", async (_req, res) => sendJson(res, ListPendingRedemptionsResponse,
  await loyaltyStore("jaguar_redemptions", { p_member: null, p_pending_only: true }),
));
router.post("/staff/redemptions/:id/confirm", async (req, res) => {
  const { id } = parse(ConfirmRedemptionParams, req.params);
  sendJson(res, ConfirmRedemptionResponse, await loyaltyStore("jaguar_confirm_redemption", { p_redemption: id }));
});
router.get("/staff/rewards", async (_req, res) => sendJson(res, ListStaffRewardsResponse, await listStaffRewards()));
router.get("/staff/banking/today", async (_req, res) =>
  sendJson(res, GetStaffBankingResponse, await getStaffBanking()));
router.post("/staff/banking/transfers", async (req, res) => {
  authLimit(req, "staff-bank-transfer", 90);
  const data = parse(RecordStaffBankTransferBody, req.body);
  sendJson(res, RecordStaffBankTransferResponse, await recordBankTransfer(data, "staff"), 201);
});

// Owner suite: separate cookie and access boundary, no staff-session escalation.
router.post("/owner/login", async (req, res) => loginRole("owner", parse(LoginOwnerBody, req.body).pin, req, res));
router.post("/owner/logout", (_req, res) => { clearSession(res, "owner"); res.json({ ok: true }); });
router.use("/owner", requireRole("owner"));
router.get("/owner/security", async (_req, res) => res.json({
  staff_default_pin: await usesDefaultPin("staff"),
  owner_default_pin: await usesDefaultPin("owner"),
}));
router.post("/owner/pins", async (req, res) => {
  authLimit(req, "owner-change-pins", 5);
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
router.get("/owner/banking", async (_req, res) =>
  sendJson(res, GetOwnerBankingResponse, await getOwnerBanking()));
router.post("/owner/banking/accounts", async (req, res) => {
  authLimit(req, "owner-bank-account-create", 20);
  const data = parse(CreateOwnerBankAccountBody, req.body);
  sendJson(res, CreateOwnerBankAccountResponse, await createBankAccount(data), 201);
});
router.patch("/owner/banking/accounts/:id", async (req, res) => {
  authLimit(req, "owner-bank-account-update", 30);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  const data = parse(UpdateOwnerBankAccountBody, req.body);
  sendJson(res, UpdateOwnerBankAccountResponse, await updateBankAccount(id, data));
});
router.post("/owner/banking/accounts/:id/select-today", async (req, res) => {
  authLimit(req, "owner-bank-account-select", 20);
  const { id } = parse(ConfirmRedemptionParams, req.params);
  sendJson(res, SelectOwnerBankAccountForTodayResponse, await selectBankAccountForToday(id));
});
router.get("/owner/members", async (req, res) => {
  const { q = "" } = parse(ListOwnerMembersQueryParams, req.query);
  sendJson(res, ListOwnerMembersResponse, await listStaffMembers(q));
});
router.post("/owner/members", async (req, res) => {
  authLimit(req, "owner-create-member", 30);
  const { name, member_code, phone } = parse(CreateOwnerMemberBody, req.body);
  if (!name.trim()) throw new LoyaltyError(400, "กรุณาระบุชื่อสมาชิก");
  sendJson(res, GetMemberCardResponse, await createMember(name.trim(), codeValue(member_code), phoneValue(phone)), 201);
});
router.delete("/owner/members/:id", async (req, res) => {
  const { id } = parse(ConfirmRedemptionParams, req.params);
  await softDeleteMember(id);
  res.json({ ok: true });
});
router.get("/owner/rewards", async (_req, res) => sendJson(res, ListOwnerRewardsResponse, await listStaffRewards()));
router.post("/owner/rewards", async (req, res) => {
  const { name, description = "", points_cost: cost } = parse(CreateOwnerRewardBody, req.body);
  if (!name.trim()) {
    throw new LoyaltyError(400, "กรุณาระบุชื่อรางวัล รายละเอียดไม่เกิน 500 ตัวอักษร และแต้ม 10–100000");
  }
  sendJson(res, CreateOwnerRewardResponse, await createReward(name.trim(), description.trim(), cost), 201);
});
router.patch("/owner/rewards/:id", async (req, res) => {
  const { id } = parse(ConfirmRedemptionParams, req.params);
  const { is_active } = parse(UpdateOwnerRewardBody, req.body);
  sendJson(res, UpdateOwnerRewardResponse, await setRewardActive(id, is_active));
});
router.get("/owner/pending", async (_req, res) => sendJson(res, ListOwnerPendingResponse, await loyaltyStore("jaguar_redemptions", { p_member: null, p_pending_only: true })));
router.post("/owner/redemptions/:id/confirm", async (req, res) => {
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
