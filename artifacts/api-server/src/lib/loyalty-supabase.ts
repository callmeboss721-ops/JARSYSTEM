import { ReplitConnectors } from "@replit/connectors-sdk";
import { LoyaltyError } from "./loyalty-errors";

const connectors = new ReplitConnectors();
const PROJECT_REF = "mbwkwgeznqrccfcpqbhp";
let verifiedUntil = 0;

// Only server code uses the connector. No database credential is sent to clients.
async function rpcRequest(name: string, data: Record<string, unknown>): Promise<unknown> {
  let response: Response;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // SDK proxy has no AbortSignal option; bound the caller's wait explicitly.
    // Credits and confirmations are idempotent because the remote call may finish
    // after a timeout. No automatic retries of non-idempotent writes.
    response = await Promise.race([
      connectors.proxy("supabase", `/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("supabase_timeout")), 10_000);
      }),
    ]);
  } catch {
    throw new LoyaltyError(503, "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาลองใหม่ภายหลัง");
  } finally {
    clearTimeout(timer);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = typeof body === "object" && body !== null && "code" in body ? String(body.code) : "";
    const message = typeof body === "object" && body !== null && "message" in body ? String(body.message) : "";
    const known: Record<string, [number, string]> = {
      member_code_taken: [409, "รหัสสมาชิกนี้ถูกใช้แล้ว กรุณาเลือกรหัสอื่น"],
      phone_taken: [409, "เบอร์โทรศัพท์นี้ลงทะเบียนแล้ว กรุณาใช้รหัสสมาชิกเดิม"],
      member_not_found: [404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง"],
      member_inactive: [403, "บัญชีสมาชิกไม่พร้อมใช้งาน กรุณาติดต่อพนักงาน"],
      reward_unavailable: [409, "รางวัลนี้ไม่พร้อมให้แลกแล้ว"],
      insufficient_points: [409, "แต้มที่ใช้ได้ไม่เพียงพอ"],
      redemption_pending: [409, "คุณมีรายการรอรับรางวัลอยู่แล้ว กรุณาติดต่อพนักงาน"],
      redemption_not_found: [404, "ไม่พบรายการแลกรางวัล"],
      redemption_not_pending: [409, "รายการนี้ถูกดำเนินการแล้ว"],
      invalid_input: [400, "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"],
      request_id_conflict: [409, "รหัสคำขอซ้ำ กรุณาโหลดใหม่ก่อนเพิ่มแต้ม"],
    };
    if (code === "P0001" && known[message]) {
      const [status, safeMessage] = known[message];
      throw new LoyaltyError(status, safeMessage);
    }
    if (code === "23505") throw new LoyaltyError(409, "ข้อมูลสมาชิกซ้ำ กรุณาตรวจสอบรหัสและเบอร์โทรศัพท์");
    throw new LoyaltyError(503, "ฐานข้อมูลยังไม่พร้อมใช้งาน กรุณาแจ้งผู้ดูแลให้ตรวจการเชื่อมต่อและสิทธิ์ Supabase");
  }
  return body;
}

export async function loyaltyRpc<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  if (verifiedUntil < Date.now()) {
    const info = await rpcRequest("jaguar_health", {}) as { project_ref?: string; version?: number };
    if (info?.project_ref !== PROJECT_REF || info.version !== 1) {
      throw new LoyaltyError(503, "การเชื่อมต่อฐานข้อมูลไม่ตรงกับโครงการ Jaguar House");
    }
    verifiedUntil = Date.now() + 60_000;
  }
  return await rpcRequest(name, data) as T;
}
