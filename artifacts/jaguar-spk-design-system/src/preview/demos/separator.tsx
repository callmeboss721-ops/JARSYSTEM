import { Separator } from "../../components/ui/separator";

export function SeparatorDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-separator-sample">
        <span className="ds-type-label">HORIZONTAL · DECORATIVE</span>
        <div className="ds-separator-copy"><span>ข้อมูลสมาชิก</span><span className="ds-secondary-copy">JAGUAR SPK</span></div>
        <Separator />
        <div className="ds-separator-copy"><span>คะแนนสะสม</span><strong>06 / 10</strong></div>
      </section>
      <section className="ds-glass ds-separator-sample">
        <span className="ds-type-label">VERTICAL · SEMANTIC</span>
        <div className="ds-separator-inline">
          <span>บัตรกระท่อม</span>
          <Separator orientation="vertical" decorative={false} aria-label="แบ่งหมวดบัตร" />
          <span>บัตรกัญชา</span>
          <Separator orientation="vertical" decorative />
          <span>รางวัล</span>
        </div>
      </section>
    </div>
  );
}
