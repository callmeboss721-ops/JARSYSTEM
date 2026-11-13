import { useState } from "react";
import { CollectingTrack, type MemberClub } from "../../components/ui/membership-cards";

export function CollectingTrackDemo() {
  const [cannabis, setCannabis] = useState(7);
  const [kratom, setKratom] = useState(4);
  const [message, setMessage] = useState("แต้มในตัวอย่างแก้ไขได้เฉพาะในหน้านี้");
  const cards: Array<{ kind: MemberClub; label: string; value: number; setValue: (value: number) => void }> = [
    { kind: "cannabis", label: "บัตรกัญชา", value: cannabis, setValue: setCannabis },
    { kind: "kratom", label: "บัตรกระท่อม", value: kratom, setValue: setKratom },
  ];
  return (
    <div className="ds-demo-stack">
      <div className="ds-v3-track-demo-grid">
        {cards.map(({ kind, label, value, setValue }) => (
          <section className="ds-glass ds-v3-track-demo-card" key={kind} aria-label={`${label} ตัวอย่าง`}>
            <CollectingTrack balance={value} kind={kind} variant="v3" />
            <div className="ds-v3-demo-buttons">
              {value < 10
                ? <button type="button" onClick={() => setValue(Math.min(10, value + 1))}>สะสม +1</button>
                : <button type="button" onClick={() => setMessage(`ตัวอย่างแลกรางวัล ${label} สำเร็จ`)}>แลกของแถม</button>}
              <button type="button" onClick={() => { setValue(0); setMessage("รีเซ็ตตัวอย่างแต้มแล้ว"); }}>รีเซ็ต</button>
            </div>
            <p className="ds-v3-muted" role="status" aria-live="polite">{message}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
