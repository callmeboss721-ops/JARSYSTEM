import { BrandIcon, type BrandIconName } from "../../components/ui/brand-icon";

const names: BrandIconName[] = [
  "members", "memberSearch", "cannabis", "leaf", "sprout", "lightning", "points", "progress",
  "rewards", "redeem", "dashboard", "addPoints", "history", "settings", "search", "logout",
  "location", "continue", "security", "banking", "error", "retry", "success", "pending",
  "staffAccess", "confirm", "add", "subtract", "close", "qr", "crown",
];

const tones = ["neutral", "gold", "emerald", "danger"] as const;

export function BrandIconDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-icon-catalog ds-glass">
        {names.map((name) => (
          <div className="ds-icon-catalog__item" key={name}>
            <BrandIcon name={name} size={21} tone={name === "error" ? "danger" : name === "crown" ? "gold" : "neutral"} />
            <code>{name}</code>
          </div>
        ))}
      </section>
      <section className="ds-glass ds-icon-tones">
        <span className="ds-type-label">SEMANTIC TONES</span>
        <div>{tones.map((tone) => <span key={tone}><BrandIcon name="points" size={24} tone={tone} /><code>{tone}</code></span>)}</div>
      </section>
    </div>
  );
}
