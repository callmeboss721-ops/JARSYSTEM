import { QRCodeSVG } from "qrcode.react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { tokens } from "../../generated/tokens";
import { BrandButton } from "./brand-button";
import { BrandIcon } from "./brand-icon";
import { BrandV4Icon } from "./brand-v4-icon";
import { MotionBadge } from "./motion-badge";

export type MemberClub = "kratom" | "cannabis";
export const STAMPS = 10;

type CardQr = {
  value?: string;
  loading: boolean;
  error?: string;
  retry?: () => void;
  retrying?: boolean;
};

const CLUBS: Record<MemberClub, { title: string; image: string; stampIcon: string; alt: string; rule: string; reward: string; tagline: string }> = {
  kratom: {
    title: "JAGUAR KRATOM",
    image: "card-kratom-2026.webp",
    stampIcon: "mark-jaguar.svg",
    alt: "บัตรสะสมแต้ม JAGUAR KRATOM ลายเสือจากัวร์",
    rule: "ครบ ฿100 สะสม = 1 แต้ม",
    reward: "รับฟรี 1 รายการ",
    tagline: "JAGUAR SPK CERTIFIED · MIX FRESH · SERVE COLD",
  },
  cannabis: {
    title: "JAGUAR CANNABIS",
    image: "card-cannabis-2026.webp",
    stampIcon: "mark-leaf.svg",
    alt: "บัตรสะสมแต้ม JAGUAR CANNABIS ลายใบกัญชา",
    rule: "ครบ 100 g สะสม = 1 แต้ม",
    reward: "รับฟรี 1 รายการ",
    tagline: "JAGUAR SPK · BREAK ALL LIMIT",
  },
};

const DEFAULT_ASSET_BASE = "/jaguar-spk-design-system/brand/cards/";
const DEFAULT_BUTTON_ASSET_BASE = "/jaguar-spk-design-system/brand/buttons/";
const DEFAULT_STAMP_ASSET_BASE = "/jaguar-spk-design-system/ui/stamps/";
const asset = (file: string, assetBase: string) => `${assetBase}${file}`;

export function SharedMemberCard({
  kind,
  memberCode,
  balance,
  qr,
  className,
  assetBase = DEFAULT_ASSET_BASE,
  dataTestId,
}: {
  kind: MemberClub;
  memberCode: string;
  balance: number;
  qr: CardQr;
  className?: string;
  assetBase?: string;
  dataTestId?: string;
}) {
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const ready = balance >= STAMPS;
  const club = CLUBS[kind];
  return (
    <section className={`member-pass-card${className ? ` ${className}` : ""}`} data-kind={kind} aria-label={kind === "cannabis" ? "บัตรสมาชิกกัญชา" : "บัตรสมาชิกกระท่อม"} data-testid={dataTestId}>
      <div className="member-pass-card__inner">
        <header className="member-pass-card__top">
          <div className="member-pass-card__identity">
            <img className="member-pass-card__brand-mark" src={asset("jaguar-card-mark.webp", assetBase)} alt="" width={36} height={36} />
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
                : <QRCodeSVG value={qr.value} size={66} level="M" includeMargin bgColor={tokens.color.brandId2026.qrQuietZone} className="member-pass-card__qr-code" aria-label={`QR สมาชิก ${memberCode}`} />}
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
  variant = "coins",
  assetBase = "/jaguar-spk-design-system/brand/v4",
  stampAssetBase = DEFAULT_STAMP_ASSET_BASE,
  rewardAssetBase = DEFAULT_STAMP_ASSET_BASE,
  celebrationKey = 0,
}: {
  balance: number;
  kind?: MemberClub;
  titleId?: string;
  variant?: "coins" | "v3";
  assetBase?: string;
  stampAssetBase?: string;
  rewardAssetBase?: string;
  celebrationKey?: number;
}) {
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const ready = filled >= STAMPS;
  const remaining = STAMPS - filled;
  const clubLabel = kind === "cannabis" ? "บัตรกัญชา" : "บัตรกระท่อม";
  const filledStamp = asset(`stamp-coin-${kind}-256.webp`, stampAssetBase);
  const emptyStamp = asset("stamp-slot-empty-256.webp", stampAssetBase);
  return (
    <div className={`collecting-track collecting-track--${kind}${variant === "v3" ? " ds-v3-track" : ""}`}>
      <div className="collecting-track__heading">
        <p>
          <BrandV4Icon name={kind === "cannabis" ? "cannabis-pass" : "stamp-coin"} size={18} assetBase={assetBase} />
          {variant === "v3" ? "JAGUAR SPK COLLECTING TRACK" : `${clubLabel} · แต้มสะสม`}
          {celebrationKey > 0 && <MotionBadge key={`stamp-${celebrationKey}`} name="stamp-pulse" size={22} assetBase={assetBase} />}
        </p>
        <h2 id={titleId}>{variant === "v3" ? "POINTS: " : ""}{filled}<span>/{STAMPS}{variant === "v3" ? "" : " แต้ม"}</span></h2>
      </div>
      <div className="collecting-track__visual" role="group" aria-label={`${clubLabel} สะสมแล้ว ${filled} จาก ${STAMPS} แต้ม${ready ? " · พร้อมแลกรางวัล" : ` · เหลืออีก ${remaining} แต้ม`}`}>
        <div className="collecting-track__connector" aria-hidden="true">
          <span style={{ width: `${filled * 10}%` }} />
        </div>
        <ol aria-label={`${clubLabel} · ${filled} จาก ${STAMPS} แต้ม`}>
          {Array.from({ length: STAMPS }, (_, index) => {
            const isFilled = index < filled;
            const isNext = index === filled && !ready;
            return (
              <li key={index} className="collecting-track__coin" data-filled={isFilled} data-next={isNext}>
                <img
                  className="collecting-track__coin-face"
                  src={isFilled ? filledStamp : emptyStamp}
                  alt=""
                  width={36}
                  height={36}
                  aria-hidden="true"
                />
                <span className="sr-only">{isFilled ? "สะสมแล้ว" : isNext ? "แต้มถัดไป" : "ยังไม่สะสม"} แต้มที่ {index + 1}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className={`collecting-track__status-row${variant === "v3" ? " ds-v3-track-foot" : ""}`}>
        <span className={ready ? "is-ready" : ""} role="status">{ready ? "พร้อมแลกรางวัล" : `เหลืออีก ${remaining} แต้ม`}</span>
        {ready && (
          <MotionBadge
            name="reward-unlock"
            size={48}
            assetBase={rewardAssetBase}
            fallbackSrc={filledStamp}
            className="collecting-track__reward-animation"
          />
        )}
        <span className="sr-only" role="progressbar" aria-valuemin={0} aria-valuemax={STAMPS} aria-valuenow={filled} aria-label={`ความคืบหน้า ${filled} จาก ${STAMPS} แต้ม`} />
      </div>
    </div>
  );
}

export function LoyaltyProgress({
  balance,
  kind = "kratom",
  buttonAssetBase = DEFAULT_BUTTON_ASSET_BASE,
  stampAssetBase = DEFAULT_STAMP_ASSET_BASE,
  rewardAssetBase = DEFAULT_STAMP_ASSET_BASE,
  action,
}: {
  balance: number;
  kind?: MemberClub;
  buttonAssetBase?: string;
  stampAssetBase?: string;
  rewardAssetBase?: string;
  action?: ReactNode;
}) {
  const filled = Math.min(balance, STAMPS);
  const ready = balance >= STAMPS;
  const remaining = Math.max(STAMPS - filled, 0);
  return (
    <section className="ds-glass member-progress-panel" aria-label="ความคืบหน้าแต้มสมาชิก">
      <CollectingTrack balance={balance} kind={kind} stampAssetBase={stampAssetBase} rewardAssetBase={rewardAssetBase} />
      <div className="member-progress-actions">
        <p>{ready ? `ครบ 10 · ${CLUBS[kind].reward}` : `${CLUBS[kind].rule} · เหลือ ${remaining} แต้ม`}</p>
        {action !== undefined
          ? action
          : <BrandButton asset={ready ? "btn-crown" : "btn-frame"} assetBase={buttonAssetBase} label={ready ? "แลกของแถมเลย" : `อีก ${remaining} แต้ม`} disabled={!ready} />}
      </div>
    </section>
  );
}

export function LoyaltyCard({
  kind = "kratom",
  memberCode,
  balance,
  qr,
  assetBase = DEFAULT_ASSET_BASE,
  buttonAssetBase = DEFAULT_BUTTON_ASSET_BASE,
  stampAssetBase = DEFAULT_STAMP_ASSET_BASE,
  rewardAssetBase = DEFAULT_STAMP_ASSET_BASE,
}: {
  kind?: MemberClub;
  memberCode: string;
  balance: number;
  qr: CardQr;
  assetBase?: string;
  buttonAssetBase?: string;
  stampAssetBase?: string;
  rewardAssetBase?: string;
}) {
  return (
    <div className="membership-card-stack">
      <SharedMemberCard kind={kind} memberCode={memberCode} balance={balance} qr={qr} assetBase={assetBase} />
      <LoyaltyProgress balance={balance} kind={kind} buttonAssetBase={buttonAssetBase} stampAssetBase={stampAssetBase} rewardAssetBase={rewardAssetBase} />
    </div>
  );
}

export function MemberCardFaces({
  kind,
  memberCode,
  memberLabel,
  memberPhone,
  balance,
  popKey = 0,
  assetBase = DEFAULT_ASSET_BASE,
  stampAssetBase = DEFAULT_STAMP_ASSET_BASE,
  dataTestId,
}: {
  kind: MemberClub;
  memberCode: string;
  memberLabel?: string;
  memberPhone?: string | null;
  balance: number;
  popKey?: number;
  assetBase?: string;
  stampAssetBase?: string;
  dataTestId?: string;
}) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const ready = balance >= STAMPS;
  return (
    <div className={`club-pass club-pass--${kind}`} data-pop-key={popKey} data-testid={dataTestId ?? (kind === "kratom" ? "card-member" : "card-cannabis-member")}>
      <figure className="club-pass__front">
        <img className="club-pass__front-art" src={asset(club.image, assetBase)} alt={club.alt} loading="eager" />
        <span className="club-pass__front-frame" aria-hidden="true" />
        <div className="club-pass__front-identity">
          <span>{club.tagline}</span>
          <strong>{memberLabel || `@${memberCode}`}</strong>
          <small>รหัสสมาชิก · {memberCode}{memberPhone ? ` · ${memberPhone}` : ""}</small>
        </div>
        <figcaption className="sr-only">{club.title} · {club.tagline} · สมาชิก @{memberCode} · บุญศิริ ซอย 6 · สมุทรปราการ</figcaption>
      </figure>
      <section className="club-pass__stamp-face" aria-label={`แสตมป์ ${club.title}`}>
        <header className="club-pass__stamp-head">
          <div><span>JAGUAR SPK · COLLECTING</span><strong>{filled}<small>/10</small></strong></div>
          <img src={asset(club.stampIcon, assetBase)} alt="" width={23} height={23} aria-hidden="true" />
        </header>
        <ol className="club-pass__stamp-grid" aria-label={`${filled} จาก 10 แต้มสะสม`}>
          {Array.from({ length: STAMPS }, (_, index) => {
            const rewardSlot = index === STAMPS - 1;
            const isFilled = index < filled;
            return (
              <li key={`${popKey}-${index}`} className="club-pass__stamp" data-filled={isFilled} data-reward={rewardSlot} data-ready={ready} data-pop={popKey > 0 && isFilled} data-testid={`${kind === "kratom" ? "stamp" : "cannabis-stamp"}-${index + 1}`}>
                <img
                  className="club-pass__stamp-coin"
                  src={asset(isFilled ? `stamp-coin-${kind}-256.webp` : "stamp-slot-empty-256.webp", stampAssetBase)}
                  alt=""
                  width={44}
                  height={44}
                  aria-hidden="true"
                />
                {rewardSlot && <small>10 · รางวัล</small>}
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

export function MemberStatusPanel({
  kind,
  memberCode,
  memberPhone,
  balance,
  qr,
  action,
  extraPoints,
  dataTestId,
  memberCodeTestId,
  qrTestId,
  buttonAssetBase = DEFAULT_BUTTON_ASSET_BASE,
  openQrRequest,
  brandV4AssetBase = "/jaguar-spk-design-system/brand/v4",
}: {
  kind: MemberClub;
  memberCode: string;
  memberPhone?: string | null;
  balance: number;
  qr: CardQr;
  action?: ReactNode;
  extraPoints?: number;
  dataTestId?: string;
  memberCodeTestId?: string;
  qrTestId?: string;
  buttonAssetBase?: string;
  openQrRequest?: number;
  brandV4AssetBase?: string;
}) {
  const club = CLUBS[kind];
  const filled = Math.min(Math.max(balance, 0), STAMPS);
  const remaining = Math.max(STAMPS - filled, 0);
  const ready = balance >= STAMPS;
  const qrDialog = useRef<HTMLDialogElement>(null);
  const qrTitleId = useId();
  useEffect(() => {
    const dialog = qrDialog.current;
    if (openQrRequest && dialog && !dialog.open) dialog.showModal();
  }, [openQrRequest]);
  return (
    <section className="ds-glass member-dashboard-status" aria-label="สถานะสมาชิก" data-kind={kind} data-testid={dataTestId}>
      <div className="member-dashboard-status__main">
        <header>
          <div><span className="member-dashboard-status__eyebrow"><BrandV4Icon name="member-card" size={18} assetBase={brandV4AssetBase} />MEMBERS CLUB</span><h2>สวัสดี <strong data-testid={memberCodeTestId}>@{memberCode}</strong></h2></div>
          <span className="member-dashboard-status__chip" data-ready={ready}>{ready ? "พร้อมแลก" : "กำลังสะสม"}</span>
        </header>
        <div className="member-dashboard-status__points"><span>แต้มสะสม</span><strong>{filled}<small>/10</small></strong><span className="member-dashboard-status__remaining">
          {ready
            ? <><BrandIcon name="crown" size={17} tone="gold" /> สิทธิ์แลกฟรีพร้อมใช้งาน · แจ้งพนักงานที่เคาน์เตอร์ได้เลย (แลกได้ {Math.floor(balance / STAMPS)} สิทธิ์)</>
            : `สะสมอีก ${remaining} แต้ม แลกรับฟรีทันที 1 รายการ`}
        </span></div>
        <div className="member-dashboard-status__bar" role="progressbar" aria-label={`แต้มสะสม ${filled} จาก 10`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={filled}>
          <span style={{ width: `${filled * 10}%` }} />
        </div>
        {extraPoints !== undefined && extraPoints > STAMPS && <span className="member-dashboard-status__extra" data-testid="text-extra-points">แต้มคงเหลือ {extraPoints}</span>}
        {action !== undefined ? action : ready && kind === "kratom"
          ? <BrandButton asset="btn-crown" assetBase={buttonAssetBase} label="แลกของแถม" />
          : <BrandButton asset={ready ? "btn-leaf-cannabis" : "btn-frame"} assetBase={buttonAssetBase} label={ready ? "แสดง QR" : `อีก ${remaining} แต้ม`} disabled={!ready} />}
      </div>
      <div id="member-qr-target" className="member-dashboard-status__qr" aria-label="QR ส่วนตัวสำหรับพนักงานสแกน" data-testid={qrTestId}>
        {qr.loading ? <span className="member-dashboard-status__qr-loading" aria-label="กำลังโหลด QR" />
          : qr.error || !qr.value ? <div className="member-dashboard-status__qr-error"><span role="alert">QR ไม่พร้อม</span><button type="button" onClick={qr.retry} disabled={qr.retrying}>{qr.retrying ? "รอ…" : "ลองใหม่"}</button></div>
            : (
              <button
                type="button"
                className="member-dashboard-status__qr-trigger"
                data-qr-trigger={kind}
                aria-haspopup="dialog"
                aria-label={`เปิด QR สมาชิก ${memberCode} แบบเต็มจอ`}
                onClick={() => qrDialog.current?.showModal()}
              >
                <QRCodeSVG value={qr.value} size={82} level="M" includeMargin bgColor={tokens.color.brandId2026.qrQuietZone} className="member-dashboard-status__qr-code" aria-label={`QR สมาชิก ${memberCode}`} />
                <small>แตะเพื่อขยาย QR</small>
              </button>
            )}
        <dialog ref={qrDialog} className="member-qr-dialog" aria-labelledby={qrTitleId}>
          <div className="member-qr-dialog__surface">
            <header className="member-qr-dialog__header">
              <div>
                <p id={qrTitleId}>QR สมาชิก</p>
                <span>@{memberCode}</span>
              </div>
              <button
                type="button"
                className="member-qr-dialog__close"
                aria-label="ปิด QR"
                onClick={() => qrDialog.current?.close()}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>
            {qr.loading ? (
              <p className="member-qr-dialog__message" role="status">กำลังโหลด QR สมาชิก…</p>
            ) : qr.error || !qr.value ? (
              <div className="member-qr-dialog__message" role="alert">
                <span>QR ยังไม่พร้อมใช้งาน</span>
                <button type="button" onClick={qr.retry} disabled={qr.retrying}>
                  {qr.retrying ? "กำลังลองใหม่…" : "ลองโหลด QR อีกครั้ง"}
                </button>
              </div>
            ) : (
              <QRCodeSVG
                value={qr.value}
                size={240}
                level="H"
                includeMargin
                bgColor={tokens.color.brandId2026.qrQuietZone}
                className="member-qr-dialog__code"
                aria-label={`QR สมาชิก ${memberCode} สำหรับให้พนักงานสแกน`}
              />
            )}
            <p className="member-qr-dialog__identity">
              <strong>{memberCode}</strong>
              {memberPhone && <span>{memberPhone}</span>}
              <small>แสดง QR นี้ให้พนักงานสแกน</small>
            </p>
          </div>
        </dialog>
      </div>
    </section>
  );
}

export function LoyaltyCardArtwork({
  variant,
  assetBase = DEFAULT_ASSET_BASE,
}: {
  variant: MemberClub;
  assetBase?: string;
}) {
  return <img className={`loyalty-card-art loyalty-card-art--${variant}`} src={asset(CLUBS[variant].image, assetBase)} alt="" aria-hidden="true" />;
}
