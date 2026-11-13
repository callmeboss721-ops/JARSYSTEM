import { BrandButton } from "../components/ui/brand-button";
import { BrandIcon } from "../components/ui/brand-icon";
import { JaguarMark } from "../components/ui/jaguar-mark";
import { CollectingTrack, MemberCardFaces } from "../components/ui/membership-cards";
import { RankShield } from "../components/ui/rank-emblems";
import { Guidelines } from "./parts";

const CORE = [
  { name: "Primary · Neon Green", value: "#00FF9D", role: "ปุ่มและการกระทำหลัก" },
  { name: "Secondary · Gold", value: "#D4AF37", role: "การกระทำรองและจุดเน้น" },
  { name: "Emphasis · Gold 2", value: "#E5C04A", role: "เน้นข้อมูลและลำดับสมาชิก" },
];

const SUPPORT = [
  { name: "Canvas", value: "#050505" },
  { name: "Surface", value: "#0D140F" },
  { name: "Text", value: "#F9F6E7" },
  { name: "Muted", value: "#C6C8BE" },
  { name: "Border", value: "#16211A" },
];

function Swatch({ name, value, role }: { name: string; value: string; role?: string }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch__color" style={{ background: value }} />
      <div><strong>{name}</strong><code>{value}</code>{role && <small>{role}</small>}</div>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="ds-foundations">
      <section className="ds-overview-brand ds-glass">
        <div className="ds-overview-brand__mark"><JaguarMark size={88} title="JAGUAR SPK" /></div>
        <div>
          <p className="ds-eyebrow">V3 SOURCE REFERENCE · JAGUAR SPK DRINK</p>
          <h2>ดำ · เขียวนีออน · ทอง</h2>
          <p>ระบบดีไซน์ภาษาไทยเป็นหลัก ใช้เขียวกับการกระทำหลัก ทองกับการกระทำรอง และคงตรา JAGUAR ต้นฉบับไว้โดยไม่แก้ไข</p>
        </div>
      </section>

      <figure className="ds-v3-promo-art ds-glass">
        <img
          src={`${import.meta.env.BASE_URL}brand/jaguar-member-guide-v3.webp`}
          alt="โปสเตอร์ JAGUAR MEMBER แนะนำสมัครสมาชิก สะสมแต้ม และแลกรางวัล"
          loading="lazy"
          decoding="async"
        />
        <figcaption className="sr-only">ภาพประชาสัมพันธ์สมาชิก JAGUAR SPK ฉบับที่ผู้ใช้ส่งมา</figcaption>
      </figure>

      <section className="ds-section">
        <div className="ds-section__heading"><span className="ds-eyebrow">01 / V3 FOUNDATIONS</span><h2>สีหลัก</h2></div>
        <div className="ds-swatch-grid ds-swatch-grid--core">{CORE.map((item) => <Swatch key={item.name} {...item} />)}</div>
        <div className="ds-swatch-grid">{SUPPORT.map((item) => <Swatch key={item.name} {...item} />)}</div>
        <Guidelines items={[
          { kind: "do", text: "ใช้เขียวนีออนกับปุ่มหลัก ใช้ทองกับการกระทำรองและจุดเน้น" },
          { kind: "dont", text: "อย่าใช้แสงเรืองแทนความต่างระดับสีหรือข้อความสถานะที่ชัดเจน" },
        ]} />
      </section>

      <section className="ds-section">
        <div className="ds-section__heading"><span className="ds-eyebrow">02 / V3 INTERACTIONS</span><h2>ตัวอย่างสมาชิกแบบโต้ตอบ</h2></div>
        <div className="ds-v3-overview-grid">
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">COLLECTING TRACK · LOCAL DEMO</span>
            <CollectingTrack kind="kratom" balance={6} variant="v3" />
            <p>สิบช่อง · สถานะพร้อมแลกเมื่อครบ</p>
          </article>
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">10 RANK EMBLEMS</span>
            <div className="ds-rank-row">{(["royal-king", "leopard-vip", "nature-green"] as const).map((name) => <RankShield key={name} name={name} size={48} />)}</div>
            <p>ตราและชื่อระดับเท่านั้น · ไม่แสดงสิทธิประโยชน์</p>
          </article>
        </div>
        <p className="ds-demo-feedback">Icon catalog, action controls และ mobile tab bar มีหน้าแสดงผลแยกในแถบเมนู · ตัวอย่างไม่เรียก API</p>
      </section>

      <section className="ds-section">
        <div className="ds-section__heading"><span className="ds-eyebrow">03 / TYPE</span><h2>ตัวอักษรไทย</h2></div>
        <div className="ds-type-samples ds-glass">
          <div><span className="ds-type-label">DISPLAY · BAI JAMJUREE</span><p className="font-display ds-type-display">พลังใบ ซุปเปอร์ฮีโร่ของคนไทย</p></div>
          <div><span className="ds-type-label">BODY · IBM PLEX SANS THAI</span><p>สมาชิกสะสมแต้มได้ทุกครั้งที่แวะมา แล้วเก็บสิทธิ์ไว้ในบัตรสมาชิกบนมือถือ</p></div>
          <div><span className="ds-type-label">CODE · JETBRAINS MONO</span><code className="ds-mono-sample">@JAGUAR-06 · 08/10</code></div>
        </div>
        <Guidelines items={[
          { kind: "do", text: "ใช้ IBM Plex Sans Thai กับเนื้อหา, Bai Jamjuree กับหัวข้อ และ JetBrains Mono กับรหัส/ตัวเลข" },
          { kind: "do", text: "เปิดระยะบรรทัดและปล่อยให้ข้อความไทยตัดบรรทัดตามธรรมชาติ" },
        ]} />
      </section>

      <section className="ds-section">
        <div className="ds-section__heading"><span className="ds-eyebrow">04 / COMPONENTS</span><h2>องค์ประกอบพื้นฐาน</h2></div>
        <div className="ds-pilot-grid">
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">ORIGINAL BRAND MARK</span>
            <JaguarMark size={126} title="JAGUAR SPK" />
            <p>ตราต้นฉบับ · แสดงครบ ไม่ครอป</p>
          </article>
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">BRAND ICON TONES</span>
            <div className="ds-icon-row"><BrandIcon name="redeem" size={24} tone="gold" /><BrandIcon name="sprout" size={24} tone="emerald" /><BrandIcon name="success" size={24} tone="neutral" /><BrandIcon name="error" size={24} tone="danger" /></div>
            <p>Glass icons · ความหมายและสีสถานะชัดเจน</p>
          </article>
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">BRAND ACTION</span>
            <BrandButton asset="btn-jaguar" label="เปิดบัตรสมาชิก" />
            <p>ภาพปุ่มจริง · ป้ายสั้น · โฟกัสคีย์บอร์ด</p>
          </article>
          <article className="ds-component-sample ds-glass">
            <span className="ds-type-label">MEMBER RANK</span>
            <div className="ds-rank-row">
              {(["cyber-start", "royal-king", "leopard-vip"] as const).map((name) => <RankShield key={name} name={name} size={54} />)}
            </div>
            <p>ตราระดับจากภาพชุดที่ร้านให้มา</p>
          </article>
        </div>
        <article className="ds-card-example">
          <span className="ds-type-label">DUAL CLUB CARD · DEMO MEMBER</span>
          <MemberCardFaces kind="kratom" memberCode="JAGUAR06" balance={6} />
        </article>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="ds-foundations ds-glass ds-foundation-page">
      <section className="ds-section__heading"><span className="ds-eyebrow">V3 COLOR ROLES</span><h2>โทนสี JAGUAR SPK</h2></section>
      <div className="ds-swatch-grid ds-swatch-grid--core">{CORE.map((item) => <Swatch key={item.name} {...item} />)}</div>
      <div className="ds-swatch-grid">{SUPPORT.map((item) => <Swatch key={item.name} {...item} />)}</div>
      <Guidelines items={[
        { kind: "do", text: "ใช้โทนรองที่อ่านชัดและให้ข้อความหลักมีความต่างระดับสีเพียงพอ" },
        { kind: "do", text: "light และ dark mode ใช้ role ชุดเดียวกัน โดยแมปค่าจากโทเค็น DTCG" },
      ]} />
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="ds-foundations ds-glass ds-foundation-page">
      <div className="ds-section__heading"><span className="ds-eyebrow">TYPOGRAPHY</span><h2>ฟอนต์และลำดับข้อความ</h2></div>
      <div className="ds-type-samples">
        <div><span className="ds-type-label">DISPLAY · BAI JAMJUREE</span><p className="font-display ds-type-display">บัตรสมาชิกจากัวร์</p></div>
        <div><span className="ds-type-label">BODY · IBM PLEX SANS THAI</span><p>อ่านง่ายบนมือถือ ทั้งข้อความสั้นและข้อมูลสมาชิกที่ต้องใช้หน้าร้าน</p></div>
        <div><span className="ds-type-label">MONO · JETBRAINS MONO</span><code className="ds-mono-sample">MEMBER 08 / 10 · SOI 6</code></div>
      </div>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="ds-foundations ds-glass ds-foundation-page">
      <div className="ds-section__heading"><span className="ds-eyebrow">LAYOUT</span><h2>ระยะห่างและพื้นผิว</h2></div>
      <div className="ds-layout-grid">
        <div><strong>4px base step</strong><div className="ds-space-bars"><i style={{ width: 16 }} /><i style={{ width: 32 }} /><i style={{ width: 48 }} /><i style={{ width: 64 }} /></div></div>
        <div><strong>Radius 16–18px</strong><div className="ds-radius-samples"><i /><i /><i /></div></div>
        <div><strong>Control height</strong><p>Primary 48px · other controls 44px</p></div>
      </div>
      <Guidelines items={[
        { kind: "do", text: "ให้ปุ่มหลักสูงอย่างน้อย 48px และคอนโทรลอื่นอย่างน้อย 44px" },
        { kind: "do", text: "ลด blur บนมือถือและรักษาพื้นที่หายใจโดยไม่ทำให้ข้อมูลสำคัญเล็กลง" },
        { kind: "dont", text: "อย่าให้กรอบเรืองแสงหรือพื้นผิว glass แย่งความชัดจากข้อมูลสมาชิก" },
      ]} />
    </div>
  );
}
