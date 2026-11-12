import { ArrowRight, Check, Gift, Search } from "lucide-react";
import { Button } from "../../components/ui/button";

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

export function PrimaryButtonDemo() {
  return (
    <div className="ds-demo-stack">
      <section className="ds-glass ds-button-sample">
        <span className="ds-type-label">VARIANTS · SOURCE API</span>
        <div className="ds-button-grid">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} className="capitalize">{variant}</Button>
          ))}
        </div>
      </section>
      <section className="ds-glass ds-button-sample">
        <span className="ds-type-label">SIZES · ICONS · SLOT COMPOSITION</span>
        <div className="ds-button-row">
          <Button size="sm" variant="outline"><Search aria-hidden="true" /> เล็ก</Button>
          <Button size="default"><Gift aria-hidden="true" /> แลกรางวัล</Button>
          <Button size="lg" variant="secondary">ดำเนินการต่อ <ArrowRight aria-hidden="true" /></Button>
          <Button size="icon" variant="outline" aria-label="ยืนยัน"><Check aria-hidden="true" /></Button>
          <Button asChild variant="link"><a href="#button-demo">แสดงตัวอย่างลิงก์</a></Button>
          <Button disabled>ปิดใช้งาน</Button>
        </div>
      </section>
    </div>
  );
}
