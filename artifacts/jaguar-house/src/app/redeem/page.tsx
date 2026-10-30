"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { EmptyState, ErrorState, Modal, SignedOutState } from "@/components/brand/ui";
import { api, errorText, json, type MemberCardData, type RewardData, type RedemptionData } from "@/components/brand/loyalty-api";

export default function RedeemPage() {
  const qc = useQueryClient();
  const card = useQuery<MemberCardData>({ queryKey: ["/api/loyalty/card"], queryFn: () => api("/api/loyalty/card"), retry: false });
  const rewards = useQuery<RewardData[]>({ queryKey: ["/api/loyalty/rewards"], queryFn: () => api("/api/loyalty/rewards"), enabled: card.isSuccess, refetchInterval: 30000 });
  const history = useQuery<RedemptionData[]>({ queryKey: ["/api/loyalty/redemptions"], queryFn: () => api("/api/loyalty/redemptions"), enabled: card.isSuccess, refetchInterval: 15000 });
  const [picked, setPicked] = useState<RewardData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const request = async () => {
    if (!picked) return;
    setPending(true); setError("");
    try {
      const result = await api<RedemptionData>("/api/loyalty/redemptions", json("POST", { reward_id: picked.id }));
      setSuccess(result.reward_name || picked.name); setPicked(null);
      await Promise.all([qc.invalidateQueries({ queryKey: ["/api/loyalty/card"] }), qc.invalidateQueries({ queryKey: ["/api/loyalty/redemptions"] })]);
    } catch (ex) { setError(errorText(ex)); } finally { setPending(false); }
  };
  if (card.isLoading) return <MemberShell signedIn={false}><div className="space-y-4"><div className="skeleton h-24" /><div className="skeleton h-48" /></div></MemberShell>;
  if ((card.error as {status?:number} | null)?.status === 401) return <MemberShell signedIn={false}><div className="max-w-md mx-auto"><SignedOutState /></div></MemberShell>;
  if (card.isError || !card.data) return <MemberShell signedIn={false}><ErrorState message={errorText(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></MemberShell>;
  const activeRewards = (rewards.data ?? []).filter(r => r.is_active);
  const pendingRequests = (history.data ?? []).filter(r => r.status.toLowerCase() === "pending");
  return <MemberShell signedIn>
    <header className="flex flex-wrap items-end justify-between gap-4 mb-7 rise">
      <div><p className="eyebrow">Rewards</p><h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">แลกรางวัล</h1></div>
      <div className="panel px-5 py-3 text-right"><p className="text-xs text-[var(--muted)]">แต้มคงเหลือ</p><p className="font-display text-3xl font-bold text-[var(--gold-2)]">{card.data.balance}</p></div>
    </header>
    {success && <div role="status" className="mb-5 rounded-2xl border border-[rgba(47,217,138,.4)] bg-[rgba(47,217,138,.09)] p-4 text-sm"><strong>ส่งคำขอแลก “{success}” แล้ว</strong><p className="text-[var(--muted)] mt-1">แสดงหน้านี้ที่เคาน์เตอร์ พนักงานจะยืนยันการรับของ</p><button className="btn btn-ghost mt-3 !min-h-10 !px-4" onClick={() => setSuccess("")}>ปิดข้อความ</button></div>}
    {card.data.balance < 10 && <p className="mb-5 rounded-xl border border-[var(--glass-line)] px-4 py-3 text-sm text-[var(--gold-2)]">ต้องมีอย่างน้อย 10 แต้มจึงจะแลกได้ · ขาดอีก {10 - card.data.balance} แต้ม</p>}
    <div className="grid gap-7 lg:grid-cols-[1.3fr_.7fr] items-start">
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">ของรางวัล</h2>
        {rewards.isLoading ? <div className="grid sm:grid-cols-2 gap-3">{[1,2].map(x => <div className="skeleton h-40" key={x} />)}</div>
        : rewards.isError ? <ErrorState message={errorText(rewards.error)} onRetry={() => rewards.refetch()} retrying={rewards.isFetching} />
        : !activeRewards.length ? <EmptyState title="ยังไม่มีรางวัลเปิดให้แลก" body="รายการใหม่จะแสดงที่นี่เมื่อทางร้านเปิดใช้งาน" />
        : <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">{activeRewards.map(r => <li key={r.id} className="panel p-5 flex flex-col gap-3">
          <div className="flex justify-between gap-2"><h3 className="font-display text-lg font-semibold">{r.name}</h3><span className="text-sm text-[var(--gold-2)] whitespace-nowrap">{r.points_cost} แต้ม</span></div>
          {r.description && <p className="text-sm text-[var(--muted)]">{r.description}</p>}
          <button className="btn btn-redeem mt-auto" disabled={card.data.balance < r.points_cost || card.data.balance < 10} onClick={() => { setPicked(r); setError(""); }}>
            {card.data.balance >= r.points_cost && card.data.balance >= 10 ? "ขอแลกรางวัลนี้" : `ต้องมี ${Math.max(r.points_cost,10)} แต้ม`}
          </button>
        </li>)}</ul>}
      </section>
      <section className="panel p-5">
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><BrandIcon name="pending" tone="gold" />คำขอรอยืนยัน <span className="ml-auto font-mono text-sm">{pendingRequests.length}</span></h2>
        {history.isLoading ? <div className="skeleton h-16" /> : history.isError ? <ErrorState message={errorText(history.error)} onRetry={() => history.refetch()} retrying={history.isFetching} /> : !pendingRequests.length ? <p className="text-sm text-[var(--muted)]">ไม่มีคำขอที่รออยู่</p>
        : <ul className="space-y-2 list-none p-0 m-0">{pendingRequests.map(r => <li key={r.id} className="rounded-xl border border-[var(--line-2)] p-3"><p className="font-semibold">{r.reward_name}</p><p className="text-xs text-[var(--muted)]">{r.points_spent} แต้ม · {new Date(r.created_at).toLocaleString("th-TH")}</p></li>)}</ul>}
      </section>
    </div>
    <Modal open={!!picked} onClose={() => !pending && setPicked(null)} labelledBy="redeem-confirm">
      {picked && <div className="space-y-5"><p className="eyebrow">Request reward</p><h2 id="redeem-confirm" className="font-display text-2xl font-semibold">ขอแลก “{picked.name}”?</h2><p className="text-sm text-[var(--muted)]">แต้มจะถูกหักเมื่อพนักงานยืนยันการรับของเท่านั้น</p><p className="font-mono text-[var(--gold-2)]">{picked.points_cost} แต้ม · คงเหลือหลังยืนยัน {card.data.balance - picked.points_cost}</p>{error && <p role="alert" className="field-error">{error}</p>}<div className="flex gap-3"><button className="btn btn-ghost flex-1" onClick={() => setPicked(null)} disabled={pending}>กลับ</button><button className="btn btn-redeem flex-1" onClick={request} disabled={pending}>{pending ? "กำลังส่ง..." : "ยืนยันคำขอ"}</button></div></div>}
    </Modal>
  </MemberShell>;
}
