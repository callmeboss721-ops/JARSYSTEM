import {
  BRAND_V4_ICON_NAMES,
  BrandV4Icon,
  type BrandV4IconName,
} from "../../components/ui/brand-v4-icon";

const LABELS: Record<BrandV4IconName, string> = {
  "crown-vip": "มงกุฎ VIP",
  "kratom-bottle": "ขวดสินค้า",
  "kratom-leaf": "ใบกระท่อม",
  "cannabis-pass": "บัตรกัญชา",
  "qr-scan": "สแกน QR",
  "stamp-coin": "เหรียญสะสมแต้ม",
  "reward-gift": "ของรางวัล",
  "pos-counter": "เคาน์เตอร์",
  "bank-transfer": "บัญชีและโอนเงิน",
  "delivery-24h": "เปิด 24 ชั่วโมง",
  "map-pin-spk": "ตำแหน่งร้าน",
  "shield-pin": "ป้องกัน PIN",
  "member-card": "บัตรสมาชิก",
  "line-chat": "LINE OA",
  "spark-bonus": "โบนัสแต้ม",
  "rank-shield": "ระดับสมาชิก",
};

const ASSET_BASE = "/jaguar-spk-design-system/brand/v4";

export function BrandV4IconsDemo() {
  return (
    <div className="ds-demo-stack">
      <div className="brand-v4-icon-grid">
        {BRAND_V4_ICON_NAMES.map((name) => (
          <article className="brand-v4-icon-card ds-glass" key={name}>
            <div className="brand-v4-icon-card__variants">
              <BrandV4Icon name={name} variant="duotone" size={38} assetBase={ASSET_BASE} />
              <BrandV4Icon name={name} variant="mono" size={30} assetBase={ASSET_BASE} />
            </div>
            <strong>{LABELS[name]}</strong>
            <small>{name}</small>
          </article>
        ))}
      </div>
      <p className="ds-demo-feedback">ไอคอนจาก Brand ID 2026 v4 · SVG ต้นฉบับไม่ครอปหรือวาดทับ</p>
    </div>
  );
}
