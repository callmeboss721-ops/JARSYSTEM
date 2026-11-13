import Image from "next/image";
import { BrandIcon } from "./brand-icon";

const LINE_OA_URL = "https://line.me/R/ti/p/@880beqva";

export function LineOaContact({ placement }: { placement: "landing" | "member" }) {
  return (
    <section
      className={`line-oa-contact line-oa-contact--${placement}`}
      aria-label="ติดต่อ JAGUAR SPK ผ่าน LINE"
      data-testid={`line-oa-contact-${placement}`}
    >
      <a
        className="line-oa-contact__qr-link"
        href={LINE_OA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="เปิด LINE OA จาก QR Code"
      >
        <Image
          src="/brand/line-oa-qr.png"
          alt="QR Code สำหรับเพิ่มเพื่อน LINE OA @880beqva"
          width={540}
          height={540}
          sizes={placement === "landing" ? "72px" : "84px"}
        />
      </a>
      <div className="line-oa-contact__copy">
        <span className="line-oa-contact__eyebrow">LINE OFFICIAL</span>
        <strong>@880beqva</strong>
        <a
          className="line-oa-contact__action"
          href={LINE_OA_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`link-line-oa-${placement}`}
        >
          แชตร้านใน LINE
          <BrandIcon name="continue" size={15} tone="emerald" />
        </a>
      </div>
    </section>
  );
}
