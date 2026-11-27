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
import "./overviewgrid.css";

const navigation = ["ภาพรวม", "แบรนด์", "สี", "ตัวอักษร", "คอมโพเนนต์"];
const ranks = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
] as const;

export function OverviewGrid() {
  const [activeNav, setActiveNav] = useState(navigation[0]);
  const [cardOpened, setCardOpened] = useState(false);
  const themeStyle = {
    "--j-background": tokens.color.dark.background,
    "--j-surface": tokens.color.dark.card,
    "--j-raised": tokens.color.dark.popover,
    "--j-border": tokens.color.dark.border,
    "--j-text": tokens.color.dark.foreground,
    "--j-muted": tokens.color.dark.mutedForeground,
    "--j-green": tokens.color.dark.primary,
    "--j-green-ink": tokens.color.dark.primaryForeground,
    "--j-gold": tokens.color.dark.secondary,
    "--j-emphasis": tokens.color.dark.accent,
    "--j-radius": tokens.radius,
    "--j-step": tokens.spacing,
  } as CSSProperties;

  return (
    <main className="jov-shell dark" style={themeStyle}>
      <header className="jov-topbar">
        <div className="jov-brand-lockup" aria-label="JAGUAR SPK Design System">
          <JaguarMark className="jov-brand-logo" size={40} title="JAGUAR SPK" />
          <span className="jov-brand-copy">
            <strong>JAGUAR <i>SPK</i></strong>
            <small>DESIGN SYSTEM · V3 SOURCE</small>
          </span>
        </div>
        <nav className="jov-nav" aria-label="ตัวอย่างหมวดหมู่ดีไซน์">
          {navigation.map((item) => (
            <button
              className={activeNav === item ? "jov-nav-link is-active" : "jov-nav-link"}
              key={item}
              type="button"
              aria-current={activeNav === item ? "page" : undefined}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="jov-version"><span className="jov-live-dot" /> แสดงตัวอย่าง <b>V3</b></div>
      </header>

      <div className="jov-content">
        <section className="jov-intro">
          <div>
            <p className="jov-eyebrow"><span>01</span> JAGUAR KRATOM HOUSE <span className="jov-eyebrow-line" /></p>
            <h1>ดำ <em>·</em> เขียวนีออน <em>·</em> ทอง</h1>
            <p className="jov-intro-copy">ระบบภาพภาษาไทยเป็นหลัก สำหรับแบรนด์ที่ชัดเจนและการใช้งานหน้าร้านที่อ่านง่าย</p>
          </div>
          <div className="jov-intro-side">
            <span className="jov-vertical-label">FOUNDATIONS / REUSABLE UI</span>
            <p>หน้าแรก <ChevronRight size={13} /> <strong>{activeNav}</strong></p>
          </div>
        </section>

        <section className="jov-bento" aria-label="ภาพรวมระบบดีไซน์">
          <article className="jov-panel jov-identity">
            <div className="jov-panel-top">
              <span className="jov-kicker">BRAND FOUNDATION <b>01—03</b></span>
              <BadgeCheck size={17} className="jov-gold-icon" aria-hidden="true" />
            </div>
            <div className="jov-identity-body">
              <div className="jov-seal" aria-hidden="true">
                <span className="jov-seal-ring"><JaguarMark className="jov-seal-logo" size={42} /></span>
                <span className="jov-seal-caption">ORIGINAL MARK</span>
              </div>
              <div className="jov-identity-copy">
                <p className="jov-small-label">JAGUAR SPK DRINK</p>
                <h2>เอกลักษณ์<br />ที่รักษาต้นฉบับ</h2>
                <p>เก็บตรา JAGUAR ให้ครบ ไม่ครอปหรือวาดทับ ใช้เขียวกับการกระทำหลัก และทองกับจุดเน้น</p>
              </div>
            </div>
            <div className="jov-journey">
              <div className="jov-journey-head"><span>MEMBER JOURNEY</span><span>3 STEPS</span></div>
              <div className="jov-journey-track">
                <div><span>01</span><b>สมัคร</b></div>
                <i />
                <div><span>02</span><b>สะสม</b></div>
                <i />
                <div><span>03</span><b>รับสิทธิ์</b></div>
              </div>
            </div>
          </article>

          <article className="jov-panel jov-palette">
            <div className="jov-panel-top">
              <span className="jov-kicker">COLOR ROLES <b>02</b></span>
              <Palette size={16} className="jov-gold-icon" aria-hidden="true" />
            </div>
            <div className="jov-color-lead">
              <div className="jov-color-name"><span>01</span><strong>Primary · Neon Green</strong></div>
              <div className="jov-color-bar jov-primary-bar"><span>#00FF9D</span><b>หลัก</b></div>
            </div>
            <div className="jov-color-row">
              <div className="jov-color-chip jov-chip-gold"><span>#D4AF37</span></div>
              <div><b>Secondary · Gold</b><small>การกระทำรอง</small></div>
            </div>
            <div className="jov-color-row">
              <div className="jov-color-chip jov-chip-emphasis"><span>#E5C04A</span></div>
              <div><b>Emphasis · Gold 2</b><small>ลำดับและจุดเน้น</small></div>
            </div>
            <div className="jov-support-colors">
              <span><i className="jov-dot-black" /> Canvas</span>
              <span><i className="jov-dot-surface" /> Surface</span>
              <span><i className="jov-dot-text" /> Text</span>
              <span><i className="jov-dot-muted" /> Muted</span>
            </div>
          </article>

          <article className="jov-panel jov-type">
            <div className="jov-panel-top">
              <span className="jov-kicker">TYPE SYSTEM <b>03</b></span>
              <Type size={17} className="jov-gold-icon" aria-hidden="true" />
            </div>
            <div className="jov-type-row">
              <span>DISPLAY <i>BAI JAMJUREE</i></span>
              <strong className="jov-display-sample">บัตรสมาชิก<br />จากัวร์</strong>
            </div>
            <div className="jov-type-row">
              <span>BODY <i>IBM PLEX SANS THAI</i></span>
              <p>สะสมแต้มได้ทุกครั้งที่แวะมา แล้วเก็บไว้บนบัตรสมาชิก</p>
            </div>
            <div className="jov-code-line"><span>CODE · JETBRAINS MONO</span><code>JAGUAR-06 <b>·</b> 08/10</code></div>
          </article>

          <article className="jov-panel jov-track-panel">
            <div className="jov-panel-top">
              <span className="jov-kicker">COLLECTING TRACK <b>04</b></span>
              <span className="jov-demo-label">LOCAL DEMO</span>
            </div>
            <span className="jov-track-club">KRATOM CLUB</span>
            <CollectingTrack balance={6} kind="kratom" variant="v3" />
            <div className="jov-track-foot"><span>10 ช่อง · สถานะพร้อมแลกเมื่อครบ</span><span className="jov-progress"><i /></span></div>
          </article>

          <article className="jov-panel jov-ranks">
            <div className="jov-panel-top">
              <span className="jov-kicker">RANK EMBLEMS <b>05</b></span>
              <span className="jov-type-label">10 TIERS</span>
            </div>
            <div className="jov-rank-strip">
              {ranks.map((rank, index) => (
                <div className="jov-rank" key={rank.name}>
                  <span className={`jov-rank-emblem jov-rank-emblem-${index + 1}`}><RankShield name={rank.name} size={42} /></span>
                  <b>{rank.label}</b>
                </div>
              ))}
            </div>
            <p className="jov-rank-note"><ShieldCheck size={13} /> แสดงตราและชื่อระดับเท่านั้น · ไม่มีสิทธิประโยชน์เพิ่มเติม</p>
          </article>

          <article className="jov-panel jov-components">
            <div className="jov-panel-top">
              <span className="jov-kicker">CORE COMPONENTS <b>06</b></span>
              <Shapes size={16} className="jov-gold-icon" aria-hidden="true" />
            </div>
            <div className="jov-component-grid">
              <div className="jov-component-item">
                <span className="jov-component-symbol"><Sparkles size={18} /></span>
                <b>Brand Icon</b><small>ความหมายชัดเจน</small>
              </div>
              <div className="jov-component-item">
                <span className="jov-component-symbol is-gold"><Crown size={18} /></span>
                <b>Gold Accent</b><small>สถานะรอง</small>
              </div>
              <div className="jov-component-item">
                <span className="jov-component-symbol is-outline"><QrCode size={18} /></span>
                <b>QR Action</b><small>เปิดบัตรสมาชิก</small>
              </div>
              <div className="jov-component-item">
                <span className="jov-component-symbol is-badge"><Check size={18} /></span>
                <b>Success</b><small>สถานะที่อ่านชัด</small>
              </div>
            </div>
            <div className="jov-brand-action">
              <BrandButton
                asset="btn-jaguar"
                assetBase="/jaguar-spk-design-system/brand/buttons/"
                label={cardOpened ? "แสดงตัวอย่างแล้ว" : "เปิดบัตรสมาชิก"}
                onClick={() => setCardOpened((opened) => !opened)}
                className="jov-native-brand-button"
              />
            </div>
            <span className="jov-action-foot">BRAND ACTION · LOCAL PREVIEW ONLY</span>
          </article>

          <article className="jov-panel jov-card-preview">
            <div className="jov-panel-top">
              <span className="jov-kicker">DUAL CLUB CARD <b>07</b></span>
              <span className="jov-demo-label">DEMO MEMBER</span>
            </div>
            <div className="jov-member-card">
              <div className="jov-member-top">
              <div className="jov-card-brand"><JaguarMark className="jov-card-logo" size={24} /><span>JAGUAR <small>MEMBER</small></span></div>
                <span className="jov-club-tag"><Leaf size={11} /> KRATOM</span>
              </div>
              <div className="jov-card-member"><span>MEMBER CODE</span><strong>JAGUAR06</strong></div>
              <div className="jov-card-bottom">
                <div><span>POINT BALANCE</span><strong>06 <small>PTS</small></strong></div>
                <div className="jov-card-qr" aria-hidden="true"><QrCode size={27} /></div>
              </div>
            </div>
            <p className="jov-card-caption"><span>01 / 02</span> บัตร Kratom · บัตร Cannabis ใช้โครงสร้างร่วมกัน</p>
          </article>
        </section>

        <footer className="jov-footer">
          <span><JaguarMark className="jov-footer-logo" size={17} /> JAGUAR SPK <i>DESIGN SYSTEM</i></span>
          <p>ICON CATALOG · ACTION CONTROLS · MOBILE TAB BAR <b>—</b> แสดงตัวอย่างแยกในแถบเมนู</p>
          <span className="jov-footer-status"><span className="jov-live-dot" /> ตัวอย่างไม่เรียก API</span>
        </footer>
      </div>
    </main>
  );
}
