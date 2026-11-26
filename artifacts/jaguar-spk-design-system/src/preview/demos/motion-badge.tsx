import { MotionBadge, type BrandV4MotionName } from "../../components/ui/motion-badge";

const MOTIONS: Array<{ name: BrandV4MotionName; title: string; use: string }> = [
  { name: "stamp-pulse", title: "Stamp pulse", use: "ฉลองการเพิ่มแต้มบนบัตรสมาชิก" },
  { name: "qr-scanner-sweep", title: "QR scanner sweep", use: "เครื่องมือสแกนที่เคาน์เตอร์" },
  { name: "vip-crown-shimmer", title: "VIP crown shimmer", use: "ระดับ Gold และ Black VIP" },
  { name: "open-24h-beacon", title: "Open 24 hours", use: "ตัวบอกเวลาเปิดร้าน" },
];

const ASSET_BASE = "/jaguar-spk-design-system/brand/v4";

export function MotionBadgeDemo() {
  return (
    <div className="ds-demo-stack">
      <div className="motion-badge-grid">
        {MOTIONS.map((motion) => (
          <article className="motion-badge-card ds-glass" key={motion.name}>
            <MotionBadge name={motion.name} size={72} assetBase={ASSET_BASE} />
            <div>
              <h3>{motion.title}</h3>
              <p>{motion.use}</p>
              <small>{motion.name}</small>
            </div>
          </article>
        ))}
      </div>
      <p className="ds-demo-feedback">เล่นแบบวนเงียบและ inline; ใช้ PNG เมื่อปิด motion หรือเบราว์เซอร์ไม่รองรับ WebM</p>
    </div>
  );
}
