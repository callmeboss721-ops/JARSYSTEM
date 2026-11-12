import { useState } from "react";
import { BrandButton, type BrandButtonArt } from "../../components/ui/brand-button";

const variants: Array<{ art: BrandButtonArt; label: string }> = [
  { art: "btn-jaguar", label: "เปิดบัตรสมาชิก" },
  { art: "btn-leaf", label: "เข้าใช้งาน" },
  { art: "btn-leaf-cannabis", label: "แสดง QR" },
  { art: "btn-crown", label: "แลกของแถม" },
  { art: "btn-frame", label: "อีก 3 แต้ม" },
];

export function BrandButtonDemo() {
  const [activated, setActivated] = useState(false);
  return (
    <div className="ds-demo-stack">
      <div className="ds-demo-grid">
        {variants.map((item) => (
          <div className="ds-demo-tile ds-glass" key={item.art}>
            <span className="ds-type-label">{item.art}</span>
            <BrandButton asset={item.art} label={item.label} onClick={() => setActivated(true)} disabled={item.art === "btn-frame"} />
          </div>
        ))}
      </div>
      <div className="ds-demo-link ds-glass">
        <span className="ds-type-label">ANCHOR / NAVIGATION STATE</span>
        <BrandButton asset="btn-leaf" label="กลับภาพรวม" href={import.meta.env.BASE_URL} />
      </div>
      <p className="ds-demo-feedback" role="status">{activated ? "ปุ่มทำงานแล้ว" : "ปุ่มที่เปิดใช้งานจะตอบสนองเมื่อกด"}</p>
    </div>
  );
}
