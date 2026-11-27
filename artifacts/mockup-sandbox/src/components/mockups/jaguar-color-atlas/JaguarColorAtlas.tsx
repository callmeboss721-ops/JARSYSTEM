import { useState, type CSSProperties } from "react";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Crown,
  Leaf,
  Palette,
  QrCode,
  Shapes,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import { tokens } from "@workspace/jaguar-spk-design-system/tokens";
import { BrandButton } from "@workspace/jaguar-spk-design-system/components/ui/brand-button";
import { CollectingTrack } from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import { RankShield } from "@workspace/jaguar-spk-design-system/components/ui/rank-emblems";
import "@workspace/jaguar-spk-design-system/styles.css";
import "./jaguarcoloratlas.css";

const navigation = ["ภาพรวม", "แบรนด์", "สี", "ตัวอักษร", "คอมโพเนนต์"];
const ranks = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
] as const;

export function JaguarColorAtlas() {
  const [activeNav, setActiveNav] = useState(navigation[0]);
  const [cardOpened, setCardOpened] = useState(false);
  const themeStyle = {
    "--ca-background": tokens.color.dark.background,
    "--ca-surface": tokens.color.dark.card,
    "--ca-raised": tokens.color.dark.popover,
    "--ca-border": tokens.color.dark.border,
    "--ca-text": tokens.color.dark.foreground,
    "--ca-muted": tokens.color.dark.mutedForeground,
    "--ca-green": tokens.color.dark.primary,
    "--ca-green-ink": tokens.color.dark.primaryForeground,
    "--ca-gold": tokens.color.dark.secondary,
    "--ca-emphasis": tokens.color.dark.accent,
    "--ca-radius": tokens.radius,
  } as CSSProperties;

  return (
    <main className="ca-shell dark" style={themeStyle}>
      <header className="ca-header">
        <div className="ca-brand">
          <JaguarMark className="ca-brand-mark" size={38} title="JAGUAR SPK" />
          <span>
            <strong>JAGUAR <i>SPK</i></strong>
            <small>DESIGN SYSTEM · V3 SOURCE</small>
          </span>
        </div>
        <nav className="ca-nav" aria-label="ตัวอย่างหมวดหมู่ดีไซน์">
          {navigation.map((item) => (
            <button
              className={activeNav === item ? "ca-nav-link is-active" : "ca-nav-link"}
              key={item}
              type="button"
              aria-current={activeNav === item ? "page" : undefined}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="ca-version"><span className="ca-live-dot" /> แสดงตัวอย่าง <b>V3</b></div>
      </header>

      <div className="ca-page">
        <section className="ca-intro" aria-labelledby="ca-title">
          <div className="ca-intro-copy">
            <div className="ca-eyebrow"><span>01 / BRAND ESSAY</span><span>JAGUAR KRATOM HOUSE</span></div>
            <p className="ca-kicker">JAGUAR SPK DRINK <BadgeCheck size={15} /></p>
            <h1 id="ca-title">สีที่มีบทบาท<br />ชัดเจนในทุก<span>จังหวะ</span></h1>
            <p className="ca-intro-lede">ดำ · เขียวนีออน · ทอง</p>
            <p className="ca-description">
              ระบบภาพภาษาไทยเป็นหลัก สำหรับแบรนด์ที่ชัดเจนและการใช้งานหน้าร้านที่อ่านง่าย
              เก็บตรา JAGUAR ให้ครบ ไม่ครอปหรือวาดทับ ใช้เขียวกับการกระทำหลัก และทองกับจุดเน้น
            </p>
          </div>
          <div className="ca-intro-mark">
            <div className="ca-mark-rings"><JaguarMark size={112} title="JAGUAR SPK" /></div>
            <span>THE ORIGINAL MARK · KEEP WHOLE</span>
            <div className="ca-mark-caption"><b>01</b><span>Brand foundation<br />Thai-first · clear · composed</span></div>
          </div>
          <div className="ca-journey">
            <div className="ca-journey-heading"><span>MEMBER JOURNEY</span><b>03 STEPS</b></div>
            <div className="ca-journey-steps">
              <div><i>01</i><b>สมัคร</b></div><span />
              <div><i>02</i><b>สะสม</b></div><span />
              <div><i>03</i><b>รับสิทธิ์</b></div>
            </div>
          </div>
          <div className="ca-intro-foot"><span>FOUNDATIONS / REUSABLE UI</span><p>หน้าแรก <ChevronRight size={13} /> <strong>{activeNav}</strong></p></div>
        </section>

        <section className="ca-color-story" aria-labelledby="ca-color-title">
          <div className="ca-section-heading">
            <div><span>02 — THE PALETTE</span><h2 id="ca-color-title">Color, with intention.</h2></div>
            <p>สามบทบาทหลัก · หนึ่งระบบที่อ่านง่าย</p>
          </div>
          <div className="ca-color-panels">
            <article className="ca-color-panel ca-primary-panel">
              <div className="ca-panel-top"><span>01 / PRIMARY</span><Sparkles size={16} /></div>
              <div className="ca-swatch ca-swatch-primary" />
              <div className="ca-role-copy"><span>Neon Green</span><b>#00FF9D</b></div>
              <p>การกระทำหลัก<br /><strong>ทำให้จังหวะสำคัญเด่นชัด</strong></p>
              <div className="ca-role-tag">หลัก <ChevronRight size={13} /> ACTION</div>
            </article>
            <article className="ca-color-panel ca-secondary-panel">
              <div className="ca-panel-top"><span>02 / SECONDARY</span><Crown size={16} /></div>
              <div className="ca-swatch ca-swatch-secondary" />
              <div className="ca-role-copy"><span>Gold</span><b>#D4AF37</b></div>
              <p>การกระทำรอง<br /><strong>ให้ความรู้สึกอบอุ่นและมั่นคง</strong></p>
              <div className="ca-role-tag">รอง <ChevronRight size={13} /> SUPPORT</div>
            </article>
            <article className="ca-color-panel ca-emphasis-panel">
              <div className="ca-panel-top"><span>03 / EMPHASIS</span><Palette size={16} /></div>
              <div className="ca-swatch ca-swatch-emphasis" />
              <div className="ca-role-copy"><span>Gold 2</span><b>#E5C04A</b></div>
              <p>ลำดับและจุดเน้น<br /><strong>นำสายตาโดยไม่แย่งบทบาทหลัก</strong></p>
              <div className="ca-role-tag">เน้น <ChevronRight size={13} /> HIGHLIGHT</div>
            </article>
          </div>
          <div className="ca-foundations">
            <span><i className="ca-dot ca-dot-canvas" />Canvas</span>
            <span><i className="ca-dot ca-dot-surface" />Surface</span>
            <span><i className="ca-dot ca-dot-text" />Text</span>
            <span><i className="ca-dot ca-dot-muted" />Muted</span>
            <p>พื้นผิวเข้มเป็นฉากหลังที่สงบ ให้สีตามบทบาทเป็นผู้เล่าเรื่อง</p>
          </div>
        </section>

        <section className="ca-overview" aria-label="ภาพรวมระบบดีไซน์">
          <div className="ca-section-heading ca-overview-heading">
            <div><span>03 — 07</span><h2>Overview, in practice</h2></div>
            <p>สี · ตัวอักษร · องค์ประกอบ</p>
          </div>
          <div className="ca-overview-grid">
            <article className="ca-card ca-type">
              <div className="ca-card-heading"><span>03 / TYPE SYSTEM</span><Type size={15} /></div>
              <div className="ca-type-sample"><span>DISPLAY · BAI JAMJUREE</span><b>บัตรสมาชิกจากัวร์</b></div>
              <div className="ca-type-sample"><span>BODY · IBM PLEX SANS THAI</span><p>สะสมแต้มได้ทุกครั้งที่แวะมา แล้วเก็บไว้บนบัตรสมาชิก</p></div>
              <div className="ca-code"><span>JETBRAINS MONO</span><b>JAGUAR-06 <i>·</i> 08/10</b></div>
            </article>

            <article className="ca-card ca-track">
              <div className="ca-card-heading"><span>04 / COLLECTING TRACK</span><small>LOCAL DEMO</small></div>
              <p className="ca-track-label">KRATOM CLUB</p>
              <CollectingTrack balance={6} kind="kratom" variant="v3" />
              <div className="ca-track-caption"><span>10 ช่อง · สถานะพร้อมแลกเมื่อครบ</span><i><b /></i></div>
            </article>

            <article className="ca-card ca-ranks">
              <div className="ca-card-heading"><span>05 / RANK EMBLEMS</span><small>10 TIERS</small></div>
              <div className="ca-rank-list">
                {ranks.map((rank, index) => (
                  <div className="ca-rank" key={rank.name}>
                    <span className={`ca-rank-mark ca-rank-mark-${index + 1}`}><RankShield name={rank.name} size={34} /></span>
                    <b>{rank.label}</b>
                  </div>
                ))}
              </div>
              <p className="ca-rank-note"><ShieldCheck size={12} /> แสดงตราและชื่อระดับเท่านั้น · ไม่มีสิทธิประโยชน์เพิ่มเติม</p>
            </article>

            <article className="ca-card ca-components">
              <div className="ca-card-heading"><span>06 / CORE COMPONENTS</span><Shapes size={15} /></div>
              <div className="ca-components-list">
                <div><Sparkles /><b>Brand Icon</b><small>ความหมายชัดเจน</small></div>
                <div><Crown /><b>Gold Accent</b><small>สถานะรอง</small></div>
                <div><QrCode /><b>QR Action</b><small>เปิดบัตรสมาชิก</small></div>
                <div><Check /><b>Success</b><small>สถานะที่อ่านชัด</small></div>
              </div>
              <BrandButton
                asset="btn-jaguar"
                assetBase="/jaguar-spk-design-system/brand/buttons/"
                label={cardOpened ? "แสดงตัวอย่างแล้ว" : "เปิดบัตรสมาชิก"}
                onClick={() => setCardOpened((opened) => !opened)}
                className="ca-brand-button"
              />
              <span className="ca-local-note">BRAND ACTION · LOCAL PREVIEW ONLY</span>
            </article>

            <article className="ca-card ca-member">
              <div className="ca-card-heading"><span>07 / DUAL CLUB CARD</span><small>DEMO MEMBER</small></div>
              <div className="ca-member-card">
                <div className="ca-member-top">
                  <div><JaguarMark size={22} /><b>JAGUAR <small>MEMBER</small></b></div>
                  <span><Leaf size={11} /> KRATOM</span>
                </div>
                <div className="ca-member-code"><span>MEMBER CODE</span><b>JAGUAR06</b></div>
                <div className="ca-member-bottom">
                  <div><span>POINT BALANCE</span><b>06 <small>PTS</small></b></div>
                  <i><QrCode size={24} /></i>
                </div>
              </div>
              <p className="ca-member-caption"><b>01 / 02</b> บัตร Kratom · บัตร Cannabis ใช้โครงสร้างร่วมกัน</p>
            </article>
          </div>
        </section>

        <footer className="ca-footer">
          <span><JaguarMark size={16} /> JAGUAR SPK <i>DESIGN SYSTEM</i></span>
          <p>ICON CATALOG · ACTION CONTROLS · MOBILE TAB BAR <b>—</b> แสดงตัวอย่างแยกในแถบเมนู</p>
          <span className="ca-footer-status"><i className="ca-live-dot" /> ตัวอย่างไม่เรียก API</span>
        </footer>
      </div>
    </main>
  );
}
