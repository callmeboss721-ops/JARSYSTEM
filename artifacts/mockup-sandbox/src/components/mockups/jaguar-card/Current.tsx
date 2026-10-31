import "./_group.css";
import { LoyaltyCard } from "./_shared/loyalty-card";

const sampleCard = { balance: 6, member_code: "SAMPLE-01", status: "active" as const };

export function Current() {
  return (
    <main className="mockup-surface">
      <p className="mockup-caption">CURRENT CARD · PREVIEW DATA ONLY</p>
      <LoyaltyCard card={sampleCard} qr={{ value: "PREVIEW-ONLY", loading: false }} />
    </main>
  );
}
