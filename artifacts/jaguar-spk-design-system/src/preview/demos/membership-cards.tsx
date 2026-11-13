import { useState } from "react";
import { MemberCardFaces, MemberStatusPanel, type MemberClub } from "../../components/ui/membership-cards";

export function MembershipCardsDemo() {
  const [kind, setKind] = useState<MemberClub>("kratom");
  const [balance, setBalance] = useState(6);
  const [qrState, setQrState] = useState<"ready" | "loading" | "error">("ready");
  const [retrying, setRetrying] = useState(false);
  const retryQr = () => {
    setRetrying(true);
    setQrState("loading");
    window.setTimeout(() => {
      setRetrying(false);
      setQrState("ready");
    }, 500);
  };
  const qr = {
    value: qrState === "ready" ? "JAGUAR-DEMO-06" : undefined,
    loading: qrState === "loading",
    error: qrState === "error" ? "QR preview error" : undefined,
    retry: retryQr,
    retrying,
  };
  return (
    <div className="ds-demo-stack">
      <div className="ds-demo-controls" role="group" aria-label="ตัวเลือกตัวอย่างบัตร">
        <button type="button" aria-pressed={kind === "kratom"} onClick={() => setKind("kratom")}>กระท่อม</button>
        <button type="button" aria-pressed={kind === "cannabis"} onClick={() => setKind("cannabis")}>กัญชา</button>
        <label>แต้ม <input type="range" min="0" max="10" value={balance} onChange={(event) => setBalance(Number(event.target.value))} /> {balance}/10</label>
        <button type="button" aria-pressed={qrState === "ready"} onClick={() => { setQrState("ready"); setRetrying(false); }}>QR พร้อม</button>
        <button type="button" aria-pressed={qrState === "loading"} onClick={() => { setQrState("loading"); setRetrying(false); }}>QR โหลด</button>
        <button type="button" aria-pressed={qrState === "error"} onClick={() => { setQrState("error"); setRetrying(false); }}>QR ผิดพลาด</button>
      </div>
      <div className="ds-card-example">
        <MemberCardFaces kind={kind} memberCode="JAGUAR06" balance={balance} />
        <MemberStatusPanel kind={kind} memberCode="JAGUAR06" balance={balance} qr={qr} />
      </div>
      <p className="ds-demo-feedback">ตัวอย่างเท่านั้น · ทดลองปุ่มขยาย QR และสถานะโหลด/ผิดพลาดได้ · ระบบจริงส่งยอดแต้มและ QR จาก API</p>
    </div>
  );
}
