"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLoginMember, useRegisterMember } from "@workspace/api-client-react";
import { BrandIcon } from "./brand-icon";
import { BrandArtworkButton, BrandButton } from "./brand-button";
import { cleanCode, codePattern, errorText, phonePattern } from "./loyalty-api";
import { clearMemberCache } from "./api-utils";

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [method, setMethod] = useState<"phone" | "member_code" | "nickname">("phone");
  const [identifier, setIdentifier] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const loginMember = useLoginMember();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr(null);
    const normalized = method === "member_code" ? cleanCode(identifier) : identifier.trim();
    if (!normalized || (method === "member_code" && !codePattern.test(normalized))) {
      setErr(method === "member_code" ? "รหัสสมาชิก 6–8 ตัว ใช้ A–Z ตัวเลข และขีดกลางด้านในได้" : "กรอกข้อมูลเข้าสู่ระบบให้ครบ");
      return;
    }
    setErr(null); setPending(true);
    try {
      clearMemberCache(qc);
      const card = await loginMember.mutateAsync({ data: { method, identifier: normalized } });
      qc.setQueryData(["/api/loyalty/card"], card);
      router.push("/card");
    } catch (ex) { setServerErr(errorText(ex)); } finally { setPending(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="auth-form space-y-4">
      {serverErr && <div className="auth-error-banner" role="alert" aria-live="assertive"><BrandIcon name="error" tone="danger" /><div><strong>ยังเข้าใช้งานไม่ได้</strong><p>{serverErr}</p></div></div>}
      <div className="field">
        <div className="pill-switch grid grid-cols-3 gap-1 p-1 mb-4" role="tablist" aria-label="วิธีเข้าสู่ระบบ" onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const methods = ["phone", "member_code", "nickname"] as const;
          const currentIndex = methods.indexOf(method);
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const next = methods[(currentIndex + direction + methods.length) % methods.length];
          setMethod(next);
          setIdentifier("");
          setErr(null);
          document.getElementById(`login-method-${next}`)?.focus();
        }}>
          {([["phone", "เบอร์โทร", "phone"], ["member_code", "รหัสสมาชิก", "memberCode"], ["nickname", "ชื่อเล่น", "nickname"]] as const).map(([key, label, icon]) =>
            <button key={key} id={`login-method-${key}`} type="button" role="tab" tabIndex={method === key ? 0 : -1} aria-selected={method === key} className="tab !px-1 !text-xs sm:!text-sm flex-col !gap-1" data-testid={`login-method-${key}`} onClick={() => { setMethod(key); setIdentifier(""); setErr(null); }}>
              <BrandIcon name={icon} size={16} tone={method === key ? "emerald" : "neutral"} />
              <span>{label}</span>
            </button>
          )}
        </div>
        <label className="auth-field-label" htmlFor="login-identifier">{method === "phone" ? "เบอร์มือถือ" : method === "member_code" ? "รหัสสมาชิก" : "ชื่อเล่น"}</label>
        <input id="login-identifier" data-testid="login-identifier" className={`input ${method === "member_code" ? "uppercase" : ""}`} value={identifier} type={method === "phone" ? "tel" : "text"} inputMode={method === "phone" ? "tel" : "text"} autoComplete={method === "phone" ? "tel" : "off"} autoCapitalize={method === "member_code" ? "characters" : "off"} autoCorrect="off" spellCheck={false} maxLength={method === "member_code" ? 8 : 64} placeholder={method === "phone" ? "08x xxx xxxx" : method === "member_code" ? "รหัสสมาชิก" : "ชื่อที่ใช้สมัคร"} onChange={(e) => { setIdentifier(method === "member_code" ? cleanCode(e.target.value) : e.target.value); setErr(null); setServerErr(null); }} aria-invalid={!!err} aria-describedby={err ? "login-identifier-err" : undefined} />
        {err && <p id="login-identifier-err" className="field-error" role="alert">{err}</p>}
      </div>
      <BrandArtworkButton
        type="submit"
        src="/ui/artwork/sign-in.webp"
        label={pending ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
        disabled={pending}
        testId="login-submit"
      />
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [errs, setErrs] = useState<{ phone?: string; code?: string; nickname?: string }>({});
  const [server, setServer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const registerMember = useRegisterMember();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServer(null);
    const p = phone.replace(/[\s-]/g, "");
    const next: typeof errs = {};
    if (!phonePattern.test(p)) next.phone = "กรอกเบอร์มือถือไทยให้ถูกต้อง";
    if (!codePattern.test(code)) next.code = "ตั้งรหัส 6–8 ตัว ใช้ A–Z ตัวเลข และขีดกลางด้านในได้";
    if (nickname.trim().length < 2 || nickname.trim().length > 20) next.nickname = "ชื่อเล่นต้องมี 2–20 ตัวอักษร";
    setErrs(next);
    if (next.phone || next.code || next.nickname) return;
    setPending(true);
    try {
      clearMemberCache(qc);
      const card = await registerMember.mutateAsync({ data: { phone: p, member_code: code, nickname: nickname.trim() } });
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
        <label className="auth-field-label" htmlFor="reg-nickname">ชื่อเล่น</label>
        <input id="reg-nickname" data-testid="register-nickname" className="input" autoComplete="nickname" maxLength={20} placeholder="ชื่อที่เพื่อนเรียก" value={nickname} onChange={(e) => setNickname(e.target.value)} aria-invalid={!!errs.nickname} aria-describedby={errs.nickname ? "reg-nickname-err" : undefined} />
        {errs.nickname && <p id="reg-nickname-err" className="field-error" role="alert">{errs.nickname}</p>}
      </div>
      <div className="field">
        <label className="auth-field-label" htmlFor="reg-code">ตั้งรหัสสมาชิก</label>
        <input id="reg-code" className="input uppercase" autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" maxLength={8} placeholder="6–8 ตัวอักษร" value={code} onChange={(e) => setCode(cleanCode(e.target.value))} aria-invalid={!!errs.code} aria-describedby={errs.code ? "reg-code-err" : undefined} />
        {errs.code && <p id="reg-code-err" className="field-error" role="alert">{errs.code}</p>}
      </div>
      {server && <div className="auth-error-banner" role="alert" aria-live="assertive"><BrandIcon name="error" tone="danger" /><div><strong>ยังสมัครสมาชิกไม่ได้</strong><p>{server}</p></div></div>}
      <BrandArtworkButton
        type="submit"
        src="/ui/artwork/signup-card.webp"
        label={pending ? "กำลังสมัครบัตร" : "สมัครบัตร"}
        disabled={pending}
        testId="register-submit"
      />
    </form>
  );
}
