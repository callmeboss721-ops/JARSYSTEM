import { RankShield, type RankEmblemName } from "../../components/ui/rank-emblems";
import { useState } from "react";

const ranks: Array<{ name: RankEmblemName; label: string }> = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
  { name: "organic-premium", label: "Organic Premium" },
  { name: "diamond-member", label: "Diamond Member" },
  { name: "cyber-start", label: "Cyber Start" },
  { name: "inferno-power", label: "Inferno Power" },
  { name: "cosmic-world", label: "Cosmic World" },
  { name: "dragon-emperor", label: "Dragon Emperor" },
  { name: "ultimate-legend", label: "Ultimate Legend" },
];

export function RankEmblemsDemo() {
  const [selected, setSelected] = useState(0);
  const current = ranks[selected];
  return (
    <div className="ds-demo-stack">
      <section className="ds-rank-grid ds-glass" role="tablist" aria-label="เลือกระดับสมาชิก">
        {ranks.map((rank, index) => (
          <button
            className={`ds-rank-card ds-v3-rank-card${selected === index ? " is-selected" : ""}`}
            id={`ds-rank-tab-${index}`}
            aria-controls="ds-rank-panel"
            role="tab"
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            type="button"
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const nextIndex = event.key === "Home" ? 0
                : event.key === "End" ? ranks.length - 1
                  : (index + (event.key === "ArrowRight" ? 1 : ranks.length - 1)) % ranks.length;
              setSelected(nextIndex);
              window.requestAnimationFrame(() => document.getElementById(`ds-rank-tab-${nextIndex}`)?.focus());
            }}
            key={rank.name}
          >
            <RankShield name={rank.name} size={60} />
            <span>{rank.label}</span>
            <small>LEVEL {10 - index}</small>
          </button>
        ))}
      </section>
      <section className="ds-glass ds-v3-rank-detail" id="ds-rank-panel" role="tabpanel" aria-labelledby={`ds-rank-tab-${selected}`}>
        <RankShield name={current.name} size={96} />
        <div><span className="ds-type-label">MEMBER RANK · LEVEL {10 - selected}</span><h2>{current.label}</h2><p>ตราสมาชิก {current.label} · แสดงชื่อและงานภาพเท่านั้น ไม่มีการแสดงสิทธิประโยชน์หรือเกณฑ์ระดับ</p></div>
      </section>
      <p className="ds-demo-feedback">ตัวเลือกนี้เป็น local demo เท่านั้น · ชื่อและลำดับอ้างอิงชุดตราที่มีอยู่</p>
    </div>
  );
}
