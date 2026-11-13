import { BrandIcon } from "../../components/ui/brand-icon";
import { IconCatalog } from "../../components/ui/icon-catalog";

export function BrandIconDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-v3-demo-panel"><IconCatalog /></section>
      <section className="ds-glass ds-icon-tones">
        <span className="ds-type-label">SEMANTIC TONES</span>
        <div>{(["neutral", "gold", "emerald", "danger"] as const).map((tone) => <span key={tone}><BrandIcon name="points" size={24} tone={tone} /><code>{tone}</code></span>)}</div>
      </section>
    </div>
  );
}
