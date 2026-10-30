"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetMemberCard, getGetMemberCardQueryKey } from "@workspace/api-client-react";
import { BrandIcon } from "./brand-icon";
import { BrandEmblemPlaceholder } from "./brand-emblem-placeholder";
import { JaguarMark } from "./jaguar-mark";
import { LoginForm, RegisterForm } from "./auth-forms";

export function Welcome({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const session = useGetMemberCard({ query: { queryKey: getGetMemberCardQueryKey(), retry: false, refetchOnWindowFocus: false } });

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[1.1fr_1fr]">
      <section className="auth-stage relative overflow-hidden order-2 lg:order-1 px-6 pt-10 pb-12 lg:p-16 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-[var(--line)]">
        <div className="rosette-field absolute inset-0 opacity-[.05] pointer-events-none" aria-hidden="true" />
        <div className="relative hidden lg:flex items-center justify-between rise">
          <span className="leading-tight">
            <span className="block font-display text-xs font-semibold tracking-[.2em] text-[var(--gold-2)]">JAGUAR KRATOM HOUSE</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">ซอยบุญคีรี 6 · สมุทรปราการ</span>
          </span>
          <Link href="/admin" className="inline-flex items-center min-h-11 px-2 text-xs text-[var(--muted)] hover:text-[var(--gold-2)] no-underline font-mono tracking-widest" data-testid="link-staff">STAFF</Link>
        </div>

        <div className="relative lg:my-0 flex flex-col items-start">
          <div className="hidden lg:block mb-10 rise" style={{ animationDelay: "80ms" }}>
            <BrandEmblemPlaceholder variant="hero" />
          </div>
          <h1 className="font-display font-semibold leading-[1.1] tracking-tight text-[30px] sm:text-[44px] lg:text-[60px] rise" style={{ animationDelay: "120ms" }}>
            ร้านประจำ<br />
            <span className="text-[var(--gold-2)]">ของคนในซอย</span>
          </h1>
          <div className="hairline w-24 mt-6" aria-hidden="true" />
          <p className="mt-6 max-w-md text-[var(--muted)] text-base sm:text-lg rise" style={{ animationDelay: "200ms" }}>
            สะสมแต้มทุกครั้งที่แวะ ครบ 10 แต้ม แลกของรางวัลที่เคาน์เตอร์ได้เลย บัตรอยู่ในมือถือ ไม่ต้องพกกระดาษ
          </p>
          <ol className="mt-8 grid grid-cols-3 gap-3 max-w-md w-full rise list-none p-0" style={{ animationDelay: "260ms" }}>
            {[["01", "สมัครด้วยเบอร์"], ["02", "สะสมแต้ม"], ["03", "แลกรางวัล"]].map(([n, t]) => (
              <li key={n} className="border-t border-[var(--line-2)] pt-3">
                <span className="font-mono text-xs text-[var(--gold)]">{n}</span>
                <p className="text-sm mt-1">{t}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative mt-10 lg:mt-0 lg:hidden flex items-center gap-2 text-xs text-[var(--muted)]">
          <BrandIcon name="location" tone="neutral" /> ซอยบุญคีรี 6 · สมุทรปราการ
        </p>
      </section>

      <section className="order-1 lg:order-2 px-5 sm:px-6 pt-5 pb-10 lg:p-16 flex items-start lg:items-center justify-center">
        <div className="w-full max-w-md rise">
          <div className="flex lg:hidden items-center justify-between mb-6">
            <span className="flex items-center gap-3">
              <JaguarMark size={34} title="Jaguar Kratom House" />
              <span className="leading-tight">
                <span className="brand-wordmark block font-display font-semibold text-[14px] text-[var(--gold-2)]">JAGUAR</span>
                <span className="block eyebrow !text-[9px] !tracking-[.3em]">Kratom House</span>
              </span>
            </span>
            <Link href="/admin" className="inline-flex items-center min-h-11 text-xs text-[var(--muted)] hover:text-[var(--gold-2)] no-underline font-mono tracking-widest px-2 py-2" data-testid="link-staff-mobile">STAFF</Link>
          </div>
          <p className="eyebrow mb-2">Private Members</p>
          {session.isSuccess && session.data ? (
              <div className="panel auth-panel p-7 space-y-5" data-testid="panel-session">
              <h2 className="font-display text-2xl font-semibold">ยินดีต้อนรับกลับ</h2>
              <p className="text-[var(--muted)] text-sm">อุปกรณ์นี้เข้าสู่ระบบอยู่แล้ว บัตร <span className="font-mono text-[var(--gold-2)]">{session.data.member_code}</span></p>
              <Link href="/card" className="btn btn-neon w-full" data-testid="link-open-card">เปิดบัตรของฉัน <BrandIcon name="continue" tone="inherit" /></Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-5">{tab === "login" ? "เปิดบัตรของคุณ" : "รับบัตรใบใหม่"}</h2>
              <div role="tablist" aria-label="เลือกการเข้าใช้" className="flex gap-1 p-1 rounded-xl border border-[var(--line)] bg-[rgba(196,202,214,.03)] mb-5">
                <button role="tab" id="tab-login" aria-selected={tab === "login"} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login">เข้าสู่ระบบ</button>
                <button role="tab" id="tab-register" aria-selected={tab === "register"} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register">สมัครสมาชิก</button>
              </div>
              <div id="panel-auth" role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel auth-panel p-5 sm:p-7">
                {tab === "login" ? <LoginForm /> : <RegisterForm />}
              </div>
              {session.isError && (session.error as { status?: number })?.status !== 401 && (
                <p className="mt-4 text-xs text-[var(--muted)]" role="status">เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว คุณยังลองเข้าสู่ระบบได้</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
