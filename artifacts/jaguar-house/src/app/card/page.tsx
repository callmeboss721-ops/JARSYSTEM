"use client";

import Link from "next/link";
import {
  useGetMemberCard,
  useListMemberActivity,
  getGetMemberCardQueryKey,
  getListMemberActivityQueryKey,
} from "@workspace/api-client-react";
import { BrandIcon } from "@/components/brand/brand-icon";
import { MemberShell } from "@/components/brand/member-shell";
import { LoyaltyCard, LoyaltyCardSkeleton, STAMPS } from "@/components/brand/loyalty-card";
import { EmptyState, ErrorState, SignedOutState } from "@/components/brand/ui";
import { LIVE, errMessage, errStatus, fmtDate } from "@/components/brand/api-utils";

export default function CardPage() {
  const card = useGetMemberCard({ query: { queryKey: getGetMemberCardQueryKey(), ...LIVE } });
  const signedOut = errStatus(card.error) === 401;
  const authed = card.isSuccess;
  const activity = useListMemberActivity({ query: { queryKey: getListMemberActivityQueryKey(), enabled: authed, ...LIVE } });

  return (
    <MemberShell signedIn={authed}>
      {card.isLoading ? (
        <div className="max-w-xl mx-auto"><LoyaltyCardSkeleton /></div>
      ) : signedOut ? (
        <div className="max-w-md mx-auto"><SignedOutState /></div>
      ) : card.isError || !card.data ? (
        <div className="max-w-md mx-auto"><ErrorState message={errMessage(card.error)} onRetry={() => card.refetch()} retrying={card.isFetching} /></div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] items-start">
          <div className="space-y-5">
            <h1 className="sr-only">บัตรสมาชิกของฉัน</h1>
            <LoyaltyCard card={card.data} />
            <div className="flex flex-col sm:flex-row gap-3">
              {card.data.balance >= STAMPS ? (
                <Link href="/redeem" className="btn btn-neon flex-1" data-testid="link-redeem">แลกรางวัลเลย <BrandIcon name="redeem" tone="inherit" /></Link>
              ) : (
                <button className="btn btn-neon flex-1" disabled aria-disabled="true" data-testid="button-redeem-disabled">
                  สะสมให้ครบ {STAMPS} แต้มเพื่อแลก
                </button>
              )}
              <Link href="/redeem" className="btn btn-ghost" data-testid="link-view-rewards">ดูรางวัลทั้งหมด</Link>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="panel p-4">
                <dt className="text-xs text-[var(--muted)]">สะสมทั้งหมด</dt>
                <dd className="font-display text-2xl font-semibold mt-1 tabular-nums" data-testid="text-lifetime-earned">{card.data.lifetime_earned}</dd>
              </div>
              <div className="panel p-4">
                <dt className="text-xs text-[var(--muted)]">ใช้แลกไปแล้ว</dt>
                <dd className="font-display text-2xl font-semibold mt-1 tabular-nums text-[var(--gold-2)]" data-testid="text-lifetime-redeemed">{card.data.lifetime_redeemed}</dd>
              </div>
            </dl>
            <p className="text-xs text-[var(--muted)]">แจ้งรหัสสมาชิกกับพนักงานที่เคาน์เตอร์เพื่อสะสมแต้ม ข้อมูลอัปเดตอัตโนมัติทุก 15 วินาที</p>
          </div>

          <section aria-labelledby="activity-h" className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="activity-h" className="inline-flex items-center gap-2 font-display text-lg font-semibold"><BrandIcon name="history" tone="gold" />ประวัติแต้ม</h2>
              <span className="eyebrow">Activity</span>
            </div>
            {activity.isLoading ? (
              <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>
            ) : activity.isError ? (
              <ErrorState message={errMessage(activity.error)} onRetry={() => activity.refetch()} retrying={activity.isFetching} />
            ) : !activity.data?.length ? (
              <EmptyState title="ยังไม่มีความเคลื่อนไหว" body="แต้มแรกจะขึ้นที่นี่ทันทีที่พนักงานประทับตราให้" />
            ) : (
              <ul className="divide-y divide-[var(--line)] list-none p-0 m-0" data-testid="list-activity">
                {activity.data.map((t) => {
                  const plus = t.delta >= 0;
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3" data-testid={`row-activity-${t.id}`}>
                      <span className={`grid place-items-center w-9 h-9 rounded-full ${plus ? "bg-[rgba(31,138,100,.14)] text-[var(--emerald-2)]" : "bg-[rgba(217,180,90,.12)] text-[var(--gold-2)]"}`} aria-hidden="true">
                        {plus ? <BrandIcon name="add" tone="inherit" /> : <BrandIcon name="subtract" tone="inherit" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{t.reason}</p>
                        <p className="text-xs text-[var(--muted)] font-mono">{fmtDate(t.created_at)}</p>
                      </div>
                      <span className={`font-mono font-semibold ${plus ? "text-[var(--emerald-2)]" : "text-[var(--gold-2)]"}`}>
                        {plus ? "+" : ""}{t.delta}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </MemberShell>
  );
}
