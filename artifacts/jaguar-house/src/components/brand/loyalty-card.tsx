import { BrandIcon } from "./brand-icon";
import { QRCodeSVG } from "qrcode.react";
import { ErrorState } from "./ui";
import type { MemberCardData } from "./loyalty-api";
import { BrandEmblem } from "./brand-emblem";

export const STAMPS = 10;

type CardQr = { value?: string; loading: boolean; error?: string; retry?: () => void; retrying?: boolean };

export function LoyaltyCard({ card, qr }: { card: MemberCardData; qr: CardQr }) {
  const filled = Math.min(card.balance, STAMPS);
  const extra = Math.max(card.balance - STAMPS, 0);
  const ready = card.balance >= STAMPS;
  return (
    <section className="member-card rise" aria-label="บัตรสมาชิกดิจิทัล" data-testid="card-member">
      <div className="member-card-inner p-4 sm:p-6">
        <div className="rosette-bg rosette-field" aria-hidden="true" />
        <LoyaltyCardArtwork variant="kratom" />
        <div className="member-card-topbar relative">
          <div className="member-card-brand">
            <BrandEmblem variant="card" />
            <div className="min-w-0">
              <p className="member-card-brand__name">JAGUAR KRATOM</p>
              <p className="member-card-brand__place">SAMUT PRAKAN · SOI 6</p>
            </div>
          </div>
          <span className="member-username" data-testid="text-member-code" aria-label={`รหัสสมาชิก ${card.member_code}`}>@{card.member_code}</span>
        </div>

        <div className="relative mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-[var(--silver)]">แต้มคงเหลือ</p>
            <div className="member-card-points">
              <p className="font-display font-bold leading-none text-[48px] sm:text-[70px] text-[var(--gold-2)] tabular-nums" data-testid="text-balance">{card.balance}</p>
              <div className="member-card-points__round"><strong>{filled}<span>/10</span></strong><small>รอบนี้</small></div>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <span className="pulse-dot" aria-hidden="true" /> {card.status === "active" ? "ใช้งานอยู่" : card.status}
            </p>
          </div>
          <div className="member-card__qr shrink-0 text-center" aria-label="QR ส่วนตัวสำหรับให้พนักงานสแกน">
            {qr.loading ? <div className="skeleton h-32 w-32 sm:h-36 sm:w-36 rounded-lg" aria-label="กำลังโหลด QR" />
              : qr.error || !qr.value ? <div className="flex h-32 w-32 sm:h-36 sm:w-36 flex-col items-center justify-center gap-1">
                  <p role="alert" className="text-[10px] leading-tight text-[var(--muted)]">โหลด QR ไม่สำเร็จ</p>
                  <button type="button" className="btn btn-ghost !min-h-10 !px-2 text-xs" onClick={qr.retry} disabled={qr.retrying}>{qr.retrying ? "กำลังโหลด…" : "ลองอีกครั้ง"}</button>
                </div>
                : <QRCodeSVG value={qr.value} size={128} level="M" className="member-card__qr-code h-32 w-32 sm:h-36 sm:w-36" aria-label="QR สมาชิกส่วนบุคคล" />}
            <p className="mt-1 text-[9px] sm:text-[10px] text-[var(--muted)]">สแกนที่เคาน์เตอร์</p>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="inline-flex items-center gap-2 text-[var(--muted)]"><BrandIcon name="progress" tone="gold" />{ready ? "ครบ 10 แต้ม · แลกของแถมได้" : `อีก ${STAMPS - filled} แต้ม ถึงแลกได้`}</span>
            <span className="font-mono text-[var(--gold-2)]">{filled}/{STAMPS}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={STAMPS}
            aria-valuenow={filled}
            aria-label="ความคืบหน้าการสะสมแต้ม"
          >
            <div className="progress-fill" style={{ width: `${(filled / STAMPS) * 100}%` }} />
          </div>
        </div>

        <ol className="relative mt-4 grid grid-cols-5 gap-2 sm:gap-3 list-none p-0 m-0" aria-label={`ตราประทับ ${filled} จาก ${STAMPS} ดวง`}>
          {Array.from({ length: STAMPS }, (_, i) => {
            const on = i < filled;
            return (
              <li key={i} className="stamp" data-filled={on} data-testid={`stamp-${i + 1}`}>
                {on ? <BrandIcon name="progress" tone="emerald" /> : <span className="stamp-empty-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M19 35C9 31 5 24 8 15c5 1 9 4 11 9 2-9 6-14 14-15 1 11-3 20-14 26Z"/><path d="M19 35c0-8 1-15 4-22M19 26l-8-8m9 2 8-9"/></svg></span>}
                {!on && <span className="font-mono text-[11px]">{i + 1}</span>}
                <span className="sr-only">{on ? "ประทับแล้ว" : "ว่าง"}</span>
              </li>
            );
          })}
        </ol>
        {extra > 0 && (
          <p className="relative mt-4 text-sm text-[var(--gold-2)]" data-testid="text-extra-points">
            แต้มเกินบัตร +{extra} แต้ม — ยอดจริงทั้งหมด {card.balance} แต้ม
          </p>
        )}
      </div>
    </section>
  );
}

/** Samut Prakan bridge engraving and card-specific botanical signature. */
export function LoyaltyCardArtwork({ variant }: { variant: "kratom" | "cannabis" }) {
  return (
    <svg className={`loyalty-card-art loyalty-card-art--${variant}`} viewBox="0 0 400 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="art-lettering">
        <text x="22" y="34">SAMUT PRAKAN</text>
        <text x="378" y="34" textAnchor="end">SOI 6</text>
      </g>
      <g className="art-bridge" transform="translate(82 54) scale(.78)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 177H376M34 171h58m216 0h58" />
        <path d="M105 174V92l-8 82m8-82 9 82m-16-59h14m-17 21h20m-21 21h23m-25 17h27" />
        <path d="M105 92 48 171m57-79-34 78m34-78v78m0-78 35 78m-35-78 57 79" />
        <path d="M286 174V77l-10 97m10-97 11 97m-18-72h15m-19 24h22m-24 24h27m-29 17h31" />
        <path d="M286 77 224 171m62-94-38 93m38-93v93m0-93 39 93m-39-93 63 94" />
        <path d="M37 180c72-7 136-8 196-2 53 5 94 5 131 0M18 194c56-7 112-7 167-2m28 0c64 4 116 3 168-3" />
      </g>
      <g className="art-water" fill="none" strokeLinecap="round">
        <path d="M-10 222c35-10 64-10 98 0s64 10 98 0 64-10 98 0 64 10 98 0 64-10 98 0" />
        <path d="M-20 245c39-9 71-9 108 0s68 9 104 0 68-9 104 0 68 9 104 0 68-9 104 0" />
        <path d="M-4 270c34-8 63-8 95 0s62 8 94 0 62-8 94 0 62 8 94 0 62-8 94 0" />
        <path d="M-18 296c45-8 81-8 122 0s77 8 118 0 77-8 118 0 77 8 118 0" />
        <path d="M8 324c34-7 62-7 94 0s62 7 94 0 62-7 94 0 62 7 94 0" />
        <path d="M-4 350c42-6 77-6 116 0s72 6 110 0 72-6 110 0 72 6 110 0" />
      </g>
      <svg className="art-watermark" x="12" y="112" width="198" height="222" viewBox="235 48 280 350" preserveAspectRatio="xMidYMid meet">
        <image href="/jaguar-kratom-transparent.png" x="0" y="0" width="1024" height="1024" preserveAspectRatio="none" />
      </svg>
      <g className="art-botany" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
        {variant === "kratom" ? <>
          <g className="kratom-leaf">
            <path d="M47 506C44 456 49 409 62 362C35 380 19 374 13 344C39 334 58 344 68 365C60 333 66 311 92 298C114 321 111 345 77 371C105 344 128 347 145 373C129 400 107 405 74 382C102 411 101 438 78 458C51 443 45 419 59 385C44 425 47 467 57 506Z" />
            <path d="M52 505c5-45 10-83 17-122m-14 91-29-47m37 23 35-43m-33 10-7-53m-1 38 42-11m-39 39-40-31" />
          </g>
          <g className="kratom-leaf secondary">
            <path d="M116 520c-2-38 2-73 12-108-22 15-37 9-41-14 20-8 34-2 42 17-6-25-1-42 20-51 17 18 14 37-13 56 22-19 40-16 51 5-13 21-31 25-55 8 21 22 20 42 2 58-21-12-25-29-13-55-8 30-9 57-4 84Z" />
            <path d="M119 519c4-32 8-59 15-87m-11 64-25-32m30 14 27-31m-25 6-5-37" />
          </g>
          <g className="kratom-leaf corner-leaf" transform="translate(263 -70) scale(.32)">
            <path d="M116 520c-2-38 2-73 12-108-22 15-37 9-41-14 20-8 34-2 42 17-6-25-1-42 20-51 17 18 14 37-13 56 22-19 40-16 51 5-13 21-31 25-55 8 21 22 20 42 2 58-21-12-25-29-13-55-8 30-9 57-4 84Z" />
            <path d="M119 519c4-32 8-59 15-87m-11 64-25-32m30 14 27-31m-25 6-5-37" />
          </g>
        </> : <>
          <g className="cannabis-leaf">
            <path d="M79 520c3-54 3-100 0-139C65 414 51 425 36 412c8-17 18-26 34-28-26 0-39-9-42-26 17-11 33-10 48 2-20-19-24-36-14-51 20 6 31 19 34 42-1-30 8-46 26-49 13 20 11 39-7 58 21-18 39-20 53-6-6 22-20 34-47 35 29 3 43 14 40 33-21 7-39 1-55-20 12 24 13 42 1 55-21-11-29-28-25-54-3 39-3 78 1 117Z" />
            <path d="M79 519c0-58 0-98 0-137m0 88-36-49m36 18-43-68m43 37-31-73m31 40-13-62m13 62 16-62m-16 90 40-68m-40 97 43-48m-43 76 39-25" />
          </g>
          <g className="cannabis-leaf small-leaf" transform="translate(43 35) scale(.58)">
            <path d="M79 520c3-54 3-100 0-139C65 414 51 425 36 412c8-17 18-26 34-28-26 0-39-9-42-26 17-11 33-10 48 2-20-19-24-36-14-51 20 6 31 19 34 42-1-30 8-46 26-49 13 20 11 39-7 58 21-18 39-20 53-6-6 22-20 34-47 35 29 3 43 14 40 33-21 7-39 1-55-20 12 24 13 42 1 55-21-11-29-28-25-54-3 39-3 78 1 117Z" />
            <path d="M79 519v-137m0 88-36-49m36 18-43-68m43 37-31-73m31 40-13-62m13 62 16-62m-16 90 40-68m-40 97 43-48" />
          </g>
          <g className="cannabis-leaf corner-leaf" transform="translate(278 -55) scale(.28)">
            <path d="M79 520c3-54 3-100 0-139C65 414 51 425 36 412c8-17 18-26 34-28-26 0-39-9-42-26 17-11 33-10 48 2-20-19-24-36-14-51 20 6 31 19 34 42-1-30 8-46 26-49 13 20 11 39-7 58 21-18 39-20 53-6-6 22-20 34-47 35 29 3 43 14 40 33-21 7-39 1-55-20 12 24 13 42 1 55-21-11-29-28-25-54-3 39-3 78 1 117Z" />
            <path d="M79 519v-137m0 88-36-49m36 18-43-68m43 37-31-73m31 40-13-62m13 62 16-62m-16 90 40-68m-40 97 43-48" />
          </g>
        </>}
      </g>
    </svg>
  );
}

export function LoyaltyCardSkeleton() {
  return (
    <div className="member-card" aria-busy="true" aria-label="กำลังโหลดบัตร">
      <div className="member-card-inner p-6 space-y-6">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-16 w-28" />
        <div className="skeleton h-2 w-full" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton aspect-square !rounded-full" />)}
        </div>
      </div>
    </div>
  );
}
