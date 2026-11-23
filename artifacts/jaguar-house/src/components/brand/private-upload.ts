import type { PrivateUploadRequestPurpose } from "@workspace/api-client-react";
import { api, json } from "./loyalty-api";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE: Record<PrivateUploadRequestPurpose, number> = {
  product_image: 5 * 1024 * 1024,
  sale_slip: 8 * 1024 * 1024,
};

export async function uploadPrivateImage(file: File, purpose: PrivateUploadRequestPurpose): Promise<string> {
  if (!IMAGE_TYPES.has(file.type) || file.size < 1 || file.size > MAX_SIZE[purpose]) {
    throw new Error(purpose === "product_image"
      ? "เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB"
      : "เลือกภาพสลิป JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB");
  }
  const upload = await api<{ upload_url: string; object_path: string }>("/api/loyalty/uploads/request-url", json("POST", {
    purpose,
    size: file.size,
    content_type: file.type,
  }));
  let response: Response;
  try {
    response = await fetch(upload.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new Error("อัปโหลดไฟล์ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่");
  }
  if (!response.ok) throw new Error("อัปโหลดไฟล์ไม่สำเร็จ กรุณาเลือกไฟล์แล้วลองใหม่");
  return upload.object_path;
}
