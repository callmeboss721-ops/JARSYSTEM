"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminSummary,
  useLoginAdmin,
  useLogoutAdmin,
  useFindMember,
  useListPendingRedemptions,
  useAddMemberPoints,
  useConfirmRedemption,
  getGetAdminSummaryQueryKey,
  getFindMemberQueryKey,
  getListPendingRedemptionsQueryKey,
  type Redemption,
} from "@workspace/api-client-react";
import { BrandIcon } from "@/components/brand/brand-icon";
import { JaguarMark } from "@/components/brand/jaguar-mark";
import { EmptyState, ErrorState, Modal } from "@/components/brand/ui";
import { CODE_RE, LIVE, clearAdminCache, errMessage, errStatus, fmtDate } from "@/components/brand/api-utils";

export default function AdminPage() {
  const summary = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), retry: false, ...LIVE } });
  const unauth = errStatus(summary.error) === 401 || errStatus(summary.error) === 403;

  return (
    <div className="min-h-[100dvh]">
      <header className="staff-topline border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(31,138,100,.08),transparent)]">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center min-h-11 gap-3 no-underline text-[var(--text)]">
            <JaguarMark size={30} />
            <span className="font-display font-semibold tracking-[.18em] text-sm text-[var(--gold-2)]">JAGUAR <span className="eyebrow ml-1 inline-flex items-center gap-2 !text-[var(--emerald-2)]"><BrandIcon name="dashboard" tone="emerald" />Staff Desk</span></span>
          </Link>
          {summary.isSuccess && <StaffLogout />}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {summary.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
        ) : unauth ? (
          <PinLogin />
        ) : summary.isError || !summary.data ? (
          <div className="max-w-md mx-auto"><ErrorState message={errMessage(summary.error)} onRetry={() => summary.refetch()} retrying={summary.isFetching} /></div>
        ) : (
          <Tools summary={summary.data} />
        )}
      </main>
    </div>
  );
}

function StaffLogout() {
  const qc = useQueryClient();
  const out = useLogoutAdmin();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {err && <p role="alert" className="text-xs text-[var(--danger)]" data-testid="text-staff-logout-error">{err}</p>}
      <button
        className="btn btn-ghost !min-h-11 !min-w-11 !px-3 text-sm"
        aria-label="ออกจากโหมดพนักงาน"
        disabled={out.isPending}
        onClick={async () => {
          setErr(null);
          try {
            await out.mutateAsync();
          } catch (ex) {
            setErr(`ออกไม่สำเร็จ: ${errMessage(ex)}`);
            return;
          }
          clearAdminCache(qc);
          await qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
        }}
        data-testid="button-staff-logout"
      >
        <BrandIcon name="logout" tone="neutral" /> <span className="hidden sm:inline">ออกจากโหมดพนักงาน</span>
      </button>
    </div>
  );
}

function PinLogin() {
  const qc = useQueryClient();
  const login = useLoginAdmin();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,12}$/.test(pin)) { setErr("PIN เป็นตัวเลข 4–12 หลัก"); return; }
    setErr(null);
    try {
      await login.mutateAsync({ data: { pin } });
      setPin("");
      clearAdminCache(qc);
      await qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() });
    } catch (ex) {
      const s = errStatus(ex);
      setErr(s === 401 || s === 403 ? "PIN ไม่ถูกต้อง" : errMessage(ex));
    }
  };
  return (
    <div className="max-w-sm mx-auto pt-10 rise">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <span className="grid place-items-center w-14 h-14 rounded-2xl border border-[rgba(79,199,154,.4)] bg-[rgba(31,138,100,.1)]"><BrandIcon name="staffAccess" tone="emerald" /></span>
        <p className="eyebrow">Staff only</p>
        <h1 className="font-display text-3xl font-semibold">เข้าสู่โหมดพนักงาน</h1>
      </div>
      <form onSubmit={submit} noValidate className="panel p-6 space-y-5">
        <div className="field">
          <label htmlFor="staff-pin">PIN พนักงาน</label>
          <input
            id="staff-pin" className="input text-center !text-2xl !tracking-[.5em]" type="password" inputMode="numeric" autoComplete="off"
            maxLength={12} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!err} aria-describedby={err ? "pin-err" : undefined} data-testid="input-staff-pin"
          />
          {err && <p id="pin-err" className="field-error" role="alert">{err}</p>}
        </div>
        <button className="btn btn-neon w-full" disabled={login.isPending} data-testid="button-staff-login">
          {login.isPending ? "กำลังตรวจสอบ..." : "ปลดล็อก"}
        </button>
      </form>
    </div>
  );
}

function Tools({ summary }: { summary: { members: number; pending_redemptions: number; points_issued: number } }) {
  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3 rise">
        {[
          ["สมาชิก", summary.members, "text-[var(--text)]"],
          ["รอยืนยัน", summary.pending_redemptions, "text-[var(--gold-2)]"],
          ["แต้มที่ออก", summary.points_issued, "text-[var(--emerald-2)]"],
        ].map(([k, v, c]) => (
          <div key={k as string} className="staff-metric panel p-4 sm:p-5">
            <dt className="text-xs text-[var(--muted)]">{k}</dt>
            <dd className={`font-display text-2xl sm:text-3xl font-bold mt-1 tabular-nums ${c}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <AddPoints />
        <PendingQueue />
      </div>
    </div>
  );
}

function AddPoints() {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [inputErr, setInputErr] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [review, setReview] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addErr, setAddErr] = useState<string | null>(null);
  const add = useAddMemberPoints();
  const member = useFindMember({ code }, { query: { queryKey: getFindMemberQueryKey({ code }), enabled: CODE_RE.test(code), retry: false } });
  // Idempotency key: stable per (member, points) until a confirmed success.
  const idemRef = useRef<{ key: string; id: string } | null>(null);
  const requestIdFor = (memberId: string, pts: number) => {
    const key = `${memberId}:${pts}`;
    if (!idemRef.current || idemRef.current.key !== key) {
      idemRef.current = { key, id: crypto.randomUUID() };
    }
    return idemRef.current.id;
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!CODE_RE.test(input)) { setInputErr("รหัสสมาชิก 6–10 ตัว A–Z / 0–9"); return; }
    setInputErr(null);
    setPoints(null);
    setCode(input);
  };

  const commit = async () => {
    if (!member.data || !points) return;
    setAddErr(null);
    try {
      await add.mutateAsync({ data: { member_id: member.data.id, points, request_id: requestIdFor(member.data.id, points) } });
      idemRef.current = null;
      setMsg(`เพิ่ม ${points} แต้มให้ ${member.data.member_code} แล้ว`);
      setReview(false);
      setPoints(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: getFindMemberQueryKey({ code }) }),
        qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }),
      ]);
    } catch (ex) {
      setAddErr(errMessage(ex, "เพิ่มแต้มไม่สำเร็จ"));
    }
  };

  return (
    <section aria-labelledby="add-h" className="panel p-5 sm:p-6">
      <p className="eyebrow">Stamp a card</p>
      <h2 id="add-h" className="inline-flex items-center gap-2 font-display text-xl font-semibold mt-1 mb-5"><BrandIcon name="memberSearch" tone="neutral" />ประทับแต้ม</h2>
      <form onSubmit={search} className="flex gap-2 items-start" noValidate>
        <div className="field flex-1">
          <label htmlFor="find-code" className="sr-only">รหัสสมาชิก</label>
          <input id="find-code" className="input uppercase" placeholder="รหัสสมาชิก" value={input} maxLength={10} autoComplete="off"
            onChange={(e) => setInput(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
            aria-invalid={!!inputErr} aria-describedby={inputErr ? "find-err" : undefined} data-testid="input-find-code" />
          {inputErr && <p id="find-err" className="field-error" role="alert">{inputErr}</p>}
        </div>
        <button className="btn btn-ghost !min-h-[52px]" aria-label="ค้นหาสมาชิก" data-testid="button-find"><BrandIcon name="search" tone="neutral" /></button>
      </form>

      {msg && <p role="status" className="mt-4 text-sm text-[var(--emerald-2)] rounded-xl border border-[rgba(79,199,154,.35)] bg-[rgba(31,138,100,.1)] px-3 py-2" data-testid="status-points-added">{msg}</p>}

      <div className="mt-5">
        {!code ? (
          <p className="text-sm text-[var(--muted)]">ขอรหัสสมาชิกจากลูกค้า แล้วค้นหาเพื่อประทับแต้ม</p>
        ) : member.isLoading ? (
          <div className="skeleton h-20" />
        ) : member.isError ? (
          errStatus(member.error) === 404
            ? <EmptyState title="ไม่พบสมาชิก" body={`ไม่มีรหัส ${code} ในระบบ`} />
            : <ErrorState message={errMessage(member.error)} onRetry={() => member.refetch()} retrying={member.isFetching} />
        ) : member.data ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[rgba(229,192,74,.35)] bg-[rgba(229,192,74,.04)] p-4 flex items-center justify-between" data-testid="card-found-member">
              <div>
                <p className="font-mono tracking-[.2em] text-[var(--gold-2)]">{member.data.member_code}</p>
                <p className="text-xs text-[var(--muted)] mt-1">สถานะ {member.data.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted)]">คงเหลือ</p>
                <p className="font-display text-3xl font-bold text-[var(--neon)] tabular-nums">{member.data.balance}</p>
              </div>
            </div>
            <fieldset>
              <legend className="text-sm text-[var(--muted)] mb-3">จำนวนแต้ม (1–20)</legend>
              <div className="grid grid-cols-4 min-[400px]:grid-cols-5 gap-2">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" className="pt-btn" aria-pressed={points === n} onClick={() => setPoints(n)} data-testid={`button-points-${n}`}>{n}</button>
                ))}
              </div>
            </fieldset>
            <button className="btn btn-neon w-full" disabled={!points} onClick={() => { setAddErr(null); setReview(true); }} data-testid="button-review-points">
              <BrandIcon name="addPoints" tone="inherit" />ตรวจสอบก่อนประทับ {points ? `+${points}` : ""}
            </button>
          </div>
        ) : null}
      </div>

      <Modal open={review} onClose={() => !add.isPending && setReview(false)} labelledBy="review-h">
        {member.data && points && (
          <div className="space-y-5">
            <p className="eyebrow">Review</p>
            <h2 id="review-h" className="font-display text-2xl font-semibold">เพิ่ม <span className="text-[var(--neon)]">+{points}</span> แต้ม</h2>
            <p className="text-sm">ให้สมาชิก <span className="font-mono text-[var(--gold-2)]">{member.data.member_code}</span> · ยอดใหม่ {member.data.balance + points} แต้ม</p>
            {addErr && <p className="field-error" role="alert">{addErr}</p>}
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={() => setReview(false)} disabled={add.isPending}>แก้ไข</button>
              <button className="btn btn-neon flex-1" onClick={commit} disabled={add.isPending} data-autofocus data-testid="button-confirm-points">
                {add.isPending ? "กำลังบันทึก..." : "ยืนยันประทับ"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

function PendingQueue() {
  const qc = useQueryClient();
  const list = useListPendingRedemptions({ query: { queryKey: getListPendingRedemptionsQueryKey(), ...LIVE } });
  const confirmM = useConfirmRedemption();
  const [target, setTarget] = useState<Redemption | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const rows = (list.data ?? []).filter((r) => r.status.toLowerCase() === "pending");

  const confirm = async () => {
    if (!target) return;
    setErr(null);
    const id = target.id;
    try {
      await confirmM.mutateAsync({ id });
      qc.setQueryData<Redemption[]>(getListPendingRedemptionsQueryKey(), (old) => old?.filter((r) => r.id !== id));
      setMsg(`ยืนยัน ${target.reward_name} ให้ ${target.member_code} แล้ว`);
      setTarget(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListPendingRedemptionsQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }),
        qc.invalidateQueries({ queryKey: getFindMemberQueryKey({ code: target.member_code }) }),
      ]);
    } catch (ex) {
      setErr(errMessage(ex, "ยืนยันไม่สำเร็จ"));
    }
  };

  return (
    <section aria-labelledby="queue-h" className="panel p-5 sm:p-6">
      <p className="eyebrow">Counter queue</p>
      <h2 id="queue-h" className="font-display text-xl font-semibold mt-1 mb-5 flex items-center gap-2">
        <BrandIcon name="redeem" tone="gold" />คำขอแลกรอยืนยัน <span className="ml-auto font-mono text-sm text-[var(--gold-2)]">{rows.length}</span>
      </h2>
      {msg && <p role="status" className="mb-4 text-sm text-[var(--emerald-2)] rounded-xl border border-[rgba(79,199,154,.35)] bg-[rgba(31,138,100,.1)] px-3 py-2">{msg}</p>}
      {list.isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : list.isError ? (
        <ErrorState message={errMessage(list.error)} onRetry={() => list.refetch()} retrying={list.isFetching} />
      ) : rows.length === 0 ? (
        <EmptyState title="คิวว่าง" body="คำขอแลกใหม่จะปรากฏที่นี่อัตโนมัติ" />
      ) : (
        <ul className="space-y-2 list-none p-0 m-0" data-testid="list-pending">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-[var(--line-2)] p-3 flex items-center gap-3" data-testid={`row-queue-${r.id}`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm break-words">{r.reward_name}</p>
                <p className="text-xs text-[var(--muted)] font-mono">{r.member_code} · {r.points_spent} แต้ม · {fmtDate(r.created_at)}</p>
              </div>
              <button className="btn btn-gold !min-h-11 !px-4 shrink-0 text-sm" onClick={() => { setErr(null); setTarget(r); }} data-testid={`button-confirm-${r.id}`}>
                <BrandIcon name="confirm" tone="inherit" />ยืนยัน
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!target} onClose={() => !confirmM.isPending && setTarget(null)} labelledBy="qconfirm-h">
        {target && (
          <div className="space-y-5">
            <p className="eyebrow">Hand over reward</p>
            <h2 id="qconfirm-h" className="font-display text-2xl font-semibold">ยืนยันการแลก?</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-[var(--muted)]">รางวัล</dt><dd>{target.reward_name}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--muted)]">สมาชิก</dt><dd className="font-mono text-[var(--gold-2)]">{target.member_code}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--muted)]">หักแต้ม</dt><dd className="font-mono">{target.points_spent}</dd></div>
            </dl>
            <p className="text-xs text-[var(--muted)]">ตรวจรหัสบนหน้าจอลูกค้าให้ตรงกันก่อนมอบของ แต้มจะถูกหักทันทีที่ยืนยัน</p>
            {err && <p className="field-error" role="alert">{err}</p>}
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={() => setTarget(null)} disabled={confirmM.isPending}>ยกเลิก</button>
              <button className="btn btn-gold flex-1" onClick={confirm} disabled={confirmM.isPending} data-autofocus data-testid="button-confirm-redemption">
                {confirmM.isPending ? "กำลังยืนยัน..." : "ยืนยันและหักแต้ม"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
