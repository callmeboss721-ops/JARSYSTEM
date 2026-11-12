import { JaguarMark, PawGlyph } from "../../components/ui/jaguar-mark";

export function JaguarMarkDemo() {
  return (
    <div className="ds-demo-grid">
      <section className="ds-logo-showcase ds-glass">
        <span className="ds-type-label">PRIMARY EMBLEM · WHOLE / UNCROPPED</span>
        <img src={`${import.meta.env.BASE_URL}brand/logos/logo-primary.webp`} alt="JAGUAR SPK" />
      </section>
      <section className="ds-logo-showcase ds-glass">
        <span className="ds-type-label">WORDMARK · LANDSCAPE</span>
        <img className="ds-logo-wordmark" src={`${import.meta.env.BASE_URL}brand/logos/logo-wordmark.webp`} alt="JAGUAR SPK" />
      </section>
      <section className="ds-logo-showcase ds-glass">
        <span className="ds-type-label">COMPACT SIZES</span>
        <div className="ds-logo-sizes"><JaguarMark size={36} title="JAGUAR SPK" /><JaguarMark size={56} title="JAGUAR SPK" /><JaguarMark size={88} title="JAGUAR SPK" /></div>
      </section>
      <section className="ds-logo-showcase ds-glass">
        <span className="ds-type-label">SMALL STAMP ACCENT</span>
        <span className="ds-paw"><PawGlyph size={30} /></span>
      </section>
    </div>
  );
}
