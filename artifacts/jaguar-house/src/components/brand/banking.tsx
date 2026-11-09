"use client";

import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Building2, CircleAlert, LockKeyhole, Plus, RefreshCw } from "lucide-react";
import {
  getGetOwnerBankingQueryKey,
  getGetStaffBankingQueryKey,
  useCreateOwnerBankAccount,
  useGetOwnerBanking,
  useGetStaffBanking,
  useRecordStaffBankTransfer,
  useSelectOwnerBankAccountForToday,
  useUpdateOwnerBankAccount,
  type BankAccount,
  type BankAccountInput,
  type BankAccountUpdateInput,
  type BankTransferInput,
} from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/brand/ui";
import { errorText } from "@/components/brand/loyalty-api";

const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => new Date(value).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
const numberInput = (value: string) => /^[0-9]+(?:\.[0-9]{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 100_000_000;
const validLimit = (value: string) => /^[0-9]+(?:\.[0-9]{1,2})?$/.test(value) && Number(value) > 0 && Number(value) <= 100_000_000;

function DailyLedger({ today }: { today: { business_date: string; account: BankAccount | null; received_total: number; sent_total: number; daily_limit: number | null; remaining_limit: number | null; over_limit: boolean; transfers: { id: string; direction: "in" | "out"; amount: number; note: string; recorded_by: "staff" | "owner"; created_at: string }[] } }) {
  const remaining = today.remaining_limit ?? 0;
  const percent = today.daily_limit ? (today.received_total / today.daily_limit) * 100 : 0;
  return <section className="bank-ledger panel p-4 sm:p-6" aria-labelledby="bank-ledger-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="eyebrow">Transfer ledger · {today.business_date}</p><h2 id="bank-ledger-title" className="font-display text-xl font-semibold mt-1">รายการโอนวันนี้</h2></div>
      <span className="bank-ledger-count">{today.transfers.length} รายการ</span>
    </div>
    <div className="bank-summary-grid mt-4">
      <div><span>รับเข้า</span><strong>{money(today.received_total)}</strong></div>
      <div><span>โอนออก</span><strong>{money(today.sent_total)}</strong></div>
      <div className={today.over_limit ? "is-over" : ""}><span>{today.over_limit ? "เกินวงเงินรับเข้า" : "เหลือวงเงินรับเข้า"}</span><strong>{today.daily_limit == null ? "ไม่กำหนด" : money(today.over_limit ? Math.abs(remaining) : remaining)}</strong></div>
    </div>
    {today.daily_limit != null && <div className={`bank-limit mt-4 ${today.over_limit ? "is-over" : ""}`}>
      <div className="flex justify-between gap-3 text-xs"><span>วงเงินรับเข้าประจำวัน · {money(today.daily_limit)}</span><span>{Math.round(percent)}%</span></div>
      <div className="bank-limit-track mt-2" aria-label={`ใช้วงเงินรับเข้า ${Math.round(percent)} เปอร์เซ็นต์`}><span style={{ transform: `scaleX(${Math.min(100, percent) / 100})` }} /></div>
      {today.over_limit && <p className="bank-over-note mt-2"><CircleAlert size={15} aria-hidden="true" /> เกินวงเงินแล้ว · บันทึกรายการที่เกิดขึ้นจริงได้ตามปกติ</p>}
    </div>}
    {!today.transfers.length ? <div className="mt-4"><EmptyState title="ยังไม่มีรายการโอนวันนี้" body="รายการที่บันทึกแล้วจะแสดงในบัญชีนี้โดยแก้ไขหรือลบไม่ได้" /></div> :
      <ol className="bank-transfers mt-4">{today.transfers.map((transfer) => <li key={transfer.id}>
        <span className={`bank-direction ${transfer.direction === "in" ? "is-in" : "is-out"}`}>{transfer.direction === "in" ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}</span>
        <div className="min-w-0 flex-1"><p className="font-semibold">{transfer.direction === "in" ? "เงินเข้า" : "เงินออก"}{transfer.note ? ` · ${transfer.note}` : ""}</p><p className="text-xs text-[var(--muted)]">{dateTime(transfer.created_at)} · {transfer.recorded_by === "staff" ? "พนักงาน" : "เจ้าของร้าน"}</p></div>
        <strong className={`bank-transfer-amount ${transfer.direction === "in" ? "is-in" : "is-out"}`}>{transfer.direction === "in" ? "+" : "−"}{money(transfer.amount)}</strong>
      </li>)}</ol>}
    <p className="bank-immutable mt-4"><LockKeyhole size={14} aria-hidden="true" /> บันทึกถาวร · รายการโอนแก้ไขหรือลบไม่ได้</p>
  </section>;
}

export function StaffBanking() {
  const qc = useQueryClient();
  const query = useGetStaffBanking({ query: { queryKey: getGetStaffBankingQueryKey(), refetchInterval: 15000 } });
  const recordTransfer = useRecordStaffBankTransfer();
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestRef = useRef<{ signature: string; id: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(""); setError("");
    if (!numberInput(amount)) { setError("กรอกยอดมากกว่า 0 ไม่เกิน 100,000,000 บาท และทศนิยมไม่เกิน 2 ตำแหน่ง"); return; }
    const signature = JSON.stringify([direction, amount.trim(), note.trim()]);
    const request = requestRef.current?.signature === signature ? requestRef.current : { signature, id: crypto.randomUUID() };
    requestRef.current = request;
    const data: BankTransferInput = { direction, amount: amount.trim(), note: note.trim() || undefined, request_id: request.id };
    try {
      await recordTransfer.mutateAsync({ data });
      requestRef.current = null;
      setAmount(""); setNote("");
      setMessage(direction === "in" ? "บันทึกรับเงินเรียบร้อย" : "บันทึกเงินออกเรียบร้อย");
      await qc.invalidateQueries({ queryKey: getGetStaffBankingQueryKey() });
    } catch (cause) { setError(`${errorText(cause)} · ตรวจสอบยอดก่อนลองบันทึกซ้ำ`); }
  };

  if (query.isLoading) return <section className="panel p-5"><LoadingState label="กำลังโหลดบัญชีและรายการโอน" /></section>;
  if (query.isError) return <ErrorState message={errorText(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  const today = query.data?.today;
  if (!today) return <section className="panel p-5"><EmptyState title="ยังไม่มีข้อมูลบัญชี" body="ติดต่อเจ้าของร้านเพื่อตั้งค่าบัญชีรับเงินประจำวัน" /></section>;

  return <div className="bank-layout">
    <section className="bank-account-card panel p-5 sm:p-6">
      <p className="eyebrow">Counter banking</p><h2 className="font-display text-xl font-semibold mt-1">บัญชีรับเงินวันนี้</h2>
      {today.account ? <div className="bank-account-details mt-4">
        <div className="flex items-center gap-3"><span className="bank-building"><Building2 size={21} aria-hidden="true" /></span><div className="min-w-0"><p className="font-semibold break-words">{today.account.bank_name}</p><p className="text-sm text-[var(--muted)] break-words">{today.account.account_holder}</p></div></div>
        <p className="bank-account-number mt-4" aria-label={`เลขบัญชี ${today.account.account_number}`}>{today.account.account_number}</p>
        <p className="text-xs text-[var(--muted)] mt-2">แสดงเลขบัญชีเต็มสำหรับใช้ชำระเงิน</p>
      </div> : <div className="mt-4"><EmptyState title="ยังไม่ได้เลือกบัญชีวันนี้" body="แจ้งเจ้าของร้านให้เลือกบัญชีรับเงินก่อนเริ่มรับโอน" /></div>}
      <form className="bank-transfer-form mt-5" onSubmit={submit} noValidate>
        <fieldset><legend className="field-label">ประเภทรายการ</legend><div className="bank-direction-select">
          <button type="button" aria-pressed={direction === "in"} onClick={() => setDirection("in")}><ArrowDownLeft size={17} aria-hidden="true" />รับเข้า</button>
          <button type="button" aria-pressed={direction === "out"} onClick={() => setDirection("out")}><ArrowUpRight size={17} aria-hidden="true" />โอนออก</button>
        </div></fieldset>
        <div className="field"><label htmlFor="staff-transfer-amount">จำนวนเงิน (บาท)</label><input id="staff-transfer-amount" className="input" type="text" inputMode="decimal" autoComplete="off" placeholder="เช่น 850" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
        <div className="field"><label htmlFor="staff-transfer-note">หมายเหตุ <span className="text-[var(--muted)]">(ไม่บังคับ)</span></label><input id="staff-transfer-note" className="input" type="text" maxLength={160} value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ค่าสินค้า / คืนเงิน" /></div>
        {direction === "in" && <p className="bank-limit-help">วงเงินเป็นขีดจำกัดสำหรับยอดรับเข้าเท่านั้น หากยอดจริงเกินวงเงิน ให้บันทึกยอดจริงตามปกติ</p>}
        {message && <p role="status" className="bank-feedback is-success">{message}</p>}
        {error && <p role="alert" className="field-error">{error}</p>}
        <button className="btn btn-neon w-full" disabled={!today.account || recordTransfer.isPending}>{recordTransfer.isPending ? "กำลังบันทึก…" : direction === "in" ? "บันทึกรับเงิน" : "บันทึกเงินออก"}</button>
      </form>
    </section>
    <DailyLedger today={today} />
  </div>;
}

const blankAccount: BankAccountInput = { bank_name: "", account_number: "", account_holder: "", daily_limit: "" };

function AccountFields({ prefix, value, onChange }: { prefix: string; value: BankAccountInput; onChange: (value: BankAccountInput) => void }) {
  const set = (key: keyof BankAccountInput, next: string) => onChange({ ...value, [key]: next });
  return <div className="grid gap-3 sm:grid-cols-2">
    <div className="field"><label htmlFor={`${prefix}-bank`}>ธนาคาร</label><input id={`${prefix}-bank`} className="input" value={value.bank_name} onChange={(e) => set("bank_name", e.target.value)} maxLength={80} required /></div>
    <div className="field"><label htmlFor={`${prefix}-holder`}>ชื่อบัญชี</label><input id={`${prefix}-holder`} className="input" value={value.account_holder} onChange={(e) => set("account_holder", e.target.value)} maxLength={100} required /></div>
    <div className="field"><label htmlFor={`${prefix}-number`}>เลขบัญชี</label><input id={`${prefix}-number`} className="input" value={value.account_number} onChange={(e) => set("account_number", e.target.value.replace(/[^0-9 -]/g, ""))} inputMode="numeric" maxLength={24} required /></div>
    <div className="field"><label htmlFor={`${prefix}-limit`}>วงเงินรับเข้าต่อวัน (บาท)</label><input id={`${prefix}-limit`} className="input" value={value.daily_limit} onChange={(e) => set("daily_limit", e.target.value)} inputMode="decimal" placeholder="เช่น 50000" required /></div>
  </div>;
}

export function OwnerBanking() {
  const qc = useQueryClient();
  const query = useGetOwnerBanking({ query: { queryKey: getGetOwnerBankingQueryKey(), refetchInterval: 15000 } });
  const createAccount = useCreateOwnerBankAccount();
  const updateAccount = useUpdateOwnerBankAccount();
  const selectAccount = useSelectOwnerBankAccountForToday();
  const [draft, setDraft] = useState<BankAccountInput>(blankAccount);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BankAccountUpdateInput | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: getGetOwnerBankingQueryKey() });
  const validAccount = (data: BankAccountInput) => Boolean(data.bank_name.trim() && data.account_holder.trim() && /^[0-9]{6,20}$/.test(data.account_number.replace(/[\s-]/g, "")) && validLimit(data.daily_limit));
  const create = async (event: FormEvent) => {
    event.preventDefault(); setNotice(""); setError("");
    if (!validAccount(draft)) { setError("กรอกข้อมูลบัญชีให้ครบ และระบุเลขบัญชีกับวงเงินให้ถูกต้อง"); return; }
    try { await createAccount.mutateAsync({ data: { ...draft, bank_name: draft.bank_name.trim(), account_holder: draft.account_holder.trim(), account_number: draft.account_number.replace(/\s|-/g, "") } }); setDraft(blankAccount); setNotice("เพิ่มบัญชีเรียบร้อย"); await refresh(); }
    catch (cause) { setError(errorText(cause)); }
  };
  const beginEdit = (account: BankAccount) => {
    setEditing(account.id);
    setEditDraft({ bank_name: account.bank_name, account_number: account.account_number, account_holder: account.account_holder, daily_limit: String(account.daily_limit), is_active: account.is_active });
  };
  const saveEdit = async (event: FormEvent) => {
    event.preventDefault(); if (!editing || !editDraft) return;
    setNotice(""); setError("");
    if (!validAccount(editDraft)) { setError("ตรวจสอบข้อมูลบัญชีและวงเงินอีกครั้ง"); return; }
    try { await updateAccount.mutateAsync({ id: editing, data: { ...editDraft, bank_name: editDraft.bank_name.trim(), account_holder: editDraft.account_holder.trim(), account_number: editDraft.account_number.replace(/\s|-/g, "") } }); setEditing(null); setEditDraft(null); setNotice("อัปเดตบัญชีเรียบร้อย"); await refresh(); }
    catch (cause) { setError(errorText(cause)); }
  };
  const selectToday = async (id: string) => {
    setPendingId(id); setNotice(""); setError("");
    try { await selectAccount.mutateAsync({ id }); setNotice("เลือกบัญชีรับเงินวันนี้แล้ว"); await refresh(); }
    catch (cause) { setError(errorText(cause)); }
    finally { setPendingId(""); }
  };

  if (query.isLoading) return <section className="panel p-5"><LoadingState label="กำลังโหลดบัญชีและบัญชีแยกประเภท" /></section>;
  if (query.isError) return <ErrorState message={errorText(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  const data = query.data;
  if (!data) return null;
  const locked = data.today.transfers.length > 0;

  return <div className="space-y-5">
    <div className="bank-owner-layout">
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">Account directory</p><h2 className="font-display text-xl font-semibold mt-1 mb-4">บัญชีธนาคาร</h2>
        {!data.accounts.length ? <div className="mb-4"><EmptyState title="ยังไม่มีบัญชีธนาคาร" body="เพิ่มบัญชีรับเงินของร้านเพื่อเลือกใช้ในแต่ละวัน" /></div> :
          <ul className="bank-account-list">{data.accounts.map((account) => {
            const isToday = data.today.account?.id === account.id;
            return <li key={account.id} className={`bank-account-row ${isToday ? "is-today" : ""}`}>
              {editing === account.id && editDraft ? <form className="space-y-4" onSubmit={saveEdit}>
                <AccountFields prefix={`edit-${account.id}`} value={editDraft} onChange={(value) => setEditDraft({ ...value, is_active: editDraft.is_active })} />
                <label className="bank-checkbox"><input type="checkbox" checked={editDraft.is_active} onChange={(e) => setEditDraft({ ...editDraft, is_active: e.target.checked })} />เปิดให้เลือกเป็นบัญชีรายวัน</label>
                <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setEditDraft(null); }}>ยกเลิก</button><button className="btn btn-neon" disabled={updateAccount.isPending}>{updateAccount.isPending ? "กำลังบันทึก…" : "บันทึกบัญชี"}</button></div>
              </form> : <>
                <div className="flex items-start gap-3"><span className="bank-building"><Building2 size={20} aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{account.bank_name}</h3>{isToday && <span className="bank-chip">บัญชีวันนี้</span>}{!account.is_active && <span className="bank-chip is-muted">ปิดใช้งาน</span>}</div><p>{account.account_holder}</p><p className="bank-number">{account.account_number}</p><p className="bank-limit-label">วงเงินรับเข้า · {money(account.daily_limit)} / วัน</p></div></div>
                <div className="bank-account-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => beginEdit(account)}>แก้ไขข้อมูล</button>
                  <button type="button" className={`btn ${isToday ? "bank-selected-button" : "btn-gold"}`} disabled={!account.is_active || (locked && !isToday) || selectAccount.isPending} title={locked && !isToday ? "มีรายการโอนแล้ว จึงเปลี่ยนบัญชีวันนี้ไม่ได้" : undefined} onClick={() => void selectToday(account.id)}>{pendingId === account.id ? "กำลังเลือก…" : isToday ? "เลือกสำหรับวันนี้" : locked ? "ล็อกแล้ววันนี้" : "ใช้วันนี้"}</button>
                </div>
              </>}
            </li>;
          })}</ul>}
        {locked && <p className="bank-lock-note mt-4"><LockKeyhole size={15} aria-hidden="true" /> วันนี้มีรายการโอนแล้ว จึงเปลี่ยนบัญชีรับเงินวันนี้ไม่ได้</p>}
      </section>
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">New account</p><h2 className="font-display text-xl font-semibold mt-1 mb-4">เพิ่มบัญชี</h2>
        <form className="space-y-4" onSubmit={create}><AccountFields prefix="new-account" value={draft} onChange={setDraft} />
          <button className="btn btn-neon w-full" disabled={createAccount.isPending}><Plus size={17} aria-hidden="true" />{createAccount.isPending ? "กำลังเพิ่มบัญชี…" : "เพิ่มบัญชีธนาคาร"}</button>
        </form>
      </section>
    </div>
    {notice && <p role="status" className="bank-feedback is-success">{notice}</p>}
    {error && <p role="alert" className="bank-feedback is-error">{error}</p>}
    <div className="flex justify-end"><button type="button" className="btn btn-ghost !min-h-10 !text-sm" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={15} aria-hidden="true" />{query.isFetching ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}</button></div>
    <DailyLedger today={data.today} />
  </div>;
}

