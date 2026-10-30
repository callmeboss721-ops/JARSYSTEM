"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLoginMember, useRegisterMember, getGetMemberCardQueryKey } from "@workspace/api-client-react";
import { BrandIcon } from "./brand-icon";
import { CODE_RE, PHONE_RE, clearMemberCache, errMessage, errStatus, normalizePhone, setSessionHint } from "./api-utils";

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const login = useLoginMember();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [server, setServer] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServer(null);
    if (!CODE_RE.test(code)) { setErr("รหัสสมาชิกต้องเป็นตัวอักษรอังกฤษหรือตัวเลข 6–10 ตัว"); return; }
    setErr(null);
    try {
      clearMemberCache(qc);
      const card = await login.mutateAsync({ data: { member_code: code } });
      qc.setQueryData(getGetMemberCardQueryKey(), card);
      setSessionHint(true);
      router.push("/card");
    } catch (ex) {
      const s = errStatus(ex);
      setServer(s === 401 || s === 404 ? "ไม่พบรหัสสมาชิกนี้ ตรวจสอบแล้วลองใหม่" : errMessage(ex));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-describedby="login-warn">
      <div className="field">
        <label htmlFor="login-code">รหัสสมาชิก</label>
        <input
          id="login-code" className="input uppercase" value={code} autoComplete="off" spellCheck={false}
          maxLength={10} placeholder="เช่น JAG2024" inputMode="text"
          onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
          aria-invalid={!!err} aria-describedby={err ? "login-code-err" : undefined}
          data-testid="input-login-code"
        />
        {err && <p id="login-code-err" className="field-error" role="alert">{err}</p>}
      </div>
      <p id="login-warn" className="flex gap-2 text-[13px] text-[var(--silver)] bg-[rgba(196,202,214,.04)] border border-[var(--line-2)] rounded-xl p-3">
        <BrandIcon name="security" tone="gold" className="shrink-0 mt-0.5" />
        รหัสสมาชิกคือกุญแจบัตรของคุณ อย่าบอกหรือแชร์ให้ผู้อื่น พนักงานจะไม่ขอรหัสนี้
      </p>
      {server && <p className="field-error" role="alert" data-testid="text-login-error">{server}</p>}
      <button type="submit" className="btn btn-neon w-full" disabled={login.isPending} data-testid="button-login">
        {login.isPending ? "กำลังเปิดบัตร..." : "เปิดบัตรสมาชิก"} <BrandIcon name="continue" tone="inherit" />
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const reg = useRegisterMember();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errs, setErrs] = useState<{ phone?: string; code?: string }>({});
  const [server, setServer] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServer(null);
    const p = normalizePhone(phone);
    const next: typeof errs = {};
    if (!PHONE_RE.test(p)) next.phone = "กรอกเบอร์มือถือไทย เช่น 0812345678";
    if (!CODE_RE.test(code)) next.code = "ตั้งรหัส 6–10 ตัว ใช้ A–Z หรือ 0–9 เท่านั้น";
    setErrs(next);
    if (next.phone || next.code) return;
    try {
      clearMemberCache(qc);
      const card = await reg.mutateAsync({ data: { phone: p, member_code: code } });
      qc.setQueryData(getGetMemberCardQueryKey(), card);
      setSessionHint(true);
      router.push("/card");
    } catch (ex) {
      setServer(errStatus(ex) === 409 ? "เบอร์โทรหรือรหัสสมาชิกนี้ถูกใช้แล้ว ลองรหัสอื่น" : errMessage(ex));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="field">
        <label htmlFor="reg-phone">เบอร์มือถือ</label>
        <input
          id="reg-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="08x xxx xxxx"
          value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={16}
          aria-invalid={!!errs.phone} aria-describedby={errs.phone ? "reg-phone-err" : undefined}
          data-testid="input-register-phone"
        />
        {errs.phone && <p id="reg-phone-err" className="field-error" role="alert">{errs.phone}</p>}
      </div>
      <div className="field">
        <label htmlFor="reg-code">ตั้งรหัสสมาชิก</label>
        <input
          id="reg-code" className="input uppercase" autoComplete="off" spellCheck={false} maxLength={10}
          placeholder="6–10 ตัว A–Z / 0–9" value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
          aria-invalid={!!errs.code} aria-describedby={errs.code ? "reg-code-err" : "reg-code-hint"}
          data-testid="input-register-code"
        />
        {errs.code ? <p id="reg-code-err" className="field-error" role="alert">{errs.code}</p>
          : <p id="reg-code-hint" className="field-hint">ใช้รหัสนี้เข้าบัตรทุกครั้ง จดเก็บไว้และเก็บเป็นความลับ</p>}
      </div>
      {server && <p className="field-error" role="alert" data-testid="text-register-error">{server}</p>}
      <button type="submit" className="btn btn-gold w-full" disabled={reg.isPending} data-testid="button-register">
        {reg.isPending ? "กำลังออกบัตร..." : "รับบัตรสมาชิก"} <BrandIcon name="continue" tone="inherit" />
      </button>
    </form>
  );
}
