"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export function PublicPoster() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/register`;
  return <section className="panel p-5 sm:p-7 max-w-xl print-poster" aria-labelledby="poster-title">
    <div className="flex flex-wrap gap-5 items-center">
      <div className="rounded-xl bg-white p-3"><QRCodeSVG value={url} size={150} level="M" /></div>
      <div className="min-w-0 flex-1"><p className="eyebrow">Jaguar Kratom</p><h2 id="poster-title" className="font-display text-2xl font-semibold mt-1">สมัครสมาชิกที่นี่</h2>
        <p className="text-sm text-[var(--muted)] mt-2">สแกนเพื่อเปิดหน้าสมัครสมาชิก หรือเข้าสู่ระบบด้วยรหัสสมาชิก</p>
      </div>
    </div>
    <div className="hairline my-5" /><ol className="list-decimal pl-5 text-sm space-y-1 text-[var(--silver)]"><li>เปิดหน้าสมัครสมาชิก</li><li>ตั้งรหัสส่วนตัวและกรอกเบอร์มือถือ</li><li>แสดงบัตรที่เคาน์เตอร์ทุกครั้งที่ซื้อ</li></ol>
    <p className="mt-4 text-xs text-[var(--muted)] break-all">{url}</p>
    <button className="btn btn-ghost mt-5 print:hidden" onClick={() => window.print()}>พิมพ์ป้าย QR</button>
  </section>;
}
