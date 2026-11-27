import type { CSSProperties } from "react";
import { BadgeCheck, Leaf, Palette, QrCode, ShieldCheck, Type } from "lucide-react";
import { tokens } from "@workspace/jaguar-spk-design-system/tokens";
import { CollectingTrack } from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import { RankShield } from "@workspace/jaguar-spk-design-system/components/ui/rank-emblems";
import "@workspace/jaguar-spk-design-system/styles.css";
import "./compactsequence.css";

const ranks = [
  { name: "royal-king", label: "Royal King" },
  { name: "leopard-vip", label: "Leopard VIP" },
  { name: "nature-green", label: "Nature Green" },
] as const;

export function CompactSequence() {
  const themeStyle = {
    "--cs-background": tokens.color.dark.background,
    "--cs-surface": tokens.color.dark.card,
    "--cs-raised": tokens.color.dark.popover,
    "--cs-border": tokens.color.dark.border,
    "--cs-text": tokens.color.dark.foreground,
    "--cs-muted": tokens.color.dark.mutedForeground,
    "--cs-green": tokens.color.dark.primary,
    "--cs-green-ink": tokens.color.dark.primaryForeground,
    "--cs-gold": tokens.color.dark.secondary,
    "--cs-emphasis": tokens.color.dark.accent,
    "--cs-radius": tokens.radius,
  } as CSSProperties;

  const colorRoles = [
    { label: "Primary", name: "Neon green", color: tokens.color.dark.primary, use: "การกระทำหลัก" },
    { label: "Secondary", name: "Gold", color: tokens.color.dark.secondary, use: "การกระทำรอง" },
    { label: "Emphasis", name: "Gold 2", color: tokens.color.dark.accent, use: "ลำดับและจุดเน้น" },
  ];

  const neutrals = [
    { label: "Canvas", color: tokens.color.dark.background },
    { label: "Surface", color: tokens.color.dark.card },
    { label: "Text", color: tokens.color.dark.foreground },
    { label: "Muted", color: tokens.color.dark.mutedForeground },
  ];

  return (
    <main className="cs-shell" style={themeStyle}>
      <div className="cs-page">
        <header className="cs-header">
          <div className="cs-brand">
            <span className="cs-logo-wrap"><JaguarMark size={38} title="JAGUAR SPK" /></span>
            <span>
              <strong>JAGUAR <i>SPK</i></strong>
              <small>DESIGN SYSTEM · V3</small>
            </span>
          </div>
          <span className="cs-version"><i /> MOBILE OVERVIEW</span>
        </header>

        <section className="cs-intro">
          <p className="cs-eyebrow">JAGUAR KRATOM HOUSE <span>•</span> FOUNDATIONS</p>
          <h1>ดำ <em>·</em> เขียวนีออน <em>·</em> ทอง</h1>
          <p>ลำดับแนวตั้งแบบกระชับ อ่านง่ายตั้งแต่แบรนด์ไปจนถึงบัตรสมาชิก</p>
        </section>

        <div className="cs-sequence" aria-label="JAGUAR SPK design system foundations">
          <section className="cs-section">
            <div className="cs-index"><span>01</span></div>
            <article className="cs-card cs-foundation">
              <div className="cs-card-head">
                <div><span className="cs-kicker">BRAND FOUNDATION</span><h2>รักษาต้นฉบับของแบรนด์</h2></div>
                <BadgeCheck className="cs-gold" size={19} aria-hidden="true" />
              </div>
              <div className="cs-foundation-content">
                <div className="cs-seal"><span><JaguarMark size={43} /></span><small>ORIGINAL MARK</small></div>
                <div className="cs-brand-copy">
                  <b>JAGUAR SPK DRINK</b>
                  <p>ใช้ตรา JAGUAR ให้ครบ ไม่ครอปหรือวาดทับ เขียวสำหรับการกระทำหลัก และทองสำหรับจุดเน้น</p>
                </div>
              </div>
              <div className="cs-journey">
                <div className="cs-journey-title"><span>MEMBER JOURNEY</span><span>3 STEPS</span></div>
                <div className="cs-journey-steps">
                  <span><i>01</i>สมัคร</span><b />
                  <span><i>02</i>สะสม</span><b />
                  <span><i>03</i>รับสิทธิ์</span>
                </div>
              </div>
            </article>
          </section>

          <section className="cs-section">
            <div className="cs-index"><span>02</span></div>
            <article className="cs-card">
              <div className="cs-card-head">
                <div><span className="cs-kicker">COLOR ROLES</span><h2>สีมีหน้าที่ชัดเจน</h2></div>
                <Palette className="cs-gold" size={18} aria-hidden="true" />
              </div>
              <div className="cs-role-list">
                {colorRoles.map((role) => (
                  <div className="cs-role" key={role.label}>
                    <span className="cs-swatch" style={{ "--cs-swatch": role.color } as CSSProperties} />
                    <span className="cs-role-copy"><b>{role.label} <i>·</i> {role.name}</b><small>{role.use}</small></span>
                    <code>{role.color}</code>
                  </div>
                ))}
              </div>
              <div className="cs-neutral-list">
                {neutrals.map((neutral) => (
                  <span className="cs-neutral" key={neutral.label}>
                    <i style={{ "--cs-swatch": neutral.color } as CSSProperties} />{neutral.label}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="cs-section">
            <div className="cs-index"><span>03</span></div>
            <article className="cs-card">
              <div className="cs-card-head">
                <div><span className="cs-kicker">TYPE SYSTEM</span><h2>ภาษาไทยอ่านสบาย</h2></div>
                <Type className="cs-gold" size={18} aria-hidden="true" />
              </div>
              <div className="cs-type-sample">
                <span>DISPLAY <i>BAI JAMJUREE</i></span>
                <strong>บัตรสมาชิกจากัวร์</strong>
              </div>
              <div className="cs-type-sample cs-body-sample">
                <span>BODY <i>IBM PLEX SANS THAI</i></span>
                <p>สะสมแต้มได้ทุกครั้งที่แวะมา แล้วเก็บไว้บนบัตรสมาชิก</p>
              </div>
              <div className="cs-code-sample"><span>CODE · JETBRAINS MONO</span><code>JAGUAR-06 <i>·</i> 08/10</code></div>
            </article>
          </section>

          <section className="cs-section">
            <div className="cs-index"><span>04</span></div>
            <article className="cs-card cs-track-card">
              <div className="cs-card-head">
                <div><span className="cs-kicker">COLLECTING TRACK</span><h2>สะสมเป็นขั้นตอน</h2></div>
                <span className="cs-demo-label">LOCAL DEMO</span>
              </div>
              <div className="cs-track-label"><Leaf size={13} /> KRATOM CLUB</div>
              <CollectingTrack balance={6} kind="kratom" variant="v3" />
              <p className="cs-track-note">10 ช่อง · ตัวอย่างสถานะ 6 จาก 10</p>
            </article>
          </section>

          <section className="cs-section">
            <div className="cs-index"><span>05</span></div>
            <article className="cs-card">
              <div className="cs-card-head">
                <div><span className="cs-kicker">RANK EMBLEMS</span><h2>ตราและชื่อระดับ</h2></div>
                <span className="cs-rank-count">10 TIERS</span>
              </div>
              <div className="cs-ranks">
                {ranks.map((rank) => (
                  <div className="cs-rank" key={rank.name}>
                    <RankShield name={rank.name} size={47} />
                    <b>{rank.label}</b>
                  </div>
                ))}
              </div>
              <p className="cs-rank-note"><ShieldCheck size={14} /> แสดงตราและชื่อระดับเท่านั้น</p>
            </article>
          </section>

          <section className="cs-section cs-last-section">
            <div className="cs-index"><span>06</span></div>
            <article className="cs-card cs-member-card">
              <div className="cs-card-head">
                <div><span className="cs-kicker">MEMBER CARD</span><h2>บัตรสมาชิก · KRATOM</h2></div>
                <span className="cs-demo-label">DEMO MEMBER</span>
              </div>
              <div className="cs-pass">
                <div className="cs-pass-top">
                  <div className="cs-pass-brand"><JaguarMark size={28} /><span>JAGUAR<small>MEMBER</small></span></div>
                  <span className="cs-club"><Leaf size={12} /> KRATOM</span>
                </div>
                <div className="cs-member-code"><span>MEMBER CODE</span><strong>JAGUAR06</strong></div>
                <div className="cs-pass-bottom">
                  <div><span>POINT BALANCE</span><strong>06 <small>PTS</small></strong></div>
                  <span className="cs-qr" aria-label="QR code illustration"><QrCode size={29} /></span>
                </div>
              </div>
              <p className="cs-card-caption">โครงสร้างร่วมสำหรับบัตร Kratom และ Cannabis</p>
            </article>
          </section>
        </div>

        <footer className="cs-footer"><span>JAGUAR SPK <i>DESIGN SYSTEM</i></span><span>LOCAL PREVIEW · NO API</span></footer>
      </div>
    </main>
  );
}
