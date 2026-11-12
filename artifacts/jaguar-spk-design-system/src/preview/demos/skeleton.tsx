import { Skeleton } from "../../components/ui/skeleton";

export function SkeletonDemo() {
  return (
    <div className="ds-skeleton-grid">
      <section className="ds-glass ds-skeleton-card" aria-busy="true" aria-label="กำลังโหลดบัตรสมาชิก">
        <span className="ds-type-label">MEMBER CARD · LOADING</span>
        <div className="ds-skeleton-card__identity"><Skeleton className="h-11 w-11 rounded-full" /><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-2 h-3 w-20" /></div></div>
        <Skeleton className="mt-7 h-8 w-28" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <div className="ds-skeleton-slots">{Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="aspect-square rounded-full" />)}</div>
      </section>
      <section className="ds-glass ds-skeleton-list" aria-busy="true" aria-label="กำลังโหลดรายการ">
        <span className="ds-type-label">LIST · PLACEHOLDER</span>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="ds-skeleton-row"><Skeleton className="h-9 w-9 rounded-xl" /><div><Skeleton className="h-3 w-36" /><Skeleton className="mt-2 h-3 w-24" /></div><Skeleton className="ml-auto h-5 w-12" /></div>
        ))}
      </section>
    </div>
  );
}
