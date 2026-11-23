import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { Response } from "express";
import { LoyaltyError } from "./loyalty-errors";

const SIDECAR = "http://127.0.0.1:1106/object-storage/signed-object-url";
export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SALE_SLIP_BYTES = 8 * 1024 * 1024;
const OBJECT_PATH = /^\/objects\/uploads\/[0-9a-f-]{36}$/i;
const MAX_SIGNED_URL_TTL_MS = 15 * 60_000;

function objectLocation(objectPath: string) {
  if (!OBJECT_PATH.test(objectPath)) throw new LoyaltyError(400, "ไฟล์แนบไม่ถูกต้อง");
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  if (!privateDir) throw new LoyaltyError(503, "พื้นที่เก็บไฟล์ยังไม่พร้อมใช้งาน");
  const parts = privateDir.split("/").filter(Boolean);
  const bucketName = parts.shift();
  if (!bucketName) throw new LoyaltyError(503, "พื้นที่เก็บไฟล์ยังไม่พร้อมใช้งาน");
  const entityName = objectPath.slice("/objects/".length);
  return { bucketName, objectName: [...parts, entityName].filter(Boolean).join("/") };
}

async function signedUrl(objectPath: string, method: "PUT" | "HEAD" | "GET", ttlMs: number): Promise<string> {
  const { bucketName, objectName } = objectLocation(objectPath);
  let response: globalThis.Response;
  try {
    response = await fetch(SIDECAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + Math.min(ttlMs, MAX_SIGNED_URL_TTL_MS)).toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new LoyaltyError(503, "เชื่อมต่อพื้นที่เก็บไฟล์ไม่ได้ กรุณาลองใหม่");
  }
  if (!response.ok) throw new LoyaltyError(503, "สร้างลิงก์ไฟล์ไม่สำเร็จ กรุณาลองใหม่");
  const data = await response.json().catch(() => null) as { signed_url?: unknown } | null;
  if (typeof data?.signed_url !== "string") throw new LoyaltyError(503, "พื้นที่เก็บไฟล์ตอบกลับไม่ถูกต้อง");
  let parsed: URL;
  try {
    parsed = new URL(data.signed_url);
  } catch {
    throw new LoyaltyError(503, "พื้นที่เก็บไฟล์ตอบกลับไม่ถูกต้อง");
  }
  if (parsed.protocol !== "https:" || (parsed.hostname !== "storage.googleapis.com" && !parsed.hostname.endsWith(".storage.googleapis.com"))) {
    throw new LoyaltyError(503, "พื้นที่เก็บไฟล์ตอบกลับไม่ถูกต้อง");
  }
  return parsed.toString();
}

export async function createPrivateUploadUrl(): Promise<{ upload_url: string; object_path: string }> {
  const objectPath = `/objects/uploads/${randomUUID()}`;
  return { upload_url: await signedUrl(objectPath, "PUT", MAX_SIGNED_URL_TTL_MS), object_path: objectPath };
}

export async function assertPrivateImage(objectPath: string, maxBytes: number): Promise<void> {
  const url = await signedUrl(objectPath, "HEAD", 60_000);
  let response: globalThis.Response;
  try {
    response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new LoyaltyError(400, "อัปโหลดภาพไม่สำเร็จ กรุณาแนบไฟล์ใหม่");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const size = Number(response.headers.get("content-length"));
  if (!response.ok || !contentType || !IMAGE_TYPES.has(contentType) ||
      !Number.isSafeInteger(size) || size < 1 || size > maxBytes) {
    throw new LoyaltyError(400, "ชนิดหรือขนาดไฟล์แนบไม่ถูกต้อง");
  }
}

export async function streamPrivateImage(objectPath: string, res: Response): Promise<void> {
  const url = await signedUrl(objectPath, "GET", 60_000);
  let response: globalThis.Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new LoyaltyError(503, "อ่านไฟล์แนบไม่สำเร็จ กรุณาลองใหม่");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const size = Number(response.headers.get("content-length"));
  if (!response.ok || !response.body || !contentType || !IMAGE_TYPES.has(contentType) ||
      !Number.isSafeInteger(size) || size < 1 || size > MAX_SALE_SLIP_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new LoyaltyError(404, "ไม่พบไฟล์แนบ");
  }
  res.status(200);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(size));
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const stream = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream<Uint8Array>);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}
