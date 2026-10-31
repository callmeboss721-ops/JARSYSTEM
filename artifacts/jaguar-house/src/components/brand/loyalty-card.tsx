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
                {on ? <BrandIcon name="progress" tone="emerald" /> : <span className="font-mono text-[11px]">{i + 1}</span>}
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
