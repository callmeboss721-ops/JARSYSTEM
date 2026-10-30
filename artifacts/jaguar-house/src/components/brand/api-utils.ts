import type { QueryClient } from "@tanstack/react-query";
import {
  getGetMemberCardQueryKey,
  getListMemberActivityQueryKey,
  getListMemberRedemptionsQueryKey,
  getListRewardsQueryKey,
} from "@workspace/api-client-react";

export function errStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

export function errMessage(e: unknown, fallback = "เกิดข้อผิดพลาด ลองอีกครั้ง"): string {
  if (e && typeof e === "object" && "data" in e) {
    const d = (e as { data: unknown }).data;
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      for (const k of ["message", "error", "detail"]) {
        if (typeof o[k] === "string" && o[k]) return o[k] as string;
      }
    }
    if (typeof d === "string" && d.trim()) return d.trim();
  }
  const s = errStatus(e);
  if (s === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
  if (s === 404) return "ไม่พบข้อมูล";
  if (s === 409) return "ข้อมูลนี้ถูกใช้แล้ว";
  if (!s) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
  return fallback;
}

export const LIVE = { refetchInterval: 15_000, refetchOnWindowFocus: true } as const;

const HINT = "jkh_session_hint";
export function setSessionHint(on: boolean) {
  try {
    if (on) localStorage.setItem(HINT, "1");
    else localStorage.removeItem(HINT);
  } catch {
    /* storage unavailable */
  }
}
export function getSessionHint(): boolean {
  try {
    return localStorage.getItem(HINT) === "1";
  } catch {
    return false;
  }
}

export function clearMemberCache(qc: QueryClient) {
  for (const key of [
    getGetMemberCardQueryKey(),
    getListMemberActivityQueryKey(),
    getListMemberRedemptionsQueryKey(),
    getListRewardsQueryKey(),
    ["/api/loyalty/sales"],
    ["/api/loyalty/qr"],
  ]) {
    qc.removeQueries({ queryKey: key });
  }
}

export function invalidateMember(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: getGetMemberCardQueryKey() }),
    qc.invalidateQueries({ queryKey: getListMemberActivityQueryKey() }),
    qc.invalidateQueries({ queryKey: getListMemberRedemptionsQueryKey() }),
    qc.invalidateQueries({ queryKey: getListRewardsQueryKey() }),
  ]);
}

export const CODE_RE = /^[A-Za-z0-9]{6,10}$/;
export const normalizePhone = (p: string) => p.replace(/[\s-]/g, "");
export const PHONE_RE = /^(0\d{8,9}|\+66\d{8,9})$/;

export function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function statusLabel(s: string) {
  const v = s.toLowerCase();
  if (v === "pending") return { th: "รอพนักงานยืนยัน", cls: "chip-pending" };
  if (v === "confirmed" || v === "completed" || v === "done") return { th: "ยืนยันแล้ว", cls: "chip-done" };
  if (v === "cancelled" || v === "rejected") return { th: "ยกเลิก", cls: "" };
  return { th: s, cls: "" };
}
