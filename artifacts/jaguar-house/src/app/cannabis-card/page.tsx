"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetCannabisMemberCard, getGetCannabisMemberCardQueryKey, type CannabisCard } from "@workspace/api-client-react";
import { MemberShell } from "@/components/brand/member-shell";
import { MemberCardCarousel } from "@/components/brand/member-card-carousel";
import { CollectingTrack, SharedMemberCard } from "@/components/brand/loyalty-card";
import { ErrorState, SignedOutState, EmptyState, LoadingState } from "@/components/brand/ui";
import { api, errorText } from "@/components/brand/loyalty-api";

const CARD_KEY = getGetCannabisMemberCardQueryKey();
const CONFETTI_COLORS = ["#e5c04a", "#f6e09a", "#2fd98a", "#c4cad6", "#b8901f"];

export default function CannabisCardPage() {
  const [visible, setVisible] = useState(true);
  const [popKey, setPopKey] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const previous = useRef<{ member_code: string; balance: number } | null>(null);
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const cardQuery = useGetCannabisMemberCard({
    query: {
      queryKey: CARD_KEY,
      retry: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
      refetchInterval: (query) => query.state.data ? (visible ? 2000 : false) : false,
      refetchIntervalInBackground: false,
    },
  });
  const card = cardQuery.data as CannabisCard | undefined;
  const stampCount = Math.min(Math.max(card?.balance ?? 0, 0), 10);
  const unauthenticated = (cardQuery.error as { status?: number } | null)?.status === 401;
  const qr = useQuery<{ qr: string }>({
    queryKey: ["/api/loyalty/qr", card?.member_code],
    queryFn: () => api("/api/loyalty/qr"),
    enabled: !!card?.member_code,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  useEffect(() => {
    if (!card) return;
    const prev = previous.current;
    previous.current = { member_code: card.member_code, balance: card.balance };
    if (!prev || prev.member_code !== card.member_code) return;
    if (prev.balance === card.balance) return;
    setPopKey((key) => key + 1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prev.balance < 10 && card.balance >= 10) {
      setCelebrate(true);
      if (!reduced) {
        setConfettiKey((key) => key + 1);
        if ("vibrate" in navigator) navigator.vibrate?.([60, 40, 120]);
      }
    } else if (card.balance < 10) {
      setCelebrate(false);
    } else if (card.balance > prev.balance && !reduced && "vibrate" in navigator) {
      navigator.vibrate?.(30);
    }
  }, [card?.member_code, card?.balance]);
  useEffect(() => { if (card && card.balance < 10) setCelebrate(false); }, [card?.balance]);

  return <MemberShell signedIn={cardQuery.isSuccess}>
    {cardQuery.isLoading ? <div className="cannabis-wrap"><LoadingState label="กำลังโหลดบัตรกัญชา" /></div>
      : unauthenticated ? <div className="max-w-md mx-auto"><SignedOutState /></div>
      : cardQuery.isError || !card ? <div className="max-w-md mx-auto"><ErrorState message={errorText(cardQuery.error)} onRetry={() => void cardQuery.refetch()} retrying={cardQuery.isFetching} /></div>
      : <div className="cannabis-wrap">
        <header className="cannabis-heading rise">
          <div className="member-heading-top"><div><p className="eyebrow">MEMBERS CLUB · DIGITAL PASS</p><h1>{card.display_name || "บัตรสมาชิกพลังใบ"}</h1><p>พี่เสือพลังใบ ซุปเปอร์ฮีโร่ของคนไทย</p></div><img src="/brand/jaguar-logo.webp" alt="ตรา JAGUAR KRATOM" width={58} height={58} /></div>
        </header>
        {confettiKey > 0 && <CannabisConfetti key={confettiKey} />}
        {celebrate && <div role="status" className="cannabis-ready cannabis-ready--celebrate">ครบ 10 แสตมป์ — แลกฟรี 1 กรัมได้ที่เคาน์เตอร์</div>}
        <MemberCardCarousel active="cannabis">
          <SharedMemberCard
            key={popKey}
            kind="cannabis"
            memberCode={card.member_code}
            balance={card.balance}
            className={popKey ? "card-pop" : ""}
            qr={{
              value: qr.data?.qr,
              loading: qr.isLoading,
              error: qr.isError ? errorText(qr.error) : undefined,
              retry: () => { void qr.refetch(); },
              retrying: qr.isFetching,
            }}
          />
        </MemberCardCarousel>
        <section className="cannabis-stamps panel" aria-labelledby="cannabis-stamps-title" data-testid="cannabis-stamps">
          <CollectingTrack balance={card.balance} kind="cannabis" titleId="cannabis-stamps-title" />
          <p className="cannabis-stamps__note">สะสมครบ 10 แสตมป์ รับฟรี 1 กรัม</p>
          <div className="cannabis-reward"><span>01</span><p>ซื้อทุก 1 กรัม รับ 1 แสตมป์</p><b>10 แสตมป์ = ฟรี 1 กรัม</b></div>
        </section>
        {card.balance >= 10 && !celebrate && <div className="cannabis-ready" role="status">แสตมป์ครบแล้ว — แจ้งพนักงานเพื่อแลกฟรี 1 กรัม</div>}
        <div className="cannabis-stats">
          <article><span>แสตมป์สะสมตลอดชีพ</span><strong>{card.lifetime_earned}</strong><small>แสตมป์</small></article>
          <article><span>แสตมป์ที่ใช้แลก</span><strong>{card.lifetime_redeemed}</strong><small>ดวงทั้งหมด</small></article>
        </div>
        <section className="cannabis-history panel" aria-labelledby="cannabis-history-title">
          <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Stamp ledger</p><h2 id="cannabis-history-title">รายการล่าสุด</h2></div><span className="cannabis-count">{card.recent_transactions.length} รายการ</span></div>
          {!card.recent_transactions.length ? <EmptyState title="ยังไม่มีรายการสะสม" body="เมื่อซื้อสินค้าที่ร้าน รายการแสตมป์จะปรากฏที่นี่" />
            : <ul>{card.recent_transactions.map((tx) => <li key={tx.id}>
              <span className={`cannabis-delta ${tx.delta < 0 ? "is-out" : ""}`}>{tx.delta > 0 ? `+${tx.delta}` : tx.delta}</span>
              <span className="cannabis-transaction-copy"><strong>{tx.reason}</strong><small>{new Date(tx.created_at).toLocaleString("th-TH")}{tx.grams_purchased > 0 ? ` · ซื้อ ${tx.grams_purchased} กรัม` : ""}</small></span>
              <span className="cannabis-unit">แสตมป์</span>
            </li>)}</ul>}
        </section>
      </div>}
  </MemberShell>;
}

function CannabisConfetti() {
  const bits = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    x: `${((i * 53) % 120) - 60}px`,
    r: `${(i * 97) % 720}deg`,
    d: `${1.8 + ((i * 13) % 14) / 10}s`,
    delay: `${((i * 7) % 10) / 20}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  })), []);
  return <div className="confetti" aria-hidden="true">{bits.map((bit, i) => <i key={i} style={{ left: bit.left, background: bit.color, ["--x" as string]: bit.x, ["--r" as string]: bit.r, ["--d" as string]: bit.d, ["--delay" as string]: bit.delay }} />)}</div>;
}
