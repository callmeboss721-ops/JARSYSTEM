import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export function FormControlsDemo() {
  const [note, setNote] = useState("");
  return (
    <div className="ds-control-grid">
      <form className="ds-glass ds-form-sample" onSubmit={(event) => event.preventDefault()}>
        <span className="ds-type-label">DEFAULT · MOBILE TYPE SIZE 16PX</span>
        <div className="ds-field-sample">
          <Label htmlFor="ds-phone">เบอร์โทรศัพท์ <span aria-hidden="true">*</span></Label>
          <Input id="ds-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" />
        </div>
        <div className="ds-field-sample">
          <Label htmlFor="ds-note">หมายเหตุ</Label>
          <Textarea id="ds-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="เพิ่มรายละเอียด (ไม่บังคับ)" />
        </div>
        <label className="ds-field-check"><Input type="checkbox" /> ยอมรับเงื่อนไขการใช้งาน</label>
      </form>
      <form className="ds-glass ds-form-sample" onSubmit={(event) => event.preventDefault()}>
        <span className="ds-type-label">DISABLED · REQUIRED · INVALID</span>
        <div className="ds-field-sample">
          <Label htmlFor="ds-member-code">รหัสสมาชิก</Label>
          <Input id="ds-member-code" defaultValue="JAGUAR-001" disabled />
        </div>
        <div className="ds-field-sample">
          <Label htmlFor="ds-invalid">ชื่อเล่น <span aria-hidden="true">*</span></Label>
          <Input id="ds-invalid" aria-invalid="true" aria-describedby="ds-invalid-help" required placeholder="กรอกชื่อเล่น" />
          <span id="ds-invalid-help" className="ds-field-error">กรุณากรอกข้อมูลให้ครบ</span>
        </div>
      </form>
    </div>
  );
}
