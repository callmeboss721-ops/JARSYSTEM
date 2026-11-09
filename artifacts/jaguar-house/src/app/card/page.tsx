"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { MemberCardCarousel } from "@/components/brand/member-card-carousel";
import { LoyaltyCard, LoyaltyProgress, STAMPS } from "@/components/brand/loyalty-card";
import { EmptyState, ErrorState, LoadingState, SignedOutState } from "@/components/brand/ui";
import { api, errorText, gradeFor, type MemberCardData, type Sale, formulaLabels } from "@/components/brand/loyalty-api";

export default function CardPage() {
  const qc = useQueryClient();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    on(); document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const card = useQuery<MemberCardData>({ queryKey: ["/api/loyalty/card"], queryFn: () => api("/api/loyalty/card"), refetchInterval: visible ? 2000 : false, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0, retry: false });
  const sales = useQuery<Sale[]>({ queryKey: ["/api/loyalty/sales"], queryFn: () => api("/api/loyalty/sales"), enabled: card.isSuccess, refetchInterval: visible ? 5000 : false, refetchIntervalInBackground: false, refetchOnWindowFocus: false });
  const code = card.data?.member_code;
  // The opaque staff-scan token is stable across reloads; keep one account-scoped fetch.
  const qr = useQuery<{ qr: string }>({ queryKey: ["/api/loyalty/qr", code], queryFn: () => api("/api/loyalty/qr"), enabled: !!code, staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: false });
  const previous = useRef<{ code: string; balance: number; earned: number } | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [pop, setPop] = useState(0);
  const balance = card.data?.balance, earned = card.data?.lifetime_earned;
  useEffect(() => {
    if (!code || balance === undefined || earned === undefined) return;
    const prev = previous.current;
    previous.current = { code, balance, earned };
    if (!prev || prev.code !== code) return;
    if (balance !== prev.balance || earned !== prev.earned) void qc.invalidateQueries({ queryKey: ["/api/loyalty/sales"] });
    if (earned <= prev.earned) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) setPop((n) => n + 1);
    if (prev.balance < STAMPS && balance >= STAMPS) {
      setCelebrate(true);
      if (!reduced) {
        setConfettiKey((n) => n + 1);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([60, 40, 120]);
      }
    } else if (!reduced && "vibrate" in navigator) navigator.vibrate?.(30);
  }, [code, balance, earned, qc]);
  useEffect(() => { if (balance !== undefined && balance < STAMPS) setCelebrate(false); }, [balance]);

  return <MemberShell signedIn={card.isSuccess}>
    {card.isLoading ? <div className="max-w-xl mx-auto"><LoadingState label="กำลังโหลดบัตรสมาชิก" /></div>
    : card.error && (card.error as {status?: number}).status === 401 ? <div className="max-w-md mx-auto"><SignedOutState /></div>
    : card.isError || !card.data ? <div className="max-w-md mx-auto"><ErrorState message={errorText(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></div>
    : <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr] items-start">
      <div className="space-y-3">
        <header className="card-member-heading rise">
          <p className="eyebrow">MEMBERS CLUB · DIGITAL PASS</p>
          <div className="member-heading-top">
            <div><h1 className="font-display text-xl sm:text-2xl font-semibold mt-1">{card.data.display_name || "บัตรสมาชิกของฉัน"}</h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">ระดับ {gradeFor(card.data.lifetime_earned)} · สมาชิก JAGUAR KRATOM</p>
            </div>
            <img src="/brand/jaguar-spk-wordmark-final.webp" alt="ตรา JAGUAR SPK" width={1200} height={536} />
          </div>
          <p className="member-slogan">พี่เสือพลังใบ ซุปเปอร์ฮีโร่ของคนไทย</p>
        </header>
        {(celebrate || card.data.balance >= STAMPS) && <div role="status" className="gold-alert">ครบ 10 แต้ม! รับขวดแถมฟรี 1 ขวด</div>}
        {confettiKey > 0 && <Confetti key={confettiKey} />}
        <div className={pop ? `card-pop card-pop--${pop % 2}` : undefined}>
          <MemberCardCarousel active="kratom">
            <LoyaltyCard card={card.data} qr={{
              value: qr.data?.qr, loading: qr.isLoading, error: qr.isError ? errorText(qr.error) : undefined,
              retry: () => { void qr.refetch(); }, retrying: qr.isFetching,
            }} />
          </MemberCardCarousel>
        </div>
        <LoyaltyProgress balance={card.data.balance} />
        <div className="card-bento-grid" aria-label="สรุปสมาชิกและที่ตั้งร้าน">
          <div className="panel card-bento-stat card-bento-stat--primary"><p>แต้มคงเหลือ</p><strong data-testid="text-balance">{card.data.balance}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-stat card-bento-stat--gold"><p>{card.data.balance >= STAMPS ? "แลกขวดฟรีได้แล้ว" : "อีกกี่แต้มถึงแลก"}</p><strong>{Math.max(STAMPS - Math.min(card.data.balance, STAMPS), 0)}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-stat"><p>สะสมตลอดชีพ</p><strong>{card.data.lifetime_earned}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-stat"><p>ใช้แลกไปแล้ว</p><strong>{card.data.lifetime_redeemed}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-location">
            <BrandIcon name="location" tone="gold" />
            <div><p>แวะมาที่ร้าน</p><strong>บุญศิริ ซอย 6</strong><small>สมุทรปราการ</small></div>
          </div>
        </div>
        <Link href="/" className="btn btn-ghost w-full sm:w-auto">กลับหน้าแรกร้าน</Link>
      </div>
      <aside className="space-y-5">
        <section className="panel p-5" aria-labelledby="sales-title">
          <div className="flex items-center justify-between mb-3"><h2 id="sales-title" className="font-display text-lg font-semibold">5 รายการซื้อล่าสุด</h2><span className="eyebrow">Recent visits</span></div>
          {sales.isLoading ? <div className="space-y-2">{[1,2,3].map(x => <div key={x} className="skeleton h-14" />)}</div>
          : sales.isError ? <ErrorState message={errorText(sales.error)} onRetry={() => sales.refetch()} retrying={sales.isFetching} />
          : !sales.data?.length ? <EmptyState title="ยังไม่มีรายการซื้อ" body="รายการจากร้านจะแสดงที่นี่" />
          : <ul className="divide-y divide-[var(--line)] list-none p-0 m-0">{sales.data.slice(0,5).map(s => <li key={s.id} className="py-3 flex gap-3 items-center">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{formulaLabels[s.formula] || s.formula} · {s.bottle_count} ขวด</p><p className="text-xs text-[var(--muted)]">{new Date(s.created_at).toLocaleString("th-TH")}</p></div>
            <div className="text-right shrink-0"><p className="font-mono">฿{s.amount_baht.toLocaleString("th-TH")}</p><p className={`text-xs ${s.points_awarded ? "text-[var(--emerald-2)]" : "text-[var(--muted)]"}`}>{s.points_awarded ? `+${s.points_awarded} แต้ม` : "บิลนี้ไม่ครบ 3 ขวด"}</p></div>
          </li>)}</ul>}
        </section>
      </aside>
    </div>}
  </MemberShell>;
}

const COLORS = ["#e5c04a", "#f6e09a", "#2fd98a", "#c4cad6", "#b8901f"];
function Confetti() {
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, x: `${((i * 53) % 120) - 60}px`, r: `${(i * 97) % 720}deg`,
    d: `${1.8 + ((i * 13) % 14) / 10}s`, delay: `${((i * 7) % 10) / 20}s`, c: COLORS[i % COLORS.length],
  })), []);
  return <div className="confetti" aria-hidden="true">{bits.map((b, i) => <i key={i} style={{ left: b.left, background: b.c, ["--x" as string]: b.x, ["--r" as string]: b.r, ["--d" as string]: b.d, ["--delay" as string]: b.delay }} />)}</div>;
}
