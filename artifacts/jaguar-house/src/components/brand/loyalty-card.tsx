import type { MemberCard } from "@workspace/api-client-react";
import { JaguarMark } from "./jaguar-mark";

export const STAMPS = 10;

export function LoyaltyCard({ card }: { card: MemberCard }) {
  const filled = Math.min(card.balance, STAMPS);
  const extra = Math.max(card.balance - STAMPS, 0);
  const ready = card.balance >= STAMPS;
  return (
    <section className="member-card rise" aria-label="บัตรสมาชิกดิจิทัล" data-testid="card-member">
      <div className="member-card-inner p-5 sm:p-7">
        <div className="rosette-bg" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Members Club · Soi 6</p>
            <p className="font-display text-xl sm:text-2xl font-semibold mt-1">Jaguar Kratom House</p>
          </div>
          <JaguarMark size={52} animated />
        </div>

        <div className="relative mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">แต้มคงเหลือ</p>
            <p className="font-display font-bold leading-none text-[64px] sm:text-[80px] text-[var(--neon)] tabular-nums" data-testid="text-balance">
              {card.balance}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">รหัสสมาชิก</p>
            <p className="font-mono text-lg tracking-[.2em] text-[var(--gold-2)]" data-testid="text-member-code">{card.member_code}</p>
            <p className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="pulse-dot" aria-hidden="true" /> {card.status === "active" ? "ใช้งานอยู่" : card.status}
            </p>
          </div>
        </div>

        <div className="relative mt-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-[var(--muted)]">{ready ? "ครบ 10 ดวง พร้อมแลกรางวัล" : `อีก ${STAMPS - filled} ดวง ครบรางวัล`}</span>
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

        <ol className="relative mt-6 grid grid-cols-5 gap-2.5 sm:gap-4 list-none p-0 m-0" aria-label={`ตราประทับ ${filled} จาก ${STAMPS} ดวง`}>
          {Array.from({ length: STAMPS }, (_, i) => {
            const on = i < filled;
            return (
              <li key={i} className="stamp" data-filled={on} style={on ? { animationDelay: `${i * 60}ms` } : undefined} data-testid={`stamp-${i + 1}`}>
                {on ? <JaguarMark size={30} /> : <span className="font-mono text-[11px]">{i + 1}</span>}
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
