"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetMemberCard, getGetMemberCardQueryKey } from "@workspace/api-client-react";
import { ArrowRight, MapPin } from "lucide-react";
import { JaguarMark } from "./jaguar-mark";
import { LoginForm, RegisterForm } from "./auth-forms";

export function Welcome({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const session = useGetMemberCard({ query: { queryKey: getGetMemberCardQueryKey(), retry: false, refetchOnWindowFocus: false } });

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[1.1fr_1fr]">
      <section className="relative overflow-hidden px-6 pt-10 pb-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--line)]">
        <div className="flex items-center justify-between rise">
          <span className="eyebrow">Est. Boonkhiri Soi 6</span>
          <Link href="/admin" className="text-xs text-[var(--muted)] hover:text-[var(--gold-2)] no-underline font-mono tracking-widest" data-testid="link-staff">STAFF</Link>
        </div>

        <div className="relative my-10 lg:my-0 flex flex-col items-start">
          <div className="relative mb-8 rise" style={{ animationDelay: "80ms" }}>
            <div className="halo absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(0,255,157,.18),transparent_65%)]" aria-hidden="true" />
            <JaguarMark size={132} animated title="Jaguar Kratom House" />
          </div>
          <h1 className="font-display font-bold leading-[.95] tracking-tight text-[44px] sm:text-[64px] lg:text-[76px] rise" style={{ animationDelay: "160ms" }}>
            ร้านประจำ<br />
            <span className="text-[var(--neon)]">ของคนในซอย</span>
          </h1>
          <p className="mt-6 max-w-md text-[var(--muted)] text-base sm:text-lg rise" style={{ animationDelay: "240ms" }}>
            สะสมตราเสือดาวทุกครั้งที่แวะ ครบ 10 ดวง แลกของรางวัลที่เคาน์เตอร์ได้เลย บัตรอยู่ในมือถือ ไม่ต้องพกกระดาษ
          </p>
          <ol className="mt-8 grid grid-cols-3 gap-3 max-w-md w-full rise list-none p-0" style={{ animationDelay: "320ms" }}>
            {[["01", "สมัครด้วยเบอร์"], ["02", "สะสมตรา"], ["03", "แลกรางวัล"]].map(([n, t]) => (
              <li key={n} className="border-t border-[var(--gold)]/40 pt-3">
                <span className="font-mono text-xs text-[var(--gold)]">{n}</span>
                <p className="text-sm mt-1">{t}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <MapPin size={14} aria-hidden="true" /> ซอยบุญคีรี 6 · สมุทรปราการ
        </p>
      </section>

      <section className="px-6 py-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md rise" style={{ animationDelay: "200ms" }}>
          <p className="eyebrow mb-2">Members Club</p>
          {session.isSuccess && session.data ? (
            <div className="panel p-7 space-y-5" data-testid="panel-session">
              <h2 className="font-display text-2xl font-semibold">ยินดีต้อนรับกลับ</h2>
              <p className="text-[var(--muted)] text-sm">อุปกรณ์นี้เข้าสู่ระบบอยู่แล้ว บัตร <span className="font-mono text-[var(--gold-2)]">{session.data.member_code}</span></p>
              <Link href="/card" className="btn btn-neon w-full" data-testid="link-open-card">เปิดบัตรของฉัน <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl font-semibold mb-6">{tab === "login" ? "เปิดบัตรของคุณ" : "รับบัตรใบใหม่"}</h2>
              <div role="tablist" aria-label="เลือกการเข้าใช้" className="flex gap-1 p-1 rounded-2xl border border-[var(--line)] mb-6">
                <button role="tab" id="tab-login" aria-selected={tab === "login"} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login">เข้าสู่ระบบ</button>
                <button role="tab" id="tab-register" aria-selected={tab === "register"} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register">สมัครสมาชิก</button>
              </div>
              <div id="panel-auth" role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel p-6 sm:p-7">
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
