import "./_group.css";
import { LoyaltyCard } from "./_shared/loyalty-card";

const sampleCard = { balance: 6, member_code: "SAMPLE-01", status: "active" as const };

export function Refined() {
  return (
    <main className="mockup-surface mockup-card--refined">
      <p className="mockup-caption">REFINED CARD · PREVIEW DATA ONLY</p>
      <LoyaltyCard card={sampleCard} qr={{ value: "PREVIEW-ONLY", loading: false }} />
    </main>
  );
}
