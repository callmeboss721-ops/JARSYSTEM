import { useState } from "react";
import { PinPad } from "../../components/ui/pin-pad";

export function PinPadDemo() {
  const [greenPin, setGreenPin] = useState("");
  const [goldPin, setGoldPin] = useState("");
  return (
    <div className="ds-pin-grid">
      <section className="ds-pin-sample ds-glass">
        <span className="ds-type-label">STAFF · GREEN · LIMIT 6</span>
        <p className="ds-pin-count">{greenPin.length} / 6 หลัก</p>
        <PinPad value={greenPin} onChange={setGreenPin} max={6} tone="green" label="ตัวอย่างแป้น PIN สีเขียว" />
      </section>
      <section className="ds-pin-sample ds-glass">
        <span className="ds-type-label">OWNER · GOLD · LIMIT 8</span>
        <p className="ds-pin-count">{goldPin.length} / 8 หลัก</p>
        <PinPad value={goldPin} onChange={setGoldPin} max={8} tone="gold" label="ตัวอย่างแป้น PIN สีทอง" />
      </section>
    </div>
  );
}
