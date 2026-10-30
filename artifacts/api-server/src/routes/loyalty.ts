import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  RegisterMemberBody, LoginMemberBody, LoginAdminBody, RequestRedemptionBody,
  AddMemberPointsBody, ConfirmRedemptionParams, FindMemberQueryParams,
} from "@workspace/api-zod";
import { loyaltyRpc } from "../lib/loyalty-supabase";
import { LoyaltyError } from "../lib/loyalty-errors";
import { clearSession, issueSession, loyaltyGuard, privateKey, rateLimit, readSession, verifyPin } from "../lib/loyalty-security";

type MemberCard = { id: string; member_code: string; status: string; balance: number; lifetime_earned: number; lifetime_redeemed: number };
const router: IRouter = Router();
router.use(loyaltyGuard);

function authLimit(req: Request, category: string, limit = 10) {
  rateLimit(`${category}:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`, limit, 15 * 60_000);
}
function codeValue(value: string): string { return value.trim().toUpperCase(); }
function phoneValue(value: string): string {
  const trimmed = value.trim().replace(/[\s()-]/g, "");
  const normalized = trimmed.startsWith("0") ? `+66${trimmed.slice(1)}` : trimmed;
  if (!/^\+66[689]\d{8}$/.test(normalized)) throw new LoyaltyError(400, "กรุณากรอกเบอร์มือถือไทย 10 หลัก หรือรูปแบบ +66");
  return normalized;
}
function parse<T>(schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } }, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new LoyaltyError(400, "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
  return result.data;
}

router.post("/register", async (req, res) => {
  authLimit(req, "register", 5);
  const data = parse(RegisterMemberBody, req.body);
  const card = await loyaltyRpc<MemberCard>("jaguar_register", { p_code: codeValue(data.member_code), p_phone: phoneValue(data.phone) });
  issueSession(res, "member", card.id);
  req.log.info({ operation: "member_registered" }, "Loyalty mutation completed");
  res.status(201).json(card);
});

router.post("/login", async (req, res) => {
  authLimit(req, "member-login");
  const data = parse(LoginMemberBody, req.body);
  const code = codeValue(data.member_code);
  rateLimit(`code:${privateKey(code)}`, 20, 15 * 60_000);
  const card = await loyaltyRpc<MemberCard>("jaguar_member_login", { p_code: code });
  issueSession(res, "member", card.id);
  res.json(card);
});
router.post("/logout", (_req, res) => { clearSession(res, "member"); res.json({ ok: true }); });
router.get("/card", async (req, res) => {
  const { sub } = readSession(req, "member");
  res.json(await loyaltyRpc("jaguar_card", { p_member: sub }));
});
router.get("/rewards", async (_req, res) => res.json(await loyaltyRpc("jaguar_rewards")));
router.get("/activity", async (req, res) => {
  const { sub } = readSession(req, "member");
  res.json(await loyaltyRpc("jaguar_activity", { p_member: sub }));
});
router.get("/redemptions", async (req, res) => {
  const { sub } = readSession(req, "member");
  res.json(await loyaltyRpc("jaguar_redemptions", { p_member: sub, p_pending_only: false }));
});
router.post("/redemptions", async (req, res) => {
  const { sub } = readSession(req, "member");
  rateLimit(`redeem:${sub}`, 5, 60_000);
  const data = parse(RequestRedemptionBody, req.body);
  res.status(201).json(await loyaltyRpc("jaguar_request_redemption", { p_member: sub, p_reward: data.reward_id }));
});
router.post("/admin/login", async (req, res) => {
  authLimit(req, "admin-login", 5);
  const data = parse(LoginAdminBody, req.body);
  if (!verifyPin(data.pin)) throw new LoyaltyError(401, "PIN ไม่ถูกต้อง");
  issueSession(res, "admin", "staff");
  res.json({ ok: true });
});
router.post("/admin/logout", (_req, res) => { clearSession(res, "admin"); res.json({ ok: true }); });
router.use("/admin", (req, _res, next) => { readSession(req, "admin"); next(); });
router.get("/admin/summary", async (_req, res) => res.json(await loyaltyRpc("jaguar_summary")));
router.get("/admin/member", async (req, res) => {
  const data = parse(FindMemberQueryParams, req.query);
  res.json(await loyaltyRpc("jaguar_member_login", { p_code: codeValue(data.code) }));
});
router.post("/admin/points", async (req, res) => {
  readSession(req, "admin");
  const data = parse(AddMemberPointsBody, req.body);
  rateLimit("staff-points", 60, 60_000);
  res.json(await loyaltyRpc("jaguar_add_points", { p_member: data.member_id, p_points: data.points, p_request: data.request_id }));
  req.log.info({ operation: "points_credited" }, "Loyalty mutation completed");
});
router.get("/admin/redemptions", async (_req, res) => {
  res.json(await loyaltyRpc("jaguar_redemptions", { p_member: null, p_pending_only: true }));
});
router.post("/admin/redemptions/:id/confirm", async (req, res) => {
  const data = parse(ConfirmRedemptionParams, req.params);
  res.json(await loyaltyRpc("jaguar_confirm_redemption", { p_redemption: data.id }));
  req.log.info({ operation: "redemption_confirmed" }, "Loyalty mutation completed");
});
router.get("/health", async (_req, res) => {
  await loyaltyRpc("jaguar_health");
  res.json({ status: "ok" });
});

router.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const known = err instanceof LoyaltyError;
  const status = known ? err.status : 500;
  // Do not log bodies, codes, phone numbers, PINs, DB response bodies or cookies.
  if (status >= 500) req.log.error({ operation: "loyalty_request", status }, "Loyalty request failed");
  if (status === 429) res.setHeader("Retry-After", "900");
  res.status(status).json({ error: known ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง" });
});

export default router;
