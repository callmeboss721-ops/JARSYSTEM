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
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Private Members · Soi 6</p>
            <p className="font-display text-xl sm:text-2xl font-semibold mt-1">Jaguar Kratom</p>
          </div>
          <BrandEmblem variant="card" />
        </div>

        <div className="relative mt-4 pt-4 border-t border-[var(--line)] flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-[var(--silver)]">แต้มคงเหลือ</p>
            <p className="font-display font-bold leading-none text-[48px] sm:text-[70px] text-[var(--gold-2)] tabular-nums" data-testid="text-balance">
              {card.balance}
            </p>
            <p className="mt-2 text-[10px] text-[var(--muted)]">รหัสสมาชิก</p>
            <p className="font-mono text-xs sm:text-sm tracking-[.14em] text-[var(--text)] break-all" data-testid="text-member-code">{card.member_code}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <span className="pulse-dot" aria-hidden="true" /> {card.status === "active" ? "ใช้งานอยู่" : card.status}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-[var(--line-2)] bg-black/40 p-1.5 sm:p-2 text-center" aria-label="QR ส่วนตัวสำหรับให้พนักงานสแกน">
            {qr.loading ? <div className="skeleton h-32 w-32 sm:h-36 sm:w-36 rounded-lg" aria-label="กำลังโหลด QR" />
              : qr.error || !qr.value ? <div className="flex h-32 w-32 sm:h-36 sm:w-36 flex-col items-center justify-center gap-1">
                  <p role="alert" className="text-[10px] leading-tight text-[var(--muted)]">โหลด QR ไม่สำเร็จ</p>
                  <button type="button" className="btn btn-ghost !min-h-10 !px-2 text-xs" onClick={qr.retry} disabled={qr.retrying}>{qr.retrying ? "กำลังโหลด…" : "ลองอีกครั้ง"}</button>
                </div>
                : <QRCodeSVG value={qr.value} size={128} level="M" className="h-32 w-32 sm:h-36 sm:w-36" aria-label="QR สมาชิกส่วนบุคคล" />}
            <p className="mt-1 text-[9px] sm:text-[10px] text-[var(--muted)]">สแกนที่เคาน์เตอร์</p>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="inline-flex items-center gap-2 text-[var(--muted)]"><BrandIcon name="progress" tone="gold" />{ready ? "ครบ 10 ดวง พร้อมแลกรางวัล" : `อีก ${STAMPS - filled} ดวง ครบรางวัล`}</span>
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
            <div className="progress-fill" style={{ transform: `scaleX(${filled / STAMPS})` }} />
          </div>
        </div>

        <ol className="relative mt-4 grid grid-cols-5 gap-2 sm:gap-3 list-none p-0 m-0" aria-label={`ตราประทับ ${filled} จาก ${STAMPS} ดวง`}>
          {Array.from({ length: STAMPS }, (_, i) => {
            const on = i < filled;
            return (
              <li key={i} className="stamp" data-filled={on} data-testid={`stamp-${i + 1}`}>
                {on ? <BrandIcon name="progress" tone="emerald" /> : <span className="stamp-empty-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 27C8 23 5 17 7 10c4 1 7 3 9 7 2-7 5-10 10-11 1 8-2 15-10 21Z"/><path d="M16 27c0-6 0-10 1-15"/></svg></span>}
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

/** Shared local landmark + jaguar engraving, with a card-specific botanical signature. */
export function LoyaltyCardArtwork({ variant }: { variant: "kratom" | "cannabis" }) {
  return (
    <svg className={`loyalty-card-art loyalty-card-art--${variant}`} viewBox="180 0 360 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="art-lettering">
        <text x="204" y="68">SAMUT PRAKAN</text>
        <text x="515" y="68" textAnchor="end">SOI 6</text>
      </g>
      <g className="art-bridge" transform="translate(180 0) scale(.6 1)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 184H680M80 177h88m10 0h70m324 0h45m12 0h55" />
        <path d="M191 181V83l-12 98m12-98 13 98m-21-70h17m-19 24h21m-23 24h25m-26 23h28" />
        <path d="M191 83 111 179m80-96-49 95m49-95 0 95m0-95 51 95m-51-95 81 96" />
        <path d="M526 181V63l-14 118m14-118 14 118m-23-88h19m-22 29h25m-28 29h31m-33 29h36" />
        <path d="M526 63 434 178m92-115-55 114m55-114 0 114m0-114 57 114m-57-114 93 115" />
        <path d="M79 186c113-10 207-10 313-2 96 8 177 9 248 0" />
      </g>
      <g className="art-water" fill="none" strokeLinecap="round">
        <path d="M20 226c66-18 111-18 175-2s108 17 169-1 109-19 173-2 105 17 165-1" />
        <path d="M-9 247c69-15 120-15 182 0s109 16 169 0 111-16 173 0 109 16 177-1" />
        <path d="M28 270c62-13 102-11 156 1s101 13 158-1 100-14 157 0 107 13 167-1" />
        <path d="M-20 296c83-13 132-10 195 1s108 11 163-2 105-12 162 1 116 13 207-3" />
        <path d="M44 321c59-9 109-8 163 2s100 10 154-1 104-10 163 1 98 9 155-2" />
      </g>
      <g className="art-jaguar" transform="translate(-195 0)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M414 249c14-31 37-50 67-56 15-19 35-29 59-28 19-17 47-17 66-2 20 2 38 13 47 31 12 6 18 17 17 30l-10 17-24 2-19-11-12 9-21-4-13 15-21-7-19 14-24-2-19 14-19-5-14 15-28-2-13 11-31-4-14-12Z" />
        <path d="M516 195c-7-15-4-30 8-43l18 18m49-5c4-14 15-23 31-26l5 23m-71 32 10 2m38-3 10 2m-31 13 18 2m-36-3 9 7m38-7-9 7m-30 9 18 2" />
        <path d="M514 205c-7-5-13-6-18-4m82-8c6-5 12-6 18-4m-50 25 12 2" />
        <path d="M528 219c-8 14-7 25 3 34m61-37c9 12 8 23-2 34m-48 4 12 9 13-8m31-3 12 7 11-10" />
        <path className="art-face" d="m506 199 13-5 9 4m46-5 13-4 10 6m-74 31 14 5 12-5m25 1 12 4 13-6m-36 11 8 5 8-5" />
        <path className="art-rosettes" d="M489 220l5-3m18 12 5-4m23-47 5-4m22 12 5-4m31-4 5-4m25 20 5-4m-112 54 5-4m51 7 5-4m-77 3 5-4m90-25 5-4" />
        <path d="M469 252c-18 13-26 29-22 49m112-20c8 11 20 17 36 17m-104-37c-15 7-25 17-32 31m107-20c14 4 25 12 34 24" />
      </g>
      <g className="art-botany" transform="translate(180 0)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {variant === "kratom" ? <>
          <path d="M70 315c-7-54-4-92 8-133m7 113c-34-13-48-35-39-68 27 5 42 22 43 51m2-30c21-26 44-31 68-15-10 26-30 39-61 39m-13-32c-23-29-23-53 1-73 22 20 27 43 13 68m40 71c-7-45-4-77 9-105m7 87c-25-11-34-28-28-52 22 4 33 17 31 39m1-19c16-20 34-24 52-11-7 20-22 30-45 30" />
          <path d="M60 316h106m-63-37 10 15m-15-43 14 16m28 42 8 11m-2-42 9 12" />
        </> : <>
          <path d="M89 320c-1-52 0-93 5-133m0 71-31-51 6 31-23-24 13 34-25-14 23 29-27-1 36 22Zm4-55 28-50-5 30 24-24-13 34 26-14-23 29 28-1-39 25Zm0-39-12-35 13 22 10-34 2 40" />
          <path d="M94 235 60 204m34 48 35-31m-34-20-1-24m-3 126 4 22m-30-68 30 21m31-49-30 27" />
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
