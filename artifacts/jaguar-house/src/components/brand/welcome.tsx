"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { api } from "./loyalty-api";
import { BrandIcon } from "./brand-icon";
import { SamutPrakanArt } from "./samut-prakan-art";
import { LoginForm, RegisterForm } from "./auth-forms";
import { BrandButton } from "./brand-button";
import { RankEmblem } from "./rank-emblem";

export function Welcome({ initialTab }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab ?? "login");
  const session = useQuery<{ authenticated: boolean }>({ queryKey: ["/api/loyalty/session"], queryFn: () => api("/api/loyalty/session"), enabled: initialTab !== undefined, retry: false, refetchOnWindowFocus: false });

  if (initialTab === undefined) {
    return (
      <main className="jaguar-home jaguar-home--landing customer-art-root min-h-[100dvh]">
        <div className="landing-atmosphere" aria-hidden="true">
          <svg className="landing-atmosphere__botanical landing-atmosphere__botanical--left" viewBox="0 0 180 220" focusable="false">
            <path d="M20 196C62 148 76 91 83 22M41 165C23 137 18 116 22 94c21 12 34 30 39 53M58 133c-2-29 5-51 20-68 12 22 14 44 7 67M72 99c-1-22 6-41 20-57 11 19 13 38 7 56M33 173c25-4 45-15 60-33" />
          </svg>
          <svg className="landing-atmosphere__botanical landing-atmosphere__botanical--right" viewBox="0 0 180 220" focusable="false">
            <path d="M160 197C118 150 104 92 97 22M139 165c18-28 23-49 19-71-21 12-34 30-39 53m-1-14c2-29-5-51-20-68-12 22-14 44-7 67m13-33c1-22-6-41-20-57-11 19-13 38-7 56m54 48c-25-4-45-15-60-33" />
          </svg>
        </div>
        <SamutPrakanArt />
        <header className="landing-header landing-enter landing-enter--header">
          <Link href="/" className="landing-brand" aria-label="JAGUAR SPK หน้าแรก">
            <span className="landing-brand__logo">
              <Image src="/ui/jaguar-spk-emblem.png" alt="โลโก้ JAGUAR SPK รูปจากัวร์" width={1254} height={1162} priority sizes="(max-width: 390px) 80px, (max-width: 760px) 88px, 110px" />
            </span>
            <span className="landing-brand__copy"><small>KRATOM · SOI 6</small></span>
          </Link>
          <nav className="landing-header__actions" aria-label="ทางเข้าพนักงาน">
            <Link href="/admin?desk=staff" data-testid="link-staff">พนักงาน</Link>
            <Link href="/admin" data-testid="link-owner">เจ้าของร้าน</Link>
          </nav>
        </header>
        <div className="landing-shell">
          <section className="landing-feature landing-enter landing-enter--hero" aria-labelledby="landing-title">
            <div className="landing-feature__copy">
              <h1 id="landing-title">
                พี่เสือพลังใบ
                <span>ซุปเปอร์ฮีโร่ของคนไทย</span>
              </h1>
              <div className="landing-ctas">
                <BrandButton href="/login?mode=register" asset="btn-jaguar" label="เปิดบัตรสมาชิก" testId="link-open-wallet" />
                <BrandButton href="/login" asset="btn-leaf" label="เข้าใช้งาน" testId="link-member-login" />
              </div>
            </div>
          </section>

          <section className="landing-club-previews" aria-label="บัตรสมาชิก">
            <Link href="/card" className="landing-club-preview landing-club-preview--text-only" aria-label="ดูบัตรสมาชิกกระท่อม">
              <span className="landing-club-preview__caption"><RankEmblem name="nature-green" size={18} /><span>กระท่อม</span></span>
            </Link>
            <Link href="/card/cannabis" className="landing-club-preview landing-club-preview--text-only" aria-label="ดูบัตรสมาชิกกัญชา">
              <span className="landing-club-preview__caption"><RankEmblem name="organic-premium" size={18} /><span>กัญชา</span></span>
            </Link>
          </section>
          <figure className="landing-member-guide">
            <Image
              src="/brand/jaguar-landing-promo.jpg"
              alt="โปรโมชัน JAGUAR SPK: น้ำกระท่อมเริ่มต้น 50 บาท และกัญชาเกรดพรีเมียม 10 บาทต่อกรัม"
              width={2752}
              height={1536}
              priority
              sizes="(max-width: 540px) calc(100vw - 32px), 540px"
            />
          </figure>
          <details className="landing-menu-preview">
            <summary>เมนูหน้าร้าน</summary>
            <Image src="/brand/jaguar-price-board.webp" alt="เมนูสินค้าและราคาหน้าร้าน" width={760} height={760} sizes="(max-width: 440px) 90vw, 440px" />
          </details>

          <footer className="landing-site-footer" aria-label="ไอคอนท้ายหน้า">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M12 2.3a9.7 9.7 0 0 0-3.07 18.9c.49.09.66-.21.66-.47v-1.68c-2.7.59-3.27-1.14-3.27-1.14-.44-1.12-1.08-1.42-1.08-1.42-.88-.6.07-.59.07-.59.97.07 1.48 1 1.48 1 .86 1.48 2.25 1.05 2.8.8.09-.63.34-1.05.61-1.29-2.15-.24-4.41-1.08-4.41-4.8 0-1.06.38-1.92 1-2.6-.1-.25-.44-1.23.1-2.57 0 0 .82-.26 2.67.99a9.3 9.3 0 0 1 4.86 0c1.85-1.25 2.67-.99 2.67-.99.54 1.34.2 2.32.1 2.57.62.68 1 1.54 1 2.6 0 3.73-2.27 4.55-4.43 4.79.35.3.66.89.66 1.79v2.65c0 .26.18.57.67.47A9.7 9.7 0 0 0 12 2.3Z" />
            </svg>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <div className={`customer-art-root min-h-[100dvh] ${initialTab === "login" ? "login-reference-root" : "auth-register-root grid lg:grid-cols-[1.1fr_1fr]"}`}>
      <SamutPrakanArt />
      <section className="auth-stage relative overflow-hidden order-2 lg:order-1 px-6 pt-10 pb-12 lg:p-16 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-[var(--line)]">
        <div className="rosette-field absolute inset-0 opacity-[.05] pointer-events-none" aria-hidden="true" />
        <div className="relative hidden lg:flex items-center justify-between rise">
          <span className="leading-tight">
            <span className="block font-display text-xs font-semibold tracking-[.2em] text-[var(--gold-2)]">JAGUAR KRATOM</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">บุญศิริ ซอย 6 · สมุทรปราการ</span>
          </span>
          <span className="flex gap-1"><Link href="/staff" className="inline-flex items-center min-h-11 px-3 text-xs text-[var(--emerald-2)] no-underline font-mono tracking-widest" data-testid="link-staff">STAFF DESK</Link><Link href="/owner" className="inline-flex items-center min-h-11 px-3 text-xs text-[var(--gold-2)] no-underline" data-testid="link-owner">ห้องเจ้าของร้าน</Link></span>
        </div>

          <div className="relative lg:my-0 hidden lg:flex flex-col items-start">
          <h1 aria-label="พี่เสือพลังใบ ซุปเปอร์ฮีโร่ของคนไทย" className="font-display font-semibold leading-[1.1] tracking-tight text-[30px] sm:text-[44px] lg:text-[60px] rise" style={{ animationDelay: "120ms" }}>
            พี่เสือพลังใบ<br />
            <span className="text-[var(--gold-2)]">ซุปเปอร์ฮีโร่<br />ของคนไทย</span>
          </h1>
          <div className="hairline w-24 mt-6" aria-hidden="true" />
          <p className="mt-6 max-w-md text-[var(--gold-2)] font-display font-semibold text-lg sm:text-xl rise" style={{ animationDelay: "200ms" }}>
            สะสม 10 แต้ม รับฟรี 1 ขวด
          </p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">บัตรอยู่ในมือถือ แสดง QR ที่เคาน์เตอร์ทุกครั้งที่ซื้อ</p>
            <ol className="loyalty-steps mt-8 hidden sm:grid grid-cols-3 gap-3 max-w-md w-full rise list-none p-0" style={{ animationDelay: "260ms" }}>
            {[["01", "สมัครด้วยเบอร์"], ["02", "สะสมแต้ม"], ["03", "แลกรางวัล"]].map(([n, t]) => (
              <li key={n} className="panel min-w-0 p-4">
                <span className="font-mono text-xs text-[var(--gold)]">{n}</span>
                <p className="text-sm mt-1">{t}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative mt-10 lg:mt-0 lg:hidden flex items-center gap-2 text-xs text-[var(--muted)]">
          <BrandIcon name="location" tone="neutral" /> บุญศิริ ซอย 6 · สมุทรปราการ
        </p>
      </section>

      <section className="order-1 lg:order-2 px-5 sm:px-6 pt-5 pb-10 lg:p-16 flex items-start lg:items-center justify-center">
        <div className="auth-form-layout w-full max-w-md rise">
          {initialTab !== "login" && (
            <nav aria-label="เมนูพนักงาน" className="flex lg:hidden justify-end mb-4">
              <Link href="/staff" className="inline-flex items-center min-h-11 px-3 text-xs text-[var(--emerald-2)] no-underline font-mono" data-testid="link-staff-mobile">พนักงาน</Link>
              <Link href="/owner" className="inline-flex items-center min-h-11 px-3 text-xs text-[var(--gold-2)] no-underline" data-testid="link-owner-mobile">เจ้าของร้าน</Link>
            </nav>
          )}
          <div className="brand-showcase mb-4 flex justify-center rise" style={{ animationDelay: "80ms" }}>
            <Image
              className="brand-showcase__campaign"
              src="/ui/jaguar-spk-wordmark.png"
              alt="โลโก้ตัวอักษร JAGUAR SPK"
              width={1416}
              height={575}
              priority
              sizes="(max-width: 760px) 82vw, 400px"
            />
          </div>
          {session.isSuccess && session.data?.authenticated ? (
              <div className="panel auth-panel p-7 space-y-5" data-testid="panel-session">
              <h2 className="font-display text-2xl font-semibold">เข้าสู่ระบบแล้ว</h2>
              <BrandButton href="/card" asset="btn-jaguar" label="เปิดบัตรสมาชิก" testId="link-open-card" />
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-4">{tab === "login" ? "บัตรสมาชิก" : "เปิดบัตรใหม่"}</h2>
              <div role="tablist" onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const next = tab === "login" ? "register" : "login"; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} aria-label="เลือกการเข้าใช้" className="pill-switch flex gap-1 p-1 mb-5">
                <button role="tab" id="tab-login" aria-selected={tab === "login"} tabIndex={tab === "login" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login">เข้าใช้</button>
                <button role="tab" id="tab-register" aria-selected={tab === "register"} tabIndex={tab === "register" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register">สมัคร</button>
              </div>
              <div id="panel-auth" role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel auth-panel auth-form-panel p-5 sm:p-7">
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
