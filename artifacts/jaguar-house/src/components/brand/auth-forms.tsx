"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BrandIcon } from "./brand-icon";
import { BrandButton } from "./brand-button";
import { api, cleanCode, codePattern, errorText, json, phonePattern } from "./loyalty-api";
import { clearMemberCache } from "./api-utils";

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr(null);
    if (!codePattern.test(code)) { setErr("รหัสสมาชิก 6–8 ตัว ใช้ A–Z ตัวเลข และขีดกลางด้านในได้"); return; }
    setErr(null); setPending(true);
    try {
      clearMemberCache(qc);
      const card = await api("/api/loyalty/login", json("POST", { member_code: code }));
      qc.setQueryData(["/api/loyalty/card"], card);
      router.push("/card");
    } catch (ex) { setServerErr(errorText(ex)); } finally { setPending(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="auth-form space-y-4">
      {serverErr && <div className="auth-error-banner" role="alert" aria-live="assertive"><BrandIcon name="error" tone="danger" /><div><strong>ยังเข้าใช้งานไม่ได้</strong><p>{serverErr}</p></div></div>}
      <div className="field">
        <label className="auth-field-label" htmlFor="login-code">รหัสสมาชิก</label>
        <input id="login-code" className="input uppercase" value={code} autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={8} placeholder="รหัสสมาชิก" inputMode="text" onChange={(e) => { setCode(cleanCode(e.target.value)); setErr(null); setServerErr(null); }} aria-invalid={!!err} aria-describedby={err ? "login-code-err" : undefined} />
        {err && <p id="login-code-err" className="field-error" role="alert">{err}</p>}
      </div>
      <BrandButton type="submit" asset="btn-jaguar" label={pending ? "กำลังเข้าใช้…" : "เข้าใช้งาน"} disabled={pending} testId="login-submit" />
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errs, setErrs] = useState<{ phone?: string; code?: string }>({});
  const [server, setServer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServer(null);
    const p = phone.replace(/[\s-]/g, "");
    const next: typeof errs = {};
    if (!phonePattern.test(p)) next.phone = "กรอกเบอร์มือถือไทยให้ถูกต้อง";
    if (!codePattern.test(code)) next.code = "ตั้งรหัส 6–8 ตัว ใช้ A–Z ตัวเลข และขีดกลางด้านในได้";
    setErrs(next);
    if (next.phone || next.code) return;
    setPending(true);
    try {
      clearMemberCache(qc);
      const card = await api("/api/loyalty/register", json("POST", { phone: p, member_code: code }));
      qc.setQueryData(["/api/loyalty/card"], card);
      router.push("/card");
    } catch (ex) { setServer(errorText(ex)); } finally { setPending(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="auth-form space-y-4">
      <div className="field">
        <label className="auth-field-label" htmlFor="reg-phone">เบอร์มือถือ</label>
        <input id="reg-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" autoCapitalize="off" autoCorrect="off" placeholder="08x xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={16} aria-invalid={!!errs.phone} aria-describedby={errs.phone ? "reg-phone-err" : undefined} />
        {errs.phone && <p id="reg-phone-err" className="field-error" role="alert">{errs.phone}</p>}
      </div>
      <div className="field">
        <label className="auth-field-label" htmlFor="reg-code">ตั้งรหัสสมาชิก</label>
        <input id="reg-code" className="input uppercase" autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" maxLength={8} placeholder="6–8 ตัวอักษร" value={code} onChange={(e) => setCode(cleanCode(e.target.value))} aria-invalid={!!errs.code} aria-describedby={errs.code ? "reg-code-err" : undefined} />
        {errs.code && <p id="reg-code-err" className="field-error" role="alert">{errs.code}</p>}
      </div>
      {server && <div className="auth-error-banner" role="alert" aria-live="assertive"><BrandIcon name="error" tone="danger" /><div><strong>ยังสมัครสมาชิกไม่ได้</strong><p>{server}</p></div></div>}
      <BrandButton type="submit" asset="btn-crown" label={pending ? "กำลังสมัคร…" : "เปิดบัตร"} disabled={pending} testId="register-submit" />
    </form>
  );
}
