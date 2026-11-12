"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetMemberCardQueryKey, useGetMemberCard, useUpdateMemberNickname } from "@workspace/api-client-react";
import { MemberShell } from "@/components/brand/member-shell";
import { MemberCardCarousel } from "@/components/brand/member-card-carousel";
import { STAMPS } from "@/components/brand/loyalty-card";
import { MemberCardFaces, MemberStatusPanel } from "@/components/brand/member-card-experience";
import { MemberRankLabel, RankEmblem } from "@/components/brand/rank-emblem";
import { EmptyState, ErrorState, LoadingState, SignedOutState } from "@/components/brand/ui";
import { api, errorText, type Sale, formulaLabels } from "@/components/brand/loyalty-api";

export default function CardPage() {
  const qc = useQueryClient();
  const cardKey = getGetMemberCardQueryKey();
  const [visible, setVisible] = useState(true);
  const [nickname, setNickname] = useState("");
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState("");
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    on(); document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  const card = useGetMemberCard({ query: { queryKey: cardKey, refetchInterval: visible ? 2000 : false, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0, retry: false } });
  const updateNickname = useUpdateMemberNickname();
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
  useEffect(() => { if (card.data) setNickname(card.data.nickname ?? ""); }, [card.data?.nickname]);
  const saveNickname = async () => {
    const value = nickname.trim();
    if (value.length < 2 || value.length > 20) { setNicknameMessage("ชื่อเล่นต้องมี 2–20 ตัวอักษร"); return; }
    setNicknameMessage("");
    try {
      const updated = await updateNickname.mutateAsync({ data: { nickname: value } });
      qc.setQueryData(cardKey, updated);
      setNicknameEditing(false);
      setNicknameMessage("บันทึกชื่อเล่นแล้ว");
    } catch (error) { setNicknameMessage(errorText(error)); }
  };

  return <MemberShell signedIn={card.isSuccess}>
    {card.isLoading ? <div className="max-w-xl mx-auto"><LoadingState label="กำลังโหลดบัตรสมาชิก" /></div>
    : card.error && (card.error as {status?: number}).status === 401 ? <div className="max-w-md mx-auto"><SignedOutState /></div>
    : card.isError || !card.data ? <div className="max-w-md mx-auto"><ErrorState message={errorText(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></div>
    : <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr] items-start">
      <div className="space-y-3">
        <header className="card-member-heading rise">
          <div className="member-heading-top">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold">{card.data.nickname || card.data.display_name || "บัตรสมาชิก"}</h1>
              <p className="mt-1 text-xs text-[var(--muted)]">{card.data.display_name} · {card.data.member_code}{card.data.phone_masked ? ` · ${card.data.phone_masked}` : ""}</p>
              <MemberRankLabel earned={card.data.lifetime_earned} />
            </div>
          </div>
        </header>
        {(celebrate || card.data.balance >= STAMPS) && <div role="status" className="gold-alert">ครบ 10 แต้ม! รับขวดแถมฟรี 1 ขวด</div>}
        {confettiKey > 0 && <Confetti key={confettiKey} />}
        <div className={pop ? `card-pop card-pop--${pop % 2}` : undefined}>
          <MemberCardCarousel active="kratom">
            <MemberCardFaces
              kind="kratom"
              memberCode={card.data.member_code}
              balance={card.data.balance}
              popKey={pop}
            />
          </MemberCardCarousel>
        </div>
        <MemberStatusPanel
          kind="kratom"
          memberCode={card.data.member_code}
          balance={card.data.balance}
          qr={{
            value: qr.data?.qr,
            loading: qr.isLoading,
            error: qr.isError ? errorText(qr.error) : undefined,
            retry: () => { void qr.refetch(); },
            retrying: qr.isFetching,
          }}
        />
        <div className="card-bento-grid" aria-label="สรุปแต้มสมาชิก">
          <div className="panel card-bento-stat card-bento-stat--primary"><RankEmblem name="dragon-emperor" size={22} className="card-bento-stat__emblem" /><p>ตอนนี้</p><strong data-testid="text-balance">{card.data.balance}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-stat"><RankEmblem name="diamond-member" size={22} className="card-bento-stat__emblem" /><p>สะสมรวม</p><strong>{card.data.lifetime_earned}</strong><small>แต้ม</small></div>
          <div className="panel card-bento-stat"><RankEmblem name="ultimate-legend" size={22} className="card-bento-stat__emblem" /><p>แลกแล้ว</p><strong>{card.data.lifetime_redeemed}</strong><small>แต้ม</small></div>
        </div>
        <section className="grid gap-3 sm:grid-cols-2" aria-label="ยอดสะสมแยกตามประเภท">
          <article className="panel p-4 border-[rgba(0,255,157,.28)]">
            <p className="eyebrow">KRATOM · ยอดซื้อสะสม</p>
            <div className="mt-2 flex items-end justify-between gap-2"><strong className="font-display text-3xl text-[var(--green)]">{card.data.balance}<small className="ml-1 text-sm font-sans text-[var(--text)]">แต้ม</small></strong><span className="text-xs text-[var(--muted)]">เศษ ฿{card.data.kratom_remainder_baht}/100</span></div>
            <p className="mt-2 text-xs text-[var(--muted)]">ยอดเศษยังทบต่อ · คำนวณแต้มโดยระบบร้าน</p>
          </article>
          <article className="panel p-4 border-[rgba(229,192,74,.27)]">
            <p className="eyebrow">CANNABIS · ยอดซื้อสะสม</p>
            <div className="mt-2 flex items-end justify-between gap-2"><strong className="font-display text-3xl text-[var(--gold-2)]">{card.data.cannabis_balance}<small className="ml-1 text-sm font-sans text-[var(--text)]">แต้ม</small></strong><span className="text-xs text-[var(--muted)]">เศษ {card.data.cannabis_remainder_grams} g / 100</span></div>
            <p className="mt-2 text-xs text-[var(--muted)]">บัตรแยก · แต้มและเศษคงเหลือไม่ปะปนกัน</p>
            <Link href="/card/cannabis" className="mt-3 inline-flex min-h-10 items-center text-sm text-[var(--green)] underline-offset-4 hover:underline" data-testid="link-cannabis-card">เปิดบัตรกัญชา</Link>
          </article>
        </section>
        <section className="panel p-4" aria-labelledby="nickname-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="nickname-title" className="font-display font-semibold">ชื่อเล่นบนบัตร</h2><p className="text-xs text-[var(--muted)]">ใช้ชื่อที่คุณสะดวกให้พนักงานเรียก</p></div>
            {!nicknameEditing && <button type="button" className="btn btn-ghost !min-h-10 !px-4 text-sm" data-testid="button-edit-nickname" onClick={() => setNicknameEditing(true)}>แก้ไข</button>}
          </div>
          {nicknameEditing && <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="member-nickname">ชื่อเล่นสมาชิก</label>
            <input id="member-nickname" data-testid="input-member-nickname" className="input !min-h-11 flex-1" maxLength={20} value={nickname} onChange={(e) => setNickname(e.target.value)} aria-describedby="nickname-help" />
            <button type="button" data-testid="button-save-nickname" className="btn btn-neon !min-h-11" onClick={() => void saveNickname()} disabled={updateNickname.isPending}>{updateNickname.isPending ? "กำลังบันทึก…" : "บันทึกชื่อ"}</button>
            <button type="button" className="btn btn-ghost !min-h-11" onClick={() => { setNickname(card.data?.nickname ?? ""); setNicknameEditing(false); }}>ยกเลิก</button>
          </div>}
          <p id="nickname-help" className="mt-2 text-xs text-[var(--muted)]">2–20 ตัวอักษร · แก้ไขได้ทุกเมื่อ</p>
          {nicknameMessage && <p role="status" className={`mt-2 text-sm ${nicknameMessage.includes("แล้ว") ? "text-[var(--green)]" : "field-error"}`}>{nicknameMessage}</p>}
        </section>
        <Link href="/" className="btn btn-ghost w-full sm:w-auto">กลับหน้าแรกร้าน</Link>
      </div>
      <aside className="space-y-5">
        <section className="panel p-5" aria-labelledby="sales-title">
          <div className="flex items-center justify-between mb-3"><h2 id="sales-title" className="font-display text-lg font-semibold">รายการล่าสุด</h2></div>
          {sales.isLoading ? <div className="space-y-2">{[1,2,3].map(x => <div key={x} className="skeleton h-14" />)}</div>
          : sales.isError ? <ErrorState message={errorText(sales.error)} onRetry={() => sales.refetch()} retrying={sales.isFetching} />
          : !sales.data?.length ? <EmptyState title="ยังไม่มีรายการซื้อ" />
          : <ul className="divide-y divide-[var(--line)] list-none p-0 m-0">{sales.data.slice(0,5).map(s => <li key={s.id} className="py-3 flex gap-3 items-center">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{formulaLabels[s.formula] || s.formula} · {s.bottle_count} ขวด</p><p className="text-xs text-[var(--muted)]">{new Date(s.created_at).toLocaleString("th-TH")}</p></div>
            <div className="text-right shrink-0"><p className="font-mono">฿{s.amount_baht.toLocaleString("th-TH")}</p><p className={`text-xs ${s.points_awarded ? "text-[var(--emerald-2)]" : "text-[var(--muted)]"}`}>{s.points_awarded ? `+${s.points_awarded} แต้ม` : "ยอดเศษทบต่อโดยระบบ"}</p></div>
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
