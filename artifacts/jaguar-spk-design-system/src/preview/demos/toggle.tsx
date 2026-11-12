import { useState } from "react";
import { Leaf, QrCode, Star } from "lucide-react";
import { Toggle } from "../../components/ui/toggle";

export function ToggleDemo() {
  const [pressed, setPressed] = useState(true);
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-toggle-sample">
        <span className="ds-type-label">PRESSED STATE · CONTROLLED</span>
        <Toggle aria-label="เปิดใช้แต้มสะสม" pressed={pressed} onPressedChange={setPressed} variant="outline" className="ds-toggle-main">
          <Leaf aria-hidden="true" />
          <span>{pressed ? "เปิดสะสมแต้ม" : "ปิดสะสมแต้ม"}</span>
        </Toggle>
        <p className="ds-demo-feedback" aria-live="polite">สถานะ: {pressed ? "เปิด" : "ปิด"}</p>
      </section>
      <section className="ds-glass ds-toggle-sample">
        <span className="ds-type-label">SIZE · VARIANT · DISABLED</span>
        <div className="ds-button-row">
          <Toggle aria-label="บัตร QR" variant="outline" size="sm"><QrCode aria-hidden="true" /> QR</Toggle>
          <Toggle aria-label="รายการโปรด" defaultPressed><Star aria-hidden="true" /> บันทึก</Toggle>
          <Toggle aria-label="ตัวอย่างปิดใช้งาน" disabled><Leaf aria-hidden="true" /> ปิดใช้งาน</Toggle>
        </div>
      </section>
    </div>
  );
}
