"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { LoyaltyCard, LoyaltyCardSkeleton, STAMPS } from "@/components/brand/loyalty-card";
import { EmptyState, ErrorState, SignedOutState } from "@/components/brand/ui";
import { api, errorText, gradeFor, type MemberCardData, type Sale, formulaLabels } from "@/components/brand/loyalty-api";

export default function CardPage() {
  const qc = useQueryClient();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    on(); document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const card = useQuery<MemberCardData>({ queryKey: ["/api/loyalty/card"], queryFn: () => api("/api/loyalty/card"), refetchInterval: visible ? 2000 : false, refetchIntervalInBackground: false, refetchOnWindowFocus: true, retry: false });
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
    {card.isLoading ? <div className="max-w-xl mx-auto"><LoyaltyCardSkeleton /></div>
    : card.error && (card.error as {status?: number}).status === 401 ? <div className="max-w-md mx-auto"><SignedOutState /></div>
    : card.isError || !card.data ? <div className="max-w-md mx-auto"><ErrorState message={errorText(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></div>
    : <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] items-start">
      <div className="space-y-5">
        <header className="rise">
          <p className="eyebrow">สมาชิก · Jaguar Kratom</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-1">{card.data.display_name || "บัตรสมาชิกของฉัน"}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">ระดับ {gradeFor(card.data.lifetime_earned)} · แต้มจากยอดสะสมตลอดอายุสมาชิก</p>
        </header>
        {(celebrate || card.data.balance >= STAMPS) && <div role="status" className="gold-alert">ครบ 10 แต้ม! รับขวดแถมฟรี 1 ขวด</div>}
        {confettiKey > 0 && <Confetti key={confettiKey} />}
        <div key={pop} className={pop ? "card-pop" : undefined}>
          <LoyaltyCard card={card.data} qr={{
            value: qr.data?.qr, loading: qr.isLoading, error: qr.isError ? errorText(qr.error) : undefined,
            retry: () => { void qr.refetch(); }, retrying: qr.isFetching,
          }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="panel p-4"><p className="text-xs text-[var(--muted)]">สะสมทั้งหมด</p><p className="font-display text-2xl font-semibold mt-1">{card.data.lifetime_earned}</p></div>
          <div className="panel p-4"><p className="text-xs text-[var(--muted)]">ใช้แลกไปแล้ว</p><p className="font-display text-2xl font-semibold mt-1 text-[var(--gold-2)]">{card.data.lifetime_redeemed}</p></div>
        </div>
        <div className="flex flex-col min-[390px]:flex-row gap-3">
          <Link href="/redeem" className="btn btn-redeem flex-1">{card.data.balance >= STAMPS ? "แลกรางวัล" : "ดูรางวัล"} <BrandIcon name="redeem" tone="inherit" /></Link>
          <Link href="/" className="btn btn-ghost flex-1">หน้าแรกร้าน</Link>
        </div>
      </div>
      <aside className="space-y-5">
        <section className="panel p-5" aria-labelledby="sales-title">
          <div className="flex items-center justify-between mb-3"><h2 id="sales-title" className="font-display text-lg font-semibold">5 รายการซื้อล่าสุด</h2><span className="eyebrow">Recent visits</span></div>
          {sales.isLoading ? <div className="space-y-2">{[1,2,3].map(x => <div key={x} className="skeleton h-14" />)}</div>
          : sales.isError ? <ErrorState message={errorText(sales.error)} onRetry={() => sales.refetch()} retrying={sales.isFetching} />
          : !sales.data?.length ? <EmptyState title="ยังไม่มีรายการซื้อ" body="รายการจากร้านจะแสดงที่นี่" />
          : <ul className="divide-y divide-[var(--line)] list-none p-0 m-0">{sales.data.slice(0,5).map(s => <li key={s.id} className="py-3 flex gap-3 items-center">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{formulaLabels[s.formula] || s.formula} · {s.bottle_count} ขวด</p><p className="text-xs text-[var(--muted)]">{new Date(s.created_at).toLocaleString("th-TH")}</p></div>
            <div className="text-right shrink-0"><p className="font-mono">฿{s.amount_baht.toLocaleString("th-TH")}</p><p className={`text-xs ${s.points_awarded ? "text-[var(--emerald-2)]" : "text-[var(--muted)]"}`}>{s.points_awarded ? `+${s.points_awarded} แต้ม` : "ไม่ครบ 3 ขวด"}</p></div>
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
