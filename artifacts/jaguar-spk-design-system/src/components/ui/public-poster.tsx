import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function PublicPoster() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/register`;
  return (
    <section className="panel public-poster print-poster" aria-labelledby="poster-title">
      <div className="public-poster__top">
        <div className="public-poster__qr">
          {origin ? <QRCodeSVG value={url} size={150} level="M" aria-label="QR สำหรับเปิดหน้าสมัครสมาชิก" /> : <span className="public-poster__qr-placeholder" aria-hidden="true" />}
        </div>
        <div className="public-poster__intro">
          <p className="ds-eyebrow">JAGUAR SPK</p>
          <h2 id="poster-title">สมัครสมาชิกที่นี่</h2>
          <p>สแกนเพื่อเปิดหน้าสมัครสมาชิก หรือเข้าสู่ระบบด้วยรหัสสมาชิก</p>
        </div>
      </div>
      <div className="public-poster__rule" />
      <ol>
        <li>เปิดหน้าสมัครสมาชิก</li>
        <li>ตั้งรหัสส่วนตัวและกรอกเบอร์มือถือ</li>
        <li>แสดงบัตรที่เคาน์เตอร์ทุกครั้งที่ซื้อ</li>
      </ol>
      <p className="public-poster__url">{url}</p>
      <button className="btn btn-ghost public-poster__print" type="button" onClick={() => window.print()}>พิมพ์ป้าย QR</button>
    </section>
  );
}
