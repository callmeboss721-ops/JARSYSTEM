"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { EmptyState, ErrorState, LoadingState, Modal, SignedOutState } from "@/components/brand/ui";
import { api, errorText, json, type MemberCardData, type RewardData, type RedemptionData } from "@/components/brand/loyalty-api";

export default function RedeemPage() {
  const qc = useQueryClient();
  const redeemData = useQuery<{ card: MemberCardData; rewards: RewardData[] }>({
    queryKey: ["/api/loyalty/redeem-page"],
    queryFn: async () => {
      const cardRequest = api<MemberCardData>("/api/loyalty/card").then(
        (data) => ({ data } as const),
        (error: unknown) => ({ error } as const),
      );
      const rewardsRequest = api<RewardData[]>("/api/loyalty/rewards").then(
        (data) => ({ data } as const),
        (error: unknown) => ({ error } as const),
      );
      const [cardResult, rewardsResult] = await Promise.all([cardRequest, rewardsRequest]);
      if ("error" in cardResult) throw cardResult.error;
      if ("error" in rewardsResult) throw rewardsResult.error;
      qc.setQueryData(["/api/loyalty/card"], cardResult.data);
      qc.setQueryData(["/api/loyalty/rewards"], rewardsResult.data);
      return { card: cardResult.data, rewards: rewardsResult.data };
    },
    retry: false,
    refetchInterval: 30000,
  });
  const history = useQuery<RedemptionData[]>({
    queryKey: ["/api/loyalty/redemptions"],
    queryFn: () => api("/api/loyalty/redemptions"),
    enabled: redeemData.isSuccess,
    refetchInterval: 15000,
  });
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
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["/api/loyalty/redeem-page"] }),
        qc.invalidateQueries({ queryKey: ["/api/loyalty/card"] }),
        qc.invalidateQueries({ queryKey: ["/api/loyalty/redemptions"] }),
      ]);
    } catch (ex) { setError(errorText(ex)); } finally { setPending(false); }
  };
  if (redeemData.isLoading) return <MemberShell signedIn={false}><LoadingState label="กำลังโหลดแต้มและของรางวัล" /></MemberShell>;
  if ((redeemData.error as {status?:number} | null)?.status === 401) return <MemberShell signedIn={false}><div className="max-w-md mx-auto"><SignedOutState /></div></MemberShell>;
  if (redeemData.isError || !redeemData.data) return <MemberShell signedIn={false}><ErrorState message={errorText(redeemData.error)} onRetry={() => void redeemData.refetch()} retrying={redeemData.isFetching} /></MemberShell>;
  const { card, rewards } = redeemData.data;
  const activeRewards = rewards.filter(r => r.is_active && !r.is_demo);
  const pendingRequests = (history.data ?? []).filter(r => r.status.toLowerCase() === "pending");
  return <MemberShell signedIn>
    <header className="flex flex-wrap items-end justify-between gap-4 mb-7 rise">
      <div><p className="eyebrow">Rewards</p><h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">แลกรางวัล</h1></div>
       <div className="panel px-5 py-3 text-right"><p className="text-xs text-[var(--muted)]">แต้มคงเหลือ</p><p className="font-display text-3xl font-bold text-[var(--gold-2)]">{card.balance}</p></div>
    </header>
     {success && <div role="status" className="redeem-success panel mb-5 p-5 sm:p-6">
       <div className="redeem-success__copy"><p className="eyebrow">Request received</p><h2 className="font-display text-lg font-semibold mt-1">ส่งคำขอ “{success}” แล้ว</h2><p className="text-sm text-[var(--muted)] mt-1">แต้มจะถูกหักเมื่อพนักงานยืนยันการรับของ</p></div>
       <div className="flex flex-wrap gap-2">
         <a className="btn btn-ghost !min-h-11" href="#pending-redemptions">ดูคำขอ</a>
         <button className="btn btn-ghost !min-h-11" onClick={() => setSuccess("")}>ปิด</button>
       </div>
     </div>}
     {card.balance < 10 && <p className="mb-5 rounded-xl border border-[var(--glass-line)] px-4 py-3 text-sm text-[var(--gold-2)]">ต้องมีอย่างน้อย 10 แต้มจึงจะแลกได้ · ขาดอีก {10 - card.balance} แต้ม</p>}
    <div className="grid gap-7 lg:grid-cols-[1.3fr_.7fr] items-start">
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">ของรางวัล</h2>
         {!activeRewards.length ? <EmptyState title="ยังไม่มีรางวัลเปิดให้แลก" body="รายการใหม่จะแสดงที่นี่เมื่อทางร้านเปิดใช้งาน" />
         : <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">{activeRewards.map(r => <li key={r.id} className="redeem-reward panel p-5 flex flex-col gap-3">
          <div className="flex justify-between gap-2"><h3 className="font-display text-lg font-semibold">{r.name}</h3><span className="text-sm text-[var(--gold-2)] whitespace-nowrap">{r.points_cost} แต้ม</span></div>
          {r.description && <p className="text-sm text-[var(--muted)]">{r.description}</p>}
           <button className="btn btn-redeem mt-auto" disabled={card.balance < r.points_cost || card.balance < 10} onClick={() => { setPicked(r); setError(""); }}>
             {card.balance >= r.points_cost && card.balance >= 10 ? "ขอแลกรางวัลนี้" : `ต้องมี ${Math.max(r.points_cost,10)} แต้ม`}
          </button>
        </li>)}</ul>}
      </section>
       <section id="pending-redemptions" className="panel p-5 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><BrandIcon name="pending" tone="gold" />คำขอรอยืนยัน <span className="ml-auto font-mono text-sm">{pendingRequests.length}</span></h2>
         {history.isLoading ? <LoadingState label="กำลังโหลดคำขอ" compact /> : history.isError ? <ErrorState message={errorText(history.error)} onRetry={() => void history.refetch()} retrying={history.isFetching} /> : !pendingRequests.length ? <EmptyState title="ไม่มีคำขอที่รออยู่" body="คำขอแลกรางวัลของคุณจะแสดงที่นี่" />
        : <ul className="space-y-2 list-none p-0 m-0">{pendingRequests.map(r => <li key={r.id} className="rounded-xl border border-[var(--line-2)] p-3"><p className="font-semibold">{r.reward_name}</p><p className="text-xs text-[var(--muted)]">{r.points_spent} แต้ม · {new Date(r.created_at).toLocaleString("th-TH")}</p></li>)}</ul>}
      </section>
    </div>
    <Modal open={!!picked} onClose={() => !pending && setPicked(null)} labelledBy="redeem-confirm">
       {picked && <div className="space-y-5"><p className="eyebrow">Request reward</p><h2 id="redeem-confirm" className="font-display text-2xl font-semibold">ขอแลก “{picked.name}”?</h2><p className="text-sm text-[var(--muted)]">แต้มจะถูกหักเมื่อพนักงานยืนยันการรับของเท่านั้น</p><p className="font-mono text-[var(--gold-2)]">{picked.points_cost} แต้ม · คงเหลือหลังยืนยัน {card.balance - picked.points_cost}</p>{error && <p role="alert" className="field-error">{error}</p>}<div className="flex gap-3"><button className="btn btn-ghost flex-1" onClick={() => setPicked(null)} disabled={pending}>กลับ</button><button className="btn btn-redeem flex-1" onClick={request} disabled={pending}>{pending ? "กำลังส่ง..." : "ยืนยันคำขอ"}</button></div></div>}
    </Modal>
  </MemberShell>;
}
