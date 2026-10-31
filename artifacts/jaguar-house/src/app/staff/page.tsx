"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JaguarMark } from "@/components/brand/jaguar-mark";
import { EmptyState, ErrorState } from "@/components/brand/ui";
import { PinPad } from "@/components/brand/pin-pad";
import { STAMPS } from "@/components/brand/loyalty-card";
import { STAFF, api, bundlePrice, cleanCode, clearScope, codePattern, errorText, formulaLabels, isBottleCount, json, statusOf, type Formula, type MemberCardData, type RedemptionData } from "@/components/brand/loyalty-api";
import { getGetCannabisMemberCardQueryKey, getGetStaffCannabisCardQueryKey, useGetStaffCannabisCard, useAddCannabisStamps, useRedeemCannabisAtCounter } from "@workspace/api-client-react";

type Tab = "counter" | "members" | "open" | "settings";
const TABS: [Tab, string][] = [["counter", "ขาย / แลก"], ["members", "สมาชิก"], ["open", "เปิดบัญชี"], ["settings", "ตั้งค่า PIN"]];
const formulaShort: Record<Formula, string> = { red: "แดง · Original", silver: "ฟ้า · Refresh", gold: "ทอง · Premium" };

export default function StaffPage() {
  const qc = useQueryClient();
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("counter");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [lookup, setLookup] = useState("");
  const [member, setMember] = useState<MemberCardData | null>(null);
  const [bottleCount, setBottleCount] = useState("");
  const [bottleCountErr, setBottleCountErr] = useState("");
  const [formula, setFormula] = useState<Formula>("red");
  const [redeemId, setRedeemId] = useState<string | null>(null);
  const [name, setName] = useState(""), [code, setCode] = useState(""), [phone, setPhone] = useState("");
  const [oldPin, setOldPin] = useState(""), [newPin, setNewPin] = useState("");
  const [search, setSearch] = useState(""), [query, setQuery] = useState("");
  const [scanError, setScanError] = useState(""), [scanning, setScanning] = useState(false);
  const [counterMode, setCounterMode] = useState<"kratom" | "cannabis">("kratom");
  const [cannabisSearch, setCannabisSearch] = useState("");
  const [cannabisLookup, setCannabisLookup] = useState("");
  const [grams, setGrams] = useState("");
  const [gramsError, setGramsError] = useState("");
  const [cannabisRedeemId, setCannabisRedeemId] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const cannabisStampRequest = useRef<{ signature: string; id: string } | null>(null);

  const security = useQuery<{ default_pin: boolean }>({ queryKey: [`${STAFF}/security`], queryFn: () => api(`${STAFF}/security`), enabled: auth === true });
  const queue = useQuery<RedemptionData[]>({ queryKey: [`${STAFF}/redemptions`], queryFn: () => api(`${STAFF}/redemptions`), enabled: auth === true, refetchInterval: 12000 });
  const members = useQuery<MemberCardData[]>({ queryKey: [`${STAFF}/members`, query], queryFn: () => api(`${STAFF}/members?q=${encodeURIComponent(query)}`), enabled: auth === true && tab === "members" });
  const visibleMembers = (members.data ?? []).filter((m) => !m.is_demo);
  const cannabisParams = cannabisLookup.startsWith("JAGUAR1:")
    ? { qr_token: cannabisLookup }
    : cannabisLookup ? { code: cleanCode(cannabisLookup) } : undefined;
  const cannabisCardQueryKey = getGetStaffCannabisCardQueryKey(cannabisParams);
  const cannabisCardQuery = useGetStaffCannabisCard(cannabisParams, {
    query: { enabled: auth === true && tab === "counter" && counterMode === "cannabis" && !!cannabisLookup, queryKey: cannabisCardQueryKey, retry: false },
  });
  const cannabisCard = cannabisCardQuery.data;
  const addCannabisStamps = useAddCannabisStamps();
  const redeemCannabis = useRedeemCannabisAtCounter();

  useEffect(() => {
    void api(`${STAFF}/security`).then(() => setAuth(true)).catch((e) => {
      const s = statusOf(e);
      if (s !== 401 && s !== 403) setErr(errorText(e));
      setAuth(false);
    });
    const scan = new URLSearchParams(location.search).get("scan");
    if (scan) { setLookup(scan); history.replaceState(null, "", "/staff"); }
    return () => controls.current?.stop();
  }, []);

  const signOutLocal = () => { setAuth(false); setMember(null); clearScope(qc, "staff"); };
  const login = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,12}$/.test(pin)) { setErr("PIN พนักงานเป็นตัวเลข 4–12 หลัก"); return; }
    setBusy(true); setErr("");
    try { await api(`${STAFF}/login`, json("POST", { pin })); setPin(""); setAuth(true); }
    catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const saleRequest = useRef<{ signature: string; id: string } | null>(null);
  const logout = async () => {
    try {
      await api(`${STAFF}/logout`, json("POST"));
      saleRequest.current = null;
      signOutLocal(); setMsg("");
    } catch (e) { setErr(errorText(e)); }
  };
  const find = async (value = lookup) => {
    setErr(""); setMsg(""); setMember(null); setRedeemId(null);
    try {
      const endpoint = value.startsWith("JAGUAR1:") ? `${STAFF}/member?qr_token=${encodeURIComponent(value)}` : `${STAFF}/member?code=${encodeURIComponent(cleanCode(value))}`;
      const result = await api<MemberCardData>(endpoint);
      if (result.is_demo) { setErr("ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง"); return; }
      setMember(result);
    } catch (e) { setErr(errorText(e)); }
  };
  const lookupCannabis = (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg(""); setCannabisRedeemId(null); setCannabisLookup(cannabisSearch.trim());
  };
  const recordCannabis = async (e: FormEvent) => {
    e.preventDefault();
    if (!cannabisCard) return;
    if (!/^\d+$/.test(grams.trim()) || !Number.isSafeInteger(Number(grams)) || Number(grams) < 1 || Number(grams) > 999) {
      setGramsError("กรอกจำนวนกรัมเป็นจำนวนเต็ม 1–999"); return;
    }
    setGramsError(""); setErr(""); setMsg("");
    const signature = JSON.stringify([cannabisCard.member_code, Number(grams)]);
    const request = cannabisStampRequest.current?.signature === signature
      ? cannabisStampRequest.current
      : { signature, id: crypto.randomUUID() };
    cannabisStampRequest.current = request;
    try {
      await addCannabisStamps.mutateAsync({ data: { member_code: cannabisCard.member_code, grams: Number(grams), request_id: request.id } });
      cannabisStampRequest.current = null;
      setGrams("");
      setMsg(`บันทึกซื้อ ${Number(grams)} กรัม · เพิ่ม ${Number(grams)} แต้ม`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetCannabisMemberCardQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetStaffCannabisCardQueryKey(cannabisParams) }),
      ]);
    } catch (e) { setErr(errorText(e)); }
  };
  const confirmCannabisRedeem = async () => {
    if (!cannabisCard || !cannabisRedeemId || cannabisCard.balance < 10) return;
    setErr(""); setMsg("");
    try {
      await redeemCannabis.mutateAsync({ data: { member_code: cannabisCard.member_code, request_id: cannabisRedeemId } });
      setCannabisRedeemId(null);
      setMsg("แลกฟรี 1 กรัมเรียบร้อย · หัก 10 แต้มแล้ว");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetCannabisMemberCardQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetStaffCannabisCardQueryKey(cannabisParams) }),
      ]);
    } catch (e) { setErr(`${errorText(e)} · ลองยืนยันอีกครั้งได้อย่างปลอดภัย`); }
  };
  const startCamera = async () => {
    setScanError(""); setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      controls.current = await reader.decodeFromVideoDevice(undefined, video.current!, (result) => {
        if (result) {
          const text = result.getText(); controls.current?.stop(); setScanning(false);
          if (counterMode === "cannabis") { setCannabisSearch(text); setCannabisLookup(text); setErr(""); setMsg(""); }
          else { setLookup(text); void find(text); }
        }
      });
    } catch { setScanning(false); setScanError("เปิดกล้องไม่ได้หรือไม่ได้รับอนุญาต กรุณาค้นหาด้วยรหัสสมาชิก"); }
  };
  const record = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    if (!isBottleCount(bottleCount)) { setBottleCountErr("กรอกจำนวนขวดเป็นจำนวนเต็ม 1–999"); return; }
    setBottleCountErr(""); setBusy(true); setErr("");
    const bottles = Number(bottleCount);
    const price = bundlePrice(bottles);
    const awarded = Math.floor(bottles / 3);
    const signature = JSON.stringify([member.member_code, bottles, formula]);
    const request = saleRequest.current?.signature === signature ? saleRequest.current : { signature, id: crypto.randomUUID() };
    saleRequest.current = request;
    try {
      const updated = await api<MemberCardData>(`${STAFF}/stamp`, json("POST", { member_code: member.member_code, bottle_count: bottles, formula, request_id: request.id }));
      saleRequest.current = null;
      setMember(updated);
      setBottleCount("");
      setMsg(awarded
        ? `บันทึก ${bottles} ขวด · ฿${price.toLocaleString("th-TH")} · +${awarded} แต้ม`
        : `บันทึก ${bottles} ขวด · ฿${price.toLocaleString("th-TH")} · แต้มเริ่มเมื่อครบ 3 ขวดในบิลเดียว`);
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const redeem = async () => {
    if (!member || !redeemId) return;
    setBusy(true); setErr("");
    try {
      const res = await api<Partial<MemberCardData> | null>(`${STAFF}/redeem`, json("POST", { member_code: member.member_code, request_id: redeemId }));
      if (res && typeof res.balance === "number" && res.member_code) setMember(res as MemberCardData);
      else setMember(await api<MemberCardData>(`${STAFF}/member?code=${encodeURIComponent(member.member_code)}`));
      setRedeemId(null); setMsg("แลกรับฟรี 1 ขวดเรียบร้อย หัก 10 แต้มแล้ว");
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (e) { setErr(`${errorText(e)} · กดยืนยันอีกครั้งได้อย่างปลอดภัย ระบบจะไม่หักซ้ำ`); } finally { setBusy(false); }
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!codePattern.test(code)) { setErr("รหัสสมาชิกต้องมี 6–8 ตัว"); return; }
    setBusy(true); setErr("");
    try {
      const added = await api<MemberCardData>(`${STAFF}/members`, json("POST", { name, member_code: code, phone }));
      setMsg(`เปิดบัญชี ${added.member_code} แล้ว`); setName(""); setCode(""); setPhone("");
      void qc.invalidateQueries({ queryKey: [`${STAFF}/members`] });
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const changePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,12}$/.test(newPin)) { setErr("PIN ใหม่ต้องเป็นตัวเลข 4–12 หลัก"); return; }
    setBusy(true); setErr("");
    try {
      await api(`${STAFF}/pin`, json("POST", { current_pin: oldPin, new_pin: newPin }));
      setOldPin(""); setNewPin(""); signOutLocal();
      setMsg("เปลี่ยน PIN เรียบร้อย กรุณาเข้าสู่ระบบด้วย PIN ใหม่");
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };

  if (auth === null) return <main className="min-h-[100dvh] p-6"><div className="skeleton max-w-md h-48 mx-auto" aria-label="กำลังตรวจสอบสิทธิ์" /></main>;

  return <div className="min-h-[100dvh]">
    <header className="staff-topline sticky top-0 z-40 border-b border-[var(--line)]">
      <div className="mx-auto max-w-6xl px-4 h-16 flex justify-between items-center gap-2">
        <Link href="/" className="flex items-center gap-2 no-underline min-h-11"><JaguarMark size={34} /><span className="font-display text-[var(--gold-2)] tracking-wider">JAGUAR <small className="text-[var(--emerald-2)]">STAFF</small></span></Link>
        {auth && <button className="btn btn-ghost !min-h-11 !px-4" onClick={logout}>ออกจากระบบ</button>}
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-7">
      {!auth ? <section className="max-w-sm mx-auto pt-4">
        <div className="text-center mb-6"><p className="eyebrow">Staff access</p><h1 className="font-display text-3xl font-semibold mt-2">เข้าสู่ระบบพนักงาน</h1><p className="text-sm text-[var(--muted)] mt-2">ใช้ PIN ที่เจ้าของร้านกำหนด</p></div>
        {msg && <p role="status" className="mb-4 rounded-xl border border-[rgba(47,217,138,.35)] bg-[rgba(47,217,138,.08)] p-3 text-sm text-[var(--emerald-2)]">{msg}</p>}
        <form className="panel p-5 sm:p-6 space-y-4" onSubmit={login}>
          <div className="field"><label htmlFor="staff-pin">PIN พนักงาน</label><input id="staff-pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={12} className="input text-center !text-2xl !tracking-[.5em]" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))} aria-invalid={!!err} aria-describedby={err ? "staff-pin-err" : undefined} /></div>
          <PinPad value={pin} onChange={setPin} label="แป้นตัวเลข PIN พนักงาน" />
          {err && <p id="staff-pin-err" role="alert" className="field-error">{err}</p>}
          <button className="btn btn-neon w-full" disabled={busy}>{busy ? "กำลังตรวจสอบ…" : "เข้าสู่พื้นที่ทำงาน"}</button>
        </form>
        <Link href="/owner" className="flex justify-center items-center min-h-11 text-sm text-[var(--muted)] mt-4">เข้าสู่ระบบเจ้าของร้าน</Link>
      </section>
      : <div className="space-y-5">
        <div className="flex flex-wrap justify-between items-end gap-3"><div><p className="eyebrow">Counter operations</p><h1 className="font-display text-3xl font-semibold">เคาน์เตอร์ร้าน</h1></div>{security.data?.default_pin && <p className="text-xs text-[var(--gold-2)]">กำลังใช้ PIN เริ่มต้น · เปลี่ยนได้ในตั้งค่า PIN</p>}</div>
        {msg && <p role="status" className="rounded-xl border border-[rgba(47,217,138,.35)] bg-[rgba(47,217,138,.08)] p-3 text-sm text-[var(--emerald-2)]">{msg}</p>}
        {err && <p role="alert" className="field-error">{err}</p>}
        <nav className="pill-switch grid grid-cols-2 min-[480px]:grid-cols-4 p-1 gap-1 !rounded-[22px]" aria-label="พื้นที่พนักงาน">
          {TABS.map(([id, label]) => <button key={id} type="button" className="tab !px-2 !rounded-[18px]" aria-pressed={tab === id} onClick={() => { setTab(id); setErr(""); }}>{label}</button>)}
        </nav>

        {tab === "counter" && <div className="space-y-4">
          <div className="pill-switch grid grid-cols-2 p-1 gap-1 max-w-md" aria-label="เลือกประเภทบัตร">
            <button type="button" className="tab" aria-pressed={counterMode === "kratom"} onClick={() => { setCounterMode("kratom"); setErr(""); setMsg(""); }}>กระท่อม · ขวด</button>
            <button type="button" className="tab" aria-pressed={counterMode === "cannabis"} onClick={() => { setCounterMode("cannabis"); setErr(""); setMsg(""); setCannabisRedeemId(null); }}>กัญชา · กรัม</button>
          </div>
          {counterMode === "kratom" && <div className="grid gap-5 lg:grid-cols-2 items-start">
          <section className="panel p-5 sm:p-6">
            <p className="eyebrow">Sale record</p><h2 className="font-display text-xl font-semibold mb-4">บันทึกยอดขาย / แลกรางวัล</h2>
            <form onSubmit={(e) => { e.preventDefault(); void find(); }} className="flex gap-2 items-end">
              <div className="field flex-1"><label htmlFor="lookup">รหัสสมาชิก</label><input id="lookup" className="input uppercase" value={lookup} onChange={(e) => setLookup(e.target.value)} autoComplete="off" /></div>
              <button className="btn btn-ghost">ค้นหา</button>
            </form>
            <button type="button" className="btn btn-ghost w-full mt-2" onClick={startCamera}>เปิดกล้องสแกน QR</button>
            {scanning && <><video ref={video} className="w-full rounded-xl aspect-video bg-black mt-3" aria-label="ภาพจากกล้องสำหรับสแกน" /><button type="button" className="btn btn-ghost w-full mt-2" onClick={() => { controls.current?.stop(); setScanning(false); }}>ปิดกล้อง</button></>}
            {scanError && <p role="alert" className="field-error">{scanError}</p>}
            {member && <div className="mt-5">
              <div className={`rounded-xl border p-4 flex flex-wrap gap-3 justify-between ${member.balance >= STAMPS ? "border-[var(--gold)]" : "border-[var(--glass-line)]"}`}>
                <div className="min-w-0"><p className="break-words">{member.display_name}</p><p className="font-mono text-[var(--gold-2)]">{member.member_code}</p>
                  <div className="flex flex-wrap gap-2 mt-1">{member.balance >= STAMPS && <span className="ready-badge">แลกได้</span>}</div></div>
                <p className={`font-display text-3xl ${member.balance >= STAMPS ? "text-[var(--gold-2)]" : "text-[var(--emerald-2)]"}`}>{member.balance} แต้ม</p>
              </div>
              {member.balance >= STAMPS && (redeemId === null
                ? <button type="button" className="btn btn-gold w-full mt-3" disabled={busy} onClick={() => { setRedeemId(crypto.randomUUID()); setMsg(""); }}>แลกฟรี 1 ขวด (ใช้ 10 แต้ม)</button>
                : <div role="alertdialog" aria-labelledby="redeem-q" className="gold-alert mt-3 space-y-3">
                  <p id="redeem-q">ยืนยันส่งมอบฟรี 1 ขวดให้ {member.member_code}? ระบบจะหัก 10 แต้ม</p>
                  <div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRedeemId(null)}>ยกเลิก</button><button type="button" className="btn btn-gold" disabled={busy} onClick={() => void redeem()} autoFocus>{busy ? "กำลังบันทึก…" : "ยืนยันแลก"}</button></div>
                </div>)}
              <form onSubmit={record} className="space-y-3 mt-4" noValidate>
                <div className="field">
                  <label htmlFor="bottle-count">จำนวนขวดในบิล</label>
                  <input id="bottle-count" className="input" type="text" inputMode="numeric" autoComplete="off" maxLength={12} required value={bottleCount}
                    onChange={(e) => { const value = e.target.value; setBottleCount(value); setBottleCountErr(value && !isBottleCount(value) ? "กรอกจำนวนขวดเป็นจำนวนเต็ม 1–999" : ""); }}
                    aria-invalid={!!bottleCountErr} aria-describedby={bottleCountErr ? "bottle-count-error" : "bottle-count-rule"} />
                  {bottleCountErr ? <p id="bottle-count-error" role="alert" className="field-error">{bottleCountErr}</p> : <p id="bottle-count-rule" className="text-xs text-[var(--muted)]">ครบทุก 3 ขวดต่อบิล = 1 แต้ม · เศษไม่ทบข้ามบิล</p>}
                </div>
                <fieldset>
                  <legend className="text-sm mb-2 text-[var(--silver)]">เลือกสูตร</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["red", "silver", "gold"] as Formula[]).map((f) => <button type="button" className={`btn btn-ghost !min-h-[48px] !px-1 !py-2 justify-center text-xs leading-tight ${formula === f ? "border-[var(--gold)] text-[var(--gold-2)]" : ""}`} key={f} aria-label={formulaLabels[f]} aria-pressed={formula === f} onClick={() => setFormula(f)}>{formulaShort[f]}</button>)}
                  </div>
                </fieldset>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--glass-line)] bg-black/30 px-3 py-2 text-sm">
                  <span className="text-xs text-[var(--muted)]">ราคาพิเศษอัตโนมัติ</span>
                  <span className="font-semibold tabular-nums text-[var(--gold-2)]">{isBottleCount(bottleCount) ? `฿${bundlePrice(Number(bottleCount)).toLocaleString("th-TH")} · +${Math.floor(Number(bottleCount) / 3)} แต้ม` : "—"}</span>
                </div>
                <button className="btn btn-neon w-full" disabled={busy}>บันทึกยอดซื้อและแต้ม</button>
              </form>
            </div>}
          </section>
          <section className="panel p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">รายการแลกรอส่งมอบ</h2>
            {queue.isLoading ? <div className="skeleton h-20 mt-4" /> : queue.isError ? <ErrorState message={errorText(queue.error)} onRetry={() => queue.refetch()} retrying={queue.isFetching} /> : !queue.data?.length ? <div className="mt-4"><EmptyState title="ไม่มีรายการรอยืนยัน" /></div>
            : <ul className="list-none p-0 mt-4 space-y-3">{queue.data.map((r) => <li key={r.id} className="rounded-xl border border-[var(--line-2)] p-4"><p className="font-semibold">{r.reward_name}</p><p className="text-sm text-[var(--muted)]">{r.member_code} · {r.points_spent} แต้ม</p><button className="btn btn-gold w-full mt-3" disabled={busy} onClick={async () => { setBusy(true); try { await api(`${STAFF}/redemptions/${encodeURIComponent(r.id)}/confirm`, json("POST", {})); setMsg("ยืนยันการส่งมอบรางวัลแล้ว"); await queue.refetch(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); } }}>ยืนยันส่งมอบ</button></li>)}</ul>}
          </section>
          </div>}
          {counterMode === "cannabis" && <div className="grid gap-5 lg:grid-cols-2 items-start">
            <section className="panel p-5 sm:p-6">
              <p className="eyebrow">Cannabis counter</p><h2 className="font-display text-xl font-semibold mb-4">ประทับแต้ม / แลก 1 กรัม</h2>
              <form onSubmit={lookupCannabis} className="flex gap-2 items-end">
                <div className="field flex-1"><label htmlFor="cannabis-lookup">รหัสสมาชิกหรือ QR</label><input id="cannabis-lookup" className="input uppercase" value={cannabisSearch} onChange={(e) => setCannabisSearch(e.target.value)} autoComplete="off" /></div>
                <button className="btn btn-ghost" disabled={cannabisCardQuery.isFetching}>ค้นหา</button>
              </form>
              <button type="button" className="btn btn-ghost w-full mt-2" onClick={startCamera}>เปิดกล้องสแกน QR</button>
              {scanning && <><video ref={video} className="w-full rounded-xl aspect-video bg-black mt-3" aria-label="ภาพจากกล้องสำหรับสแกน" /><button type="button" className="btn btn-ghost w-full mt-2" onClick={() => { controls.current?.stop(); setScanning(false); }}>ปิดกล้อง</button></>}
              {scanError && <p role="alert" className="field-error">{scanError}</p>}
              {cannabisCardQuery.isLoading && cannabisLookup && <div className="skeleton h-24 mt-4" aria-label="กำลังค้นหาบัตรกัญชา" />}
              {cannabisCardQuery.isError && cannabisLookup && <div className="mt-4"><ErrorState message={errorText(cannabisCardQuery.error)} onRetry={() => void cannabisCardQuery.refetch()} retrying={cannabisCardQuery.isFetching} /></div>}
              {!cannabisLookup && <div className="mt-4"><EmptyState title="ค้นหาบัตรกัญชา" body="กรอกรหัสสมาชิกหรือสแกน QR เพื่อเริ่มรายการ" /></div>}
              {cannabisCard && <div className="cannabis-staff-card mt-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold break-words">{cannabisCard.display_name || "สมาชิก"}</p><p className="font-mono text-sm text-[var(--gold-2)]">{cannabisCard.member_code}</p></div><div className="text-right"><strong className="font-display text-3xl text-[var(--emerald-2)]">{cannabisCard.balance}</strong><p className="text-xs text-[var(--muted)]">แต้มแยกจากบัตรกระท่อม</p></div></div>
                <div className="flex justify-between text-xs mt-4 text-[var(--muted)]"><span>ซื้อสะสม {cannabisCard.lifetime_earned} กรัม</span><span>ใช้แลก {cannabisCard.lifetime_redeemed} แต้ม</span></div>
                {cannabisCard.balance >= 10 && (cannabisRedeemId === null
                  ? <button type="button" className="btn btn-gold w-full mt-4" disabled={redeemCannabis.isPending || addCannabisStamps.isPending} onClick={() => { setCannabisRedeemId(crypto.randomUUID()); setErr(""); setMsg(""); }}>แลกฟรี 1 กรัม · ใช้ 10 แต้ม</button>
                  : <div role="alertdialog" aria-labelledby="cannabis-redeem-q" className="gold-alert mt-4 space-y-3"><p id="cannabis-redeem-q">ยืนยันส่งมอบฟรี 1 กรัมให้ {cannabisCard.member_code}? ระบบจะหัก 10 แต้ม</p><div className="grid grid-cols-2 gap-2"><button type="button" className="btn btn-ghost" disabled={redeemCannabis.isPending} onClick={() => setCannabisRedeemId(null)}>ยกเลิก</button><button type="button" className="btn btn-gold" disabled={redeemCannabis.isPending} onClick={() => void confirmCannabisRedeem()}>{redeemCannabis.isPending ? "กำลังบันทึก…" : "ยืนยันแลก"}</button></div></div>)}
                <form onSubmit={recordCannabis} className="space-y-3 mt-4" noValidate>
                  <div className="field"><label htmlFor="cannabis-grams">จำนวนกรัมที่ซื้อ</label><input id="cannabis-grams" className="input" type="text" inputMode="numeric" autoComplete="off" maxLength={3} value={grams} onChange={(e) => { setGrams(e.target.value); setGramsError(e.target.value && (!/^\d+$/.test(e.target.value) || Number(e.target.value) < 1 || Number(e.target.value) > 999) ? "กรอกจำนวนกรัมเป็นจำนวนเต็ม 1–999" : ""); }} aria-invalid={!!gramsError} aria-describedby={gramsError ? "cannabis-grams-error" : "cannabis-grams-rule"} /></div>
                  {gramsError ? <p id="cannabis-grams-error" role="alert" className="field-error">{gramsError}</p> : <p id="cannabis-grams-rule" className="text-xs text-[var(--muted)]">ทุก 1 กรัมที่ซื้อ = 1 แต้ม · จำนวนเต็มเท่านั้น</p>}
                  <button className="btn btn-neon w-full" disabled={addCannabisStamps.isPending || redeemCannabis.isPending}>{addCannabisStamps.isPending ? "กำลังบันทึก…" : "บันทึกกรัมและประทับแต้ม"}</button>
                </form>
              </div>}
            </section>
            <section className="panel p-5 sm:p-6">
              <p className="eyebrow">Separate ledger</p><h2 className="font-display text-xl font-semibold">รายการแต้มกัญชาล่าสุด</h2>
              {!cannabisCard ? <div className="mt-4"><EmptyState title="ยังไม่ได้เลือกสมาชิก" body="รายการแต้มจะแสดงเมื่อค้นหาบัตร" /></div>
                : !cannabisCard.recent_transactions.length ? <div className="mt-4"><EmptyState title="ยังไม่มีรายการแต้ม" /></div>
                : <ul className="list-none p-0 mt-3 divide-y divide-[var(--line)]">{cannabisCard.recent_transactions.map((tx) => <li key={tx.id} className="py-3 flex items-center gap-3"><span className={`cannabis-delta ${tx.delta < 0 ? "is-out" : ""}`}>{tx.delta > 0 ? `+${tx.delta}` : tx.delta}</span><div className="min-w-0 flex-1"><p className="text-sm break-words">{tx.reason}</p><p className="text-xs text-[var(--muted)]">{new Date(tx.created_at).toLocaleString("th-TH")} {tx.grams_purchased > 0 ? `· ${tx.grams_purchased} กรัม` : ""}</p></div></li>)}</ul>}
            </section>
          </div>}
        </div>}

        {tab === "members" && <section className="panel p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold mb-4">สมาชิกทั้งหมด</h2>
          <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
            <div className="field flex-1"><label htmlFor="member-search">กรองด้วยชื่อหรือรหัส</label><input id="member-search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <button className="btn btn-ghost">ค้นหา</button>
          </form>
          {members.isLoading ? <div className="space-y-2 mt-4">{[1, 2, 3].map((x) => <div key={x} className="skeleton h-14" />)}</div>
          : members.isError ? <ErrorState message={errorText(members.error)} onRetry={() => members.refetch()} retrying={members.isFetching} />
          : !visibleMembers.length ? <div className="mt-4"><EmptyState title={query ? "ไม่พบสมาชิก" : "ยังไม่มีสมาชิก"} /></div>
          : <ul className="divide-y divide-[var(--line)] list-none p-0 mt-4">{visibleMembers.map((m) => <li className="py-3 flex gap-3 items-center" key={m.id}>
            <div className="min-w-0 flex-1"><p className="break-words">{m.display_name || "สมาชิก"}</p><p className="font-mono text-sm text-[var(--gold-2)]">{m.member_code}</p>
               <div className="flex flex-wrap gap-2 mt-1">{m.balance >= STAMPS && <span className="ready-badge">แลกได้</span>}</div></div>
            <p className={`font-mono text-xl shrink-0 ${m.balance >= STAMPS ? "text-[var(--gold-2)]" : ""}`}>{m.balance}</p>
            <button type="button" className="btn btn-ghost !min-h-11 !px-3 text-sm shrink-0" onClick={() => { setTab("counter"); setLookup(m.member_code); void find(m.member_code); }}>เปิด</button>
          </li>)}</ul>}
        </section>}

        {tab === "open" && <section className="panel p-5 sm:p-6 max-w-xl"><p className="eyebrow">New member</p><h2 className="font-display text-xl font-semibold mb-4">เปิดบัญชีสมาชิก</h2>
          <form onSubmit={create} className="space-y-4"><Field id="name" label="ชื่อลูกค้า" value={name} set={setName} /><Field id="code" label="รหัสสมาชิก 6–8 ตัว" value={code} set={(v) => setCode(cleanCode(v))} /><Field id="phone" label="เบอร์มือถือ" value={phone} set={setPhone} inputMode="tel" /><button className="btn btn-neon w-full" disabled={busy}>สร้างบัญชี</button></form></section>}

        {tab === "settings" && <section className="panel p-5 sm:p-6 max-w-md"><p className="eyebrow">Security</p><h2 className="font-display text-xl font-semibold mb-2">เปลี่ยน PIN พนักงาน</h2><p className="text-sm text-[var(--muted)] mb-4">หลังบันทึก ระบบจะออกจากระบบพนักงานบนอุปกรณ์นี้</p>
          <form onSubmit={changePin} className="space-y-4">
            <Field id="old-pin" label="PIN ปัจจุบัน" value={oldPin} set={(v) => setOldPin(v.replace(/\D/g, ""))} type="password" inputMode="numeric" />
            <Field id="new-pin" label="PIN ใหม่ (ตัวเลข 4–12 หลัก)" value={newPin} set={(v) => setNewPin(v.replace(/\D/g, ""))} type="password" inputMode="numeric" />
            <PinPad value={newPin} onChange={setNewPin} label="แป้นตัวเลขสำหรับ PIN ใหม่" />
            <button className="btn btn-neon w-full" disabled={busy}>บันทึก PIN</button>
          </form></section>}
      </div>}
    </main>
  </div>;
}

function Field({ id, label, value, set, type = "text", inputMode }: { id: string; label: string; value: string; set: (v: string) => void; type?: "text" | "password"; inputMode?: "numeric" | "tel" }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} className="input" type={type} inputMode={inputMode} value={value} onChange={(e) => set(e.target.value)} required maxLength={type === "password" ? 12 : 120} autoComplete="off" /></div>;
}
