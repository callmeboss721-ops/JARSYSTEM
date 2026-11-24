import type { Formula, MemberCard, Sale, Reward, Redemption, OwnerSummary } from "@workspace/api-client-react";
export type { Formula, Sale };
export type MemberCardData = MemberCard;
export type RewardData = Reward;
export type RedemptionData = Redemption;
export type Summary = OwnerSummary;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(15000),
      credentials: "include",
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่", 0);
  }
  const raw = await response.text();
  let body: unknown = null;
  try { body = raw ? JSON.parse(raw) : null; } catch {
    if (response.ok) throw new ApiError("ระบบตอบกลับไม่ถูกต้อง กรุณาลองใหม่", 502);
  }
  if (!response.ok) {
    const payload = body && typeof body === "object" ? body as Record<string, unknown> : null;
    const message = payload && ["message", "error", "detail"].find((key) => typeof payload[key] === "string")
      ? String(payload![["message", "error", "detail"].find((key) => typeof payload[key] === "string")!])
      : `คำขอไม่สำเร็จ (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export const json = (method: string, data?: unknown): RequestInit => ({
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const formulaLabels: Record<Formula, string> = {
  red: "สูตรแดง Original",
  silver: "สูตรฟ้า Refresh / Mild",
  gold: "สูตรทอง Premium",
};
export const gradeFor = (earned: number) => earned >= 100 ? "Black VIP" : earned >= 40 ? "Gold" : "Green Card / สมาชิกใหม่";
export const errorText = (e: unknown) => e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
export const codePattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{4,6})[A-Za-z0-9]$/;
export const phonePattern = /^(0\d{8,9}|\+66\d{8,9})$/;
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);

export type Scope = "staff" | "owner";
export const STAFF = "/api/loyalty/staff";
export const OWNER = "/api/loyalty/owner";
/** Remove every cached query whose first key segment is under the role prefix (string-prefix match). */
export function clearScope(qc: import("@tanstack/react-query").QueryClient, scope: Scope) {
  const prefix = scope === "staff" ? STAFF : OWNER;
  qc.removeQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith(prefix) });
}
export const statusOf = (e: unknown) => (e && typeof e === "object" && "status" in e ? (e as { status?: number }).status : undefined);
export const isWholeBaht = (s: string) => /^\d+$/.test(s.trim()) && Number.isSafeInteger(Number(s)) && Number(s) >= 1 && Number(s) <= 100000000;
export const isBottleCount = (s: string) => /^\d+$/.test(s.trim()) && Number.isSafeInteger(Number(s)) && Number(s) >= 1 && Number(s) <= 999;
export const bundlePrice = (bottles: number) => bottles * 50;
