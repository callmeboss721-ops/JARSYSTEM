import { createHmac, randomUUID, timingSafeEqual, createHash, scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { pool } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
import { LoyaltyError } from "./loyalty-errors";

type Session = { role: "member" | "staff" | "owner"; sub: string; exp: number; nonce: string };
const windows = new Map<string, { count: number; expires: number }>();
const deriveKey = promisify(scrypt);
const COOKIE = { member: "jaguar_member", staff: "jaguar_staff", owner: "jaguar_owner" };

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new LoyaltyError(503, "ผู้ดูแลต้องตั้งค่า SESSION_SECRET อย่างน้อย 32 ตัวอักษร");
  return value;
}

function signature(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function issueSession(res: Response, role: Session["role"], sub: string): void {
  const maxAge = role === "member" ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
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

type StaffRole = "staff" | "owner";
const pinSetting = (role: StaffRole) => `${role}_pin_hash`;
const defaultPin = (role: StaffRole) => process.env[role === "staff" ? "STAFF_PIN" : "OWNER_PIN"] ?? (role === "staff" ? "2024" : "8899");
function bootstrapPin(role: StaffRole): string {
  const pin = defaultPin(role);
  if (process.env.NODE_ENV !== "development") {
    const configured = process.env[role === "staff" ? "STAFF_PIN" : "OWNER_PIN"];
    const pattern = role === "owner" ? /^\d{6,12}$/ : /^\d{4,12}$/;
    if (!configured || !pattern.test(pin) || ["2024", "8899", "2468"].includes(pin) || /^(.)\1+$/.test(pin)) {
      throw new LoyaltyError(503, "ยังไม่ได้ตั้งค่า PIN ที่ปลอดภัยสำหรับระบบจริง กรุณาตั้งค่าก่อนเปิดใช้งาน");
    }
  }
  return pin;
}
export async function usesDefaultPin(role: StaffRole): Promise<boolean> {
  const result = await pool.query("select 1 from jaguar_settings where key=$1", [pinSetting(role)]);
  return !result.rowCount && (!process.env[role === "staff" ? "STAFF_PIN" : "OWNER_PIN"]);
}

export async function adminSessionSubject(role: StaffRole): Promise<string> {
  const stored = (await pool.query("select value from jaguar_settings where key=$1", [pinSetting(role)])).rows[0]?.value;
  return `${role}:${createHmac("sha256", secret()).update(stored ?? bootstrapPin(role)).digest("hex")}`;
}

export async function verifyPin(role: StaffRole, pin: string): Promise<boolean> {
  const stored = (await pool.query("select value from jaguar_settings where key=$1", [pinSetting(role)])).rows[0]?.value as string | undefined;
  if (stored) {
    const [salt, hash] = stored.split(":");
    const expected = Buffer.from(hash, "hex");
    const actual = await deriveKey(pin, salt, 64) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  // Initial setup code retained for the requested simple staff flow.
  // Staff can replace it from the protected dashboard; only its salted hash is saved.
  const expected = createHash("sha256").update(bootstrapPin(role)).digest();
  const actual = createHash("sha256").update(pin).digest();
  return timingSafeEqual(expected, actual);
}

async function storePin(role: StaffRole, next: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await deriveKey(next, salt, 64) as Buffer).toString("hex");
  await pool.query(`insert into jaguar_settings(key,value) values($1,$2)
    on conflict(key) do update set value=excluded.value`, [pinSetting(role), `${salt}:${hash}`]);
}

export async function changePin(role: StaffRole, current: string, next: string): Promise<void> {
  if (!await verifyPin(role, current)) throw new LoyaltyError(401, "PIN ปัจจุบันไม่ถูกต้อง");
  if (next === current || /^(.)\1+$/.test(next) || next === defaultPin(role)) {
    throw new LoyaltyError(400, "กรุณาใช้ PIN ใหม่ที่คาดเดายาก และไม่ใช่ค่าเริ่มต้น");
  }
  await storePin(role, next);
}

/** Owner-only reset: both changes commit together and revoke the affected sessions. */
export async function ownerSetPins(pins: Partial<Record<StaffRole, string>>): Promise<void> {
  const updates: { role: StaffRole; value: string }[] = [];
  for (const role of ["staff", "owner"] as const) {
    const next = pins[role];
    if (next === undefined) continue;
    if (!/^\d{4,12}$/.test(next) || /^(.)\1+$/.test(next) || next === defaultPin(role)) {
      throw new LoyaltyError(400, "กรุณาใช้ PIN ใหม่ที่คาดเดายาก และไม่ใช่ค่าเริ่มต้น");
    }
    const salt = randomBytes(16).toString("hex");
    const hash = (await deriveKey(next, salt, 64) as Buffer).toString("hex");
    updates.push({ role, value: `${salt}:${hash}` });
  }
  if (!updates.length) throw new LoyaltyError(400, "ยังไม่ได้ระบุ PIN ใหม่");
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const update of updates) {
      await client.query(`insert into jaguar_settings(key,value) values($1,$2)
        on conflict(key) do update set value=excluded.value`, [pinSetting(update.role), update.value]);
    }
    await client.query("commit");
  } catch {
    await client.query("rollback").catch(() => undefined);
    throw new LoyaltyError(503, "บันทึก PIN ไม่สำเร็จ กรุณาลองใหม่");
  } finally { client.release(); }
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
