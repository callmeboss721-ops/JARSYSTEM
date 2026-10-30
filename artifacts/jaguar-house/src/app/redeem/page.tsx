"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMemberCard,
  useListRewards,
  useListMemberRedemptions,
  useRequestRedemption,
  getGetMemberCardQueryKey,
  getListRewardsQueryKey,
  getListMemberRedemptionsQueryKey,
  type Reward,
} from "@workspace/api-client-react";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { STAMPS } from "@/components/brand/loyalty-card";
import { EmptyState, ErrorState, Modal, SignedOutState } from "@/components/brand/ui";
import { LIVE, errMessage, errStatus, fmtDate, invalidateMember, statusLabel } from "@/components/brand/api-utils";

export default function RedeemPage() {
  const qc = useQueryClient();
  const card = useGetMemberCard({ query: { queryKey: getGetMemberCardQueryKey(), ...LIVE } });
  const authed = card.isSuccess;
  const rewards = useListRewards({ query: { queryKey: getListRewardsQueryKey(), enabled: authed } });
  const history = useListMemberRedemptions({ query: { queryKey: getListMemberRedemptionsQueryKey(), enabled: authed, ...LIVE } });
  const request = useRequestRedemption();

  const [picked, setPicked] = useState<Reward | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [reqErr, setReqErr] = useState<string | null>(null);

  const balance = card.data?.balance ?? 0;
  const pending = (history.data ?? []).filter((r) => r.status.toLowerCase() === "pending");

  const confirm = async () => {
    if (!picked) return;
    setReqErr(null);
    try {
      const r = await request.mutateAsync({ data: { reward_id: picked.id } });
      setDone(r.reward_name);
      setPicked(null);
      await invalidateMember(qc);
    } catch (ex) {
      setReqErr(errMessage(ex, "ส่งคำขอไม่สำเร็จ"));
    }
  };

  if (card.isLoading) {
    return <MemberShell signedIn={false}><div className="space-y-4"><div className="skeleton h-28" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div></MemberShell>;
  }
  if (errStatus(card.error) === 401) {
    return <MemberShell signedIn={false}><div className="max-w-md mx-auto"><SignedOutState /></div></MemberShell>;
  }
  if (card.isError || !card.data) {
    return <MemberShell signedIn={false}><div className="max-w-md mx-auto"><ErrorState message={errMessage(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></div></MemberShell>;
  }

  return (
    <MemberShell signedIn>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8 rise">
        <div>
          <p className="eyebrow">Rewards</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">แลกรางวัล</h1>
        </div>
        <div className="panel px-5 py-3 text-right">
          <p className="inline-flex items-center justify-end gap-2 text-xs text-[var(--muted)]"><BrandIcon name="points" tone="gold" />แต้มคงเหลือ</p>
          <p className="font-display text-3xl font-bold text-[var(--gold-2)] tabular-nums" data-testid="text-redeem-balance">{balance}</p>
        </div>
      </header>

      {done && (
        <div role="status" className="mb-6 flex gap-3 items-start rounded-2xl border border-[rgba(79,199,154,.35)] bg-[rgba(31,138,100,.1)] p-4 rise" data-testid="status-request-sent">
          <BrandIcon name="success" tone="emerald" className="shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">ส่งคำขอแลก “{done}” แล้ว — สถานะรอพนักงานยืนยัน</p>
            <p className="text-[var(--muted)] mt-1">แสดงหน้าจอนี้ที่เคาน์เตอร์ แต้มจะถูกหักเมื่อพนักงานยืนยันเท่านั้น</p>
          </div>
          <button className="ml-auto min-h-11 min-w-11 shrink-0 text-xs text-[var(--muted)] bg-transparent border-0 cursor-pointer" onClick={() => setDone(null)}>ปิด</button>
        </div>
      )}

      {balance < STAMPS && (
        <p className="mb-6 text-sm text-[var(--gold-2)] rounded-xl border border-[rgba(229,192,74,.3)] bg-[rgba(229,192,74,.05)] px-4 py-3" role="note">ต้องมีอย่างน้อย {STAMPS} แต้มจึงจะแลกได้ — ตอนนี้ขาดอีก {STAMPS - balance} แต้ม</p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-start">
        <section aria-labelledby="rewards-h">
          <h2 id="rewards-h" className="inline-flex items-center gap-2 font-display text-lg font-semibold mb-4"><BrandIcon name="rewards" tone="gold" />ของรางวัล</h2>
          {rewards.isLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36" />)}</div>
          ) : rewards.isError ? (
            <ErrorState message={errMessage(rewards.error)} onRetry={() => rewards.refetch()} retrying={rewards.isFetching} />
          ) : !rewards.data?.filter((r) => r.is_active).length ? (
            <EmptyState title="ยังไม่มีรางวัลเปิดให้แลก" body="ทางร้านกำลังเตรียมของรางวัล แวะมาดูใหม่เร็วๆ นี้" />
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
              {rewards.data.filter((r) => r.is_active).map((r, i) => {
                const can = balance >= STAMPS && balance >= r.points_cost;
                return (
                  <li key={r.id} className="panel p-5 flex flex-col gap-3 rise" style={{ animationDelay: `${i * 50}ms` }} data-testid={`card-reward-${r.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display font-semibold text-lg leading-snug">{r.name}</h3>
                      <span className="font-mono text-sm text-[var(--gold-2)] whitespace-nowrap">{r.points_cost} แต้ม</span>
                    </div>
                    {r.description && <p className="text-sm text-[var(--muted)]">{r.description}</p>}
                    <button
                      className="btn btn-neon mt-auto"
                      disabled={!can || request.isPending}
                      onClick={() => { setReqErr(null); setPicked(r); }}
                      data-testid={`button-request-${r.id}`}
                    >
                      {can ? <><BrandIcon name="redeem" tone="inherit" />ขอแลกรางวัลนี้</> : `ต้องมี ${Math.max(r.points_cost, STAMPS)} แต้ม`}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="history-h" className="space-y-6">
          <div className="panel p-5">
            <h2 id="history-h" className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <BrandIcon name="pending" tone="gold" /> รอยืนยัน
              <span className="ml-auto font-mono text-sm text-[var(--gold-2)]">{pending.length}</span>
            </h2>
            {history.isLoading ? <div className="skeleton h-16" /> : history.isError ? (
              <ErrorState message={errMessage(history.error)} onRetry={() => history.refetch()} retrying={history.isFetching} />
            ) : pending.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">ไม่มีคำขอที่รออยู่</p>
            ) : (
              <ul className="space-y-2 list-none p-0 m-0">
                {pending.map((r) => (
                  <li key={r.id} className="rounded-xl border border-[rgba(217,180,90,.3)] p-3 flex items-center gap-3" data-testid={`row-pending-${r.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold break-words">{r.reward_name}</p>
                      <p className="text-xs text-[var(--muted)] font-mono">{fmtDate(r.created_at)} · {r.points_spent} แต้ม</p>
                    </div>
                    <span className="chip chip-pending">รอยืนยัน</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold mb-3"><BrandIcon name="history" tone="gold" />ประวัติการแลก</h2>
            {history.isLoading ? <div className="skeleton h-24" /> : !history.data?.length ? (
              <EmptyState title="ยังไม่เคยแลกรางวัล" body="สะสมครบ 10 ดวงแล้วกลับมาที่นี่" />
            ) : (
              <ul className="divide-y divide-[var(--line)] list-none p-0 m-0" data-testid="list-redemptions">
                {history.data.map((r) => {
                  const s = statusLabel(r.status);
                  return (
                    <li key={r.id} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{r.reward_name}</p>
                        <p className="text-xs text-[var(--muted)] font-mono">{fmtDate(r.created_at)} · {r.points_spent} แต้ม</p>
                      </div>
                      <span className={`chip ${s.cls}`}>{s.th}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Modal open={!!picked} onClose={() => !request.isPending && setPicked(null)} labelledBy="confirm-h">
        {picked && (
          <div className="space-y-5">
            <p className="eyebrow">Confirm request</p>
            <h2 id="confirm-h" className="font-display text-2xl font-semibold">ขอแลก “{picked.name}”?</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--line)] p-3"><dt className="text-[var(--muted)] text-xs">ใช้แต้ม</dt><dd className="font-mono text-lg text-[var(--gold-2)]">{picked.points_cost}</dd></div>
              <div className="rounded-xl border border-[var(--line)] p-3"><dt className="text-[var(--muted)] text-xs">คงเหลือหลังยืนยัน</dt><dd className="font-mono text-lg text-[var(--neon)]">{balance - picked.points_cost}</dd></div>
            </dl>
            <p className="text-sm text-[var(--muted)]">คำขอจะอยู่ในสถานะรอยืนยัน แต้มจะถูกหักเมื่อพนักงานยืนยันที่ร้านเท่านั้น</p>
            {reqErr && <p className="field-error" role="alert">{reqErr}</p>}
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={() => setPicked(null)} disabled={request.isPending}>ยกเลิก</button>
              <button className="btn btn-neon flex-1" onClick={confirm} disabled={request.isPending} data-autofocus data-testid="button-confirm-request">
                {request.isPending ? "กำลังส่ง..." : "ยืนยันคำขอ"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </MemberShell>
  );
}
