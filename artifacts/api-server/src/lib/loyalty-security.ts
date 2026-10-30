import { createHmac, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { LoyaltyError } from "./loyalty-errors";

type Session = { role: "member" | "admin"; sub: string; exp: number; nonce: string };
const windows = new Map<string, { count: number; expires: number }>();
const isProduction = process.env.NODE_ENV === "production";
const COOKIE = { member: "jaguar_member", admin: "jaguar_staff" };

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new LoyaltyError(503, "ผู้ดูแลต้องตั้งค่า SESSION_SECRET อย่างน้อย 32 ตัวอักษร");
  return value;
}

function signature(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function issueSession(res: Response, role: Session["role"], sub: string): void {
  const maxAge = role === "admin" ? 2 * 60 * 60 : 30 * 24 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ role, sub, exp: Math.floor(Date.now() / 1000) + maxAge, nonce: randomUUID() })).toString("base64url");
  res.cookie(COOKIE[role], `${payload}.${signature(payload)}`, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/api/loyalty", maxAge: maxAge * 1000,
  });
}

export function clearSession(res: Response, role: Session["role"]): void {
  res.clearCookie(COOKIE[role], { httpOnly: true, secure: true, sameSite: "lax", path: "/api/loyalty" });
}

export function readSession(req: Request, role: Session["role"]): Session {
  const token: unknown = req.cookies?.[COOKIE[role]];
  if (typeof token !== "string" || token.length > 1500) throw new LoyaltyError(401, "กรุณาเข้าสู่ระบบ");
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra) throw new LoyaltyError(401, "กรุณาเข้าสู่ระบบใหม่");
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new LoyaltyError(401, "กรุณาเข้าสู่ระบบใหม่");
  let value: Session;
  try { value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session; }
  catch { throw new LoyaltyError(401, "กรุณาเข้าสู่ระบบใหม่"); }
  if (value.role !== role || typeof value.sub !== "string" || value.exp <= Date.now() / 1000) {
    throw new LoyaltyError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  return value;
}

export function verifyPin(pin: string): boolean {
  const configured = process.env.ADMIN_PIN;
  // The requested default is strictly a development convenience.
  if (isProduction && (!configured || configured === "2468")) {
    throw new LoyaltyError(503, "ผู้ดูแลต้องตั้ง ADMIN_PIN ใหม่ก่อนเปิดใช้งานจริง");
  }
  const expected = createHash("sha256").update(configured ?? "2468").digest();
  const actual = createHash("sha256").update(pin).digest();
  return timingSafeEqual(expected, actual);
}

export function rateLimit(key: string, max: number, periodMs: number): void {
  const now = Date.now();
  if (windows.size > 10_000) {
    for (const [k, v] of windows) if (v.expires <= now) windows.delete(k);
    if (windows.size > 10_000) throw new LoyaltyError(429, "ระบบมีคำขอจำนวนมาก กรุณารอสักครู่");
  }
  let entry = windows.get(key);
  if (!entry || entry.expires <= now) {
    entry = { count: 0, expires: now + periodMs };
    windows.set(key, entry);
  }
  entry.count++;
  if (entry.count > max) throw new LoyaltyError(429, "ทำรายการบ่อยเกินไป กรุณารอแล้วลองใหม่");
}

export function privateKey(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function loyaltyGuard(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const hasBody = Number(req.get("content-length") ?? "0") > 0 || Boolean(req.get("transfer-encoding"));
    if (hasBody && !req.is("application/json")) throw new LoyaltyError(415, "ต้องส่งข้อมูลแบบ JSON");
    const origin = req.get("origin");
    const host = req.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) throw new Error("origin mismatch");
      } catch { throw new LoyaltyError(403, "ไม่อนุญาตคำขอจากเว็บไซต์อื่น"); }
    }
    if (req.get("sec-fetch-site") === "cross-site") throw new LoyaltyError(403, "ไม่อนุญาตคำขอจากเว็บไซต์อื่น");
  }
  rateLimit(`all:${privateKey(req.ip ?? req.socket.remoteAddress ?? "unknown")}`, 180, 60_000);
  next();
}
