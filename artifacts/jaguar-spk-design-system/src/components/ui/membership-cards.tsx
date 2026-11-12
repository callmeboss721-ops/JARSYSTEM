import { QRCodeSVG } from "qrcode.react";
import { BrandButton } from "./brand-button";
import { BrandIcon } from "./brand-icon";

export type MemberClub = "kratom" | "cannabis";
export const STAMPS = 10;

type CardQr = {
  value?: string;
  loading: boolean;
  error?: string;
  retry?: () => void;
  retrying?: boolean;
};

const CLUBS: Record<MemberClub, { title: string; image: string; stampIcon: string; alt: string; rule: string; reward: string }> = {
  kratom: {
    title: "JAGUAR KRATOM",
    image: "card-kratom-full.jpg",
    stampIcon: "mark-jaguar.svg",
    alt: "บัตรสะสมแต้ม JAGUAR KRATOM ลายเสือจากัวร์",
    rule: "ครบ ฿100 สะสม = 1 แต้ม",
    reward: "ฟรี 1 ขวด",
  },
  cannabis: {
    title: "JAGUAR CANNABIS",
    image: "card-cannabis-full.jpg",
    stampIcon: "mark-leaf.svg",
    alt: "บัตรสะสมแต้ม JAGUAR CANNABIS ลายใบกัญชา",
    rule: "ครบ 100 g สะสม = 1 แต้ม",
    reward: "ฟรี 1 g",
  },
};

const asset = (file: string) => `${import.meta.env.BASE_URL}brand/cards/${file}`;

export function SharedMemberCard({
  kind,
  memberCode,
  balance,
  qr,
  className,
}: {
  kind: MemberClub;
  memberCode: string;
  balance: number;
  qr: CardQr;
  className?: string;
}) {
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const ready = balance >= STAMPS;
  const club = CLUBS[kind];
  return (
    <section className={`member-pass-card${className ? ` ${className}` : ""}`} data-kind={kind} aria-label={kind === "cannabis" ? "บัตรสมาชิกกัญชา" : "บัตรสมาชิกกระท่อม"}>
      <div className="member-pass-card__inner">
        <header className="member-pass-card__top">
          <div className="member-pass-card__identity">
            <img className="member-pass-card__brand-mark" src={asset("jaguar-card-mark.webp")} alt="" width={36} height={36} />
            <div>
              <p className="member-pass-card__label">{club.title} · MEMBER</p>
              <p className="member-pass-card__location">บุญศิริ ซอย 6 · สมุทรปราการ</p>
            </div>
          </div>
          <span className="member-pass-card__edition" aria-hidden="true">{kind === "cannabis" ? "02" : "01"}</span>
        </header>
        <div className="member-pass-card__body">
          <div className="member-pass-card__member">
            <span>MEMBER ID</span>
            <strong aria-label={`รหัสสมาชิก ${memberCode}`}>@{memberCode}</strong>
          </div>
          <div className="member-pass-card__qr" aria-label="QR ส่วนตัวสำหรับให้พนักงานสแกน">
            {qr.loading ? <span className="member-pass-card__qr-placeholder" aria-label="กำลังโหลด QR" />
              : qr.error || !qr.value ? <div className="member-pass-card__qr-error">
                  <span role="alert">QR ไม่พร้อม</span>
                  <button type="button" onClick={qr.retry} disabled={qr.retrying}>{qr.retrying ? "รอ…" : "ลองใหม่"}</button>
                </div>
                : <QRCodeSVG value={qr.value} size={66} level="M" className="member-pass-card__qr-code" aria-label={`QR สมาชิก ${memberCode}`} />}
            <small>สแกนที่ร้าน</small>
          </div>
        </div>
        <footer className="member-pass-card__footer">
          <div className="member-pass-card__points">
            <span>POINTS</span>
            <strong>{filled}<small>/10</small></strong>
          </div>
          <span className={`member-pass-card__status${ready ? " is-ready" : ""}`} role="status">
            {ready ? "READY TO REDEEM" : "COLLECTING"}
          </span>
        </footer>
      </div>
    </section>
  );
}

export function CollectingTrack({
  balance,
  kind = "kratom",
  titleId,
}: {
  balance: number;
  kind?: MemberClub;
  titleId?: string;
}) {
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const connectorProgress = Math.max(0, ((filled - 1) / (STAMPS - 1)) * 100);
  return (
    <div className={`collecting-track collecting-track--${kind}`}>
      <div className="collecting-track__heading">
        <p>แต้มสะสม</p>
        <h2 id={titleId}>{filled}<span>/{STAMPS}</span></h2>
      </div>
      <div className="collecting-track__visual">
        <div className="collecting-track__connector" aria-hidden="true">
          <span style={{ width: `${connectorProgress}%` }} />
        </div>
        <ol aria-label={`แต้ม ${filled} จาก ${STAMPS}`}>
          {Array.from({ length: STAMPS }, (_, index) => {
            const isFilled = index < filled;
            return (
              <li key={index} className="collecting-track__coin" data-filled={isFilled}>
                <BrandIcon name="crown" className="collecting-track__crown" tone="gold" size={14} />
                <span className="collecting-track__coin-face">{String(index + 1).padStart(2, "0")}</span>
                <span className="sr-only">{isFilled ? "สะสมแล้ว" : "ยังไม่สะสม"} แต้มที่ {index + 1}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <span className="sr-only" role="progressbar" aria-valuemin={0} aria-valuemax={STAMPS} aria-valuenow={filled} aria-label={`ความคืบหน้า ${filled} จาก ${STAMPS} แต้ม`} />
    </div>
  );
}

export function LoyaltyProgress({ balance, kind = "kratom" }: { balance: number; kind?: MemberClub }) {
  const filled = Math.min(balance, STAMPS);
  const ready = balance >= STAMPS;
  const remaining = Math.max(STAMPS - filled, 0);
  return (
    <section className="ds-glass member-progress-panel" aria-label="ความคืบหน้าแต้มสมาชิก">
      <CollectingTrack balance={balance} kind={kind} />
      <div className="member-progress-actions">
        <p>{ready ? `ครบ 10 · ${CLUBS[kind].reward}` : `${CLUBS[kind].rule} · เหลือ ${remaining} แต้ม`}</p>
        <BrandButton asset={ready ? "btn-crown" : "btn-frame"} label={ready ? "แลกของแถมเลย" : `อีก ${remaining} แต้ม`} disabled={!ready} />
      </div>
    </section>
  );
}

export function LoyaltyCard({ kind = "kratom", memberCode, balance, qr }: { kind?: MemberClub; memberCode: string; balance: number; qr: CardQr }) {
  return (
    <div className="membership-card-stack">
      <SharedMemberCard kind={kind} memberCode={memberCode} balance={balance} qr={qr} />
      <LoyaltyProgress balance={balance} kind={kind} />
    </div>
  );
}

export function MemberCardFaces({ kind, memberCode, balance, popKey = 0 }: { kind: MemberClub; memberCode: string; balance: number; popKey?: number }) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const ready = balance >= STAMPS;
  return (
    <div className={`club-pass club-pass--${kind}`} data-pop-key={popKey}>
      <figure className="club-pass__front">
        <img className="club-pass__front-art" src={asset(club.image)} alt={club.alt} />
        <span className="club-pass__front-frame" aria-hidden="true" />
        <figcaption className="sr-only">{club.title} · บัตรสมาชิก @{memberCode} · บุญศิริ ซอย 6 · สมุทรปราการ</figcaption>
      </figure>
      <section className="club-pass__stamp-face" aria-label={`แสตมป์ ${club.title}`}>
        <header className="club-pass__stamp-head">
          <div><span>JAGUAR SPK · COLLECTING</span><strong>{filled}<small>/10</small></strong></div>
          <img src={asset(club.stampIcon)} alt="" width={23} height={23} aria-hidden="true" />
        </header>
        <ol className="club-pass__stamp-grid" aria-label={`${filled} จาก 10 แต้มสะสม`}>
          {Array.from({ length: STAMPS }, (_, index) => {
            const rewardSlot = index === STAMPS - 1;
            const isFilled = index < filled;
            return (
              <li key={`${popKey}-${index}`} className="club-pass__stamp" data-filled={isFilled} data-reward={rewardSlot} data-ready={ready}>
                {rewardSlot ? <><strong>FREE!</strong><small>แถมฟรี</small></>
                  : isFilled ? <img src={asset(club.stampIcon)} alt="" width={28} height={28} aria-hidden="true" />
                    : <span>{String(index + 1).padStart(2, "0")}</span>}
                <span className="sr-only">{rewardSlot ? `ครบ 10 แต้ม ${club.reward}` : isFilled ? "สะสมแล้ว" : "ยังไม่สะสม"}</span>
              </li>
            );
          })}
        </ol>
        <footer className="club-pass__stamp-foot"><span>{club.rule}</span><span>{club.reward}</span></footer>
      </section>
      <span className="sr-only" aria-live="polite">แต้มสะสม {filled} จาก 10</span>
      <span className="sr-only">สมาชิก @{memberCode}</span>
    </div>
  );
}

export function MemberStatusPanel({ kind, memberCode, balance, qr }: { kind: MemberClub; memberCode: string; balance: number; qr: CardQr }) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const remaining = Math.max(STAMPS - filled, 0);
  const ready = balance >= STAMPS;
  return (
    <section className="ds-glass member-dashboard-status" aria-label="สถานะสมาชิก">
      <div className="member-dashboard-status__main">
        <header>
          <div><span className="member-dashboard-status__eyebrow">MEMBERS CLUB</span><h2>สวัสดี <strong>@{memberCode}</strong></h2></div>
          <span className="member-dashboard-status__chip" data-ready={ready}>{ready ? "พร้อมแลก" : "กำลังสะสม"}</span>
        </header>
        <div className="member-dashboard-status__points"><span>แต้มสะสม</span><strong>{filled}<small>/10</small></strong><span className="member-dashboard-status__remaining">{ready ? club.reward : `อีก ${remaining} แต้ม`}</span></div>
        <div className="member-dashboard-status__bar" role="progressbar" aria-label={`แต้มสะสม ${filled} จาก 10`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={filled}>
          <span style={{ width: `${filled * 10}%` }} />
        </div>
        {ready && kind === "kratom"
          ? <BrandButton asset="btn-crown" label="แลกของแถม" />
          : <BrandButton asset={ready ? "btn-leaf-cannabis" : "btn-frame"} label={ready ? "แสดง QR" : `อีก ${remaining} แต้ม`} disabled={!ready} />}
      </div>
      <div className="member-dashboard-status__qr" aria-label="QR ส่วนตัวสำหรับพนักงานสแกน">
        {qr.loading ? <span className="member-dashboard-status__qr-loading" aria-label="กำลังโหลด QR" />
          : qr.error || !qr.value ? <div className="member-dashboard-status__qr-error"><span role="alert">QR ไม่พร้อม</span><button type="button" onClick={qr.retry} disabled={qr.retrying}>{qr.retrying ? "รอ…" : "ลองใหม่"}</button></div>
            : <QRCodeSVG value={qr.value} size={62} level="M" aria-label={`QR สมาชิก ${memberCode}`} />}
        <small>สแกนที่ร้าน</small>
      </div>
    </section>
  );
}

export function LoyaltyCardArtwork({ variant }: { variant: MemberClub }) {
  return <img className={`loyalty-card-art loyalty-card-art--${variant}`} src={asset(CLUBS[variant].image)} alt="" aria-hidden="true" />;
}
