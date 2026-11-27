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
import "./overvieweditorial.css";

const navigation = ["ภาพรวม", "แบรนด์", "สี", "ตัวอักษร", "คอมโพเนนต์"];
const ranks = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
] as const;

export function OverviewEditorial() {
  const [activeNav, setActiveNav] = useState(navigation[0]);
  const [cardOpened, setCardOpened] = useState(false);
  const themeStyle = {
    "--oe-background": tokens.color.dark.background,
    "--oe-surface": tokens.color.dark.card,
    "--oe-raised": tokens.color.dark.popover,
    "--oe-border": tokens.color.dark.border,
    "--oe-text": tokens.color.dark.foreground,
    "--oe-muted": tokens.color.dark.mutedForeground,
    "--oe-green": tokens.color.dark.primary,
    "--oe-green-ink": tokens.color.dark.primaryForeground,
    "--oe-gold": tokens.color.dark.secondary,
    "--oe-emphasis": tokens.color.dark.accent,
    "--oe-radius": tokens.radius,
  } as CSSProperties;

  return (
    <main className="oe-shell dark" style={themeStyle}>
      <header className="oe-header">
        <div className="oe-brand">
          <JaguarMark className="oe-brand-mark" size={38} title="JAGUAR SPK" />
          <span>
            <strong>JAGUAR <i>SPK</i></strong>
            <small>DESIGN SYSTEM · V3 SOURCE</small>
          </span>
        </div>
        <nav className="oe-nav" aria-label="ตัวอย่างหมวดหมู่ดีไซน์">
          {navigation.map((item) => (
            <button
              className={activeNav === item ? "oe-nav-link is-active" : "oe-nav-link"}
              key={item}
              type="button"
              aria-current={activeNav === item ? "page" : undefined}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="oe-version"><span className="oe-live-dot" /> แสดงตัวอย่าง <b>V3</b></div>
      </header>

      <div className="oe-page">
        <div className="oe-split">
          <section className="oe-story" aria-labelledby="oe-story-title">
            <div className="oe-story-meta">
              <span><i>01</i> BRAND ESSAY</span>
              <span>JAGUAR KRATOM HOUSE</span>
            </div>
            <div className="oe-story-mark">
              <span className="oe-mark-orbit"><JaguarMark size={104} title="JAGUAR SPK" /></span>
              <span className="oe-mark-caption">THE ORIGINAL MARK · KEEP WHOLE</span>
            </div>
            <div className="oe-story-copy">
              <p className="oe-story-kicker">JAGUAR SPK DRINK <BadgeCheck size={15} /></p>
              <h1 id="oe-story-title">เอกลักษณ์<br />ที่รักษา<span>ต้นฉบับ</span></h1>
              <p className="oe-story-lede">ดำ · เขียวนีออน · ทอง</p>
              <p className="oe-story-description">
                ระบบภาพภาษาไทยเป็นหลัก สำหรับแบรนด์ที่ชัดเจนและการใช้งานหน้าร้านที่อ่านง่าย
                เก็บตรา JAGUAR ให้ครบ ไม่ครอปหรือวาดทับ ใช้เขียวกับการกระทำหลัก และทองกับจุดเน้น
              </p>
            </div>
            <div className="oe-journey">
              <div className="oe-journey-heading"><span>MEMBER JOURNEY</span><b>03 STEPS</b></div>
              <div className="oe-journey-steps">
                <div><i>01</i><b>สมัคร</b></div><span />
                <div><i>02</i><b>สะสม</b></div><span />
                <div><i>03</i><b>รับสิทธิ์</b></div>
              </div>
            </div>
            <div className="oe-story-foot">
              <span>FOUNDATIONS / REUSABLE UI</span>
              <p>หน้าแรก <ChevronRight size={13} /> <strong>{activeNav}</strong></p>
            </div>
          </section>

          <section className="oe-reference" aria-label="ภาพรวมระบบดีไซน์">
            <div className="oe-reference-heading">
              <div><span>02 — 07</span><h2>Reference rail</h2></div>
              <p>สี · ตัวอักษร · องค์ประกอบ</p>
            </div>
            <div className="oe-reference-grid">
              <article className="oe-card oe-palette">
                <div className="oe-card-heading"><span>02 / COLOR ROLES</span><Palette size={15} /></div>
                <div className="oe-primary-role"><span>01 · Primary / Neon Green</span><b>#00FF9D <i>หลัก</i></b></div>
                <div className="oe-color-rows">
                  <div><i className="oe-chip oe-chip-gold">#D4AF37</i><span><b>Secondary · Gold</b><small>การกระทำรอง</small></span></div>
                  <div><i className="oe-chip oe-chip-emphasis">#E5C04A</i><span><b>Emphasis · Gold 2</b><small>ลำดับและจุดเน้น</small></span></div>
                </div>
                <div className="oe-foundation-colors">
                  <span><i className="oe-dot oe-dot-canvas" />Canvas</span>
                  <span><i className="oe-dot oe-dot-surface" />Surface</span>
                  <span><i className="oe-dot oe-dot-text" />Text</span>
                  <span><i className="oe-dot oe-dot-muted" />Muted</span>
                </div>
              </article>

              <article className="oe-card oe-type">
                <div className="oe-card-heading"><span>03 / TYPE SYSTEM</span><Type size={15} /></div>
                <div className="oe-type-sample"><span>DISPLAY · BAI JAMJUREE</span><b>บัตรสมาชิกจากัวร์</b></div>
                <div className="oe-type-sample"><span>BODY · IBM PLEX SANS THAI</span><p>สะสมแต้มได้ทุกครั้งที่แวะมา แล้วเก็บไว้บนบัตรสมาชิก</p></div>
                <div className="oe-code"><span>JETBRAINS MONO</span><b>JAGUAR-06 <i>·</i> 08/10</b></div>
              </article>

              <article className="oe-card oe-track">
                <div className="oe-card-heading"><span>04 / COLLECTING TRACK</span><small>LOCAL DEMO</small></div>
                <p className="oe-track-label">KRATOM CLUB</p>
                <CollectingTrack balance={6} kind="kratom" variant="v3" />
                <div className="oe-track-caption"><span>10 ช่อง · สถานะพร้อมแลกเมื่อครบ</span><i><b /></i></div>
              </article>

              <article className="oe-card oe-ranks">
                <div className="oe-card-heading"><span>05 / RANK EMBLEMS</span><small>10 TIERS</small></div>
                <div className="oe-rank-list">
                  {ranks.map((rank, index) => (
                    <div className="oe-rank" key={rank.name}>
                      <span className={`oe-rank-mark oe-rank-mark-${index + 1}`}><RankShield name={rank.name} size={34} /></span>
                      <b>{rank.label}</b>
                    </div>
                  ))}
                </div>
                <p className="oe-rank-note"><ShieldCheck size={12} /> แสดงตราและชื่อระดับเท่านั้น · ไม่มีสิทธิประโยชน์เพิ่มเติม</p>
              </article>

              <article className="oe-card oe-components">
                <div className="oe-card-heading"><span>06 / CORE COMPONENTS</span><Shapes size={15} /></div>
                <div className="oe-components-list">
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
                  className="oe-brand-button"
                />
                <span className="oe-local-note">BRAND ACTION · LOCAL PREVIEW ONLY</span>
              </article>

              <article className="oe-card oe-member">
                <div className="oe-card-heading"><span>07 / DUAL CLUB CARD</span><small>DEMO MEMBER</small></div>
                <div className="oe-member-card">
                  <div className="oe-member-top">
                    <div><JaguarMark size={22} /><b>JAGUAR <small>MEMBER</small></b></div>
                    <span><Leaf size={11} /> KRATOM</span>
                  </div>
                  <div className="oe-member-code"><span>MEMBER CODE</span><b>JAGUAR06</b></div>
                  <div className="oe-member-bottom">
                    <div><span>POINT BALANCE</span><b>06 <small>PTS</small></b></div>
                    <i><QrCode size={24} /></i>
                  </div>
                </div>
                <p className="oe-member-caption"><b>01 / 02</b> บัตร Kratom · บัตร Cannabis ใช้โครงสร้างร่วมกัน</p>
              </article>
            </div>
          </section>
        </div>

        <footer className="oe-footer">
          <span><JaguarMark size={16} /> JAGUAR SPK <i>DESIGN SYSTEM</i></span>
          <p>ICON CATALOG · ACTION CONTROLS · MOBILE TAB BAR <b>—</b> แสดงตัวอย่างแยกในแถบเมนู</p>
          <span className="oe-footer-status"><i className="oe-live-dot" /> ตัวอย่างไม่เรียก API</span>
        </footer>
      </div>
    </main>
  );
}
