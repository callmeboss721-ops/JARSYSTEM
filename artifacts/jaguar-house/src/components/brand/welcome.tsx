"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { api, type MemberCardData } from "./loyalty-api";
import { BrandIcon } from "./brand-icon";
import { SamutPrakanArt } from "./samut-prakan-art";
import { LoginForm, RegisterForm } from "./auth-forms";

export function Welcome({ initialTab }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab ?? "login");
  const session = useQuery<MemberCardData>({ queryKey: ["/api/loyalty/card"], queryFn: () => api("/api/loyalty/card"), enabled: initialTab !== undefined, retry: false, refetchOnWindowFocus: false });

  if (initialTab === undefined) {
    return (
      <main className="jaguar-home jaguar-home--landing customer-art-root min-h-[100dvh]">
        <SamutPrakanArt />
        <header className="landing-header landing-enter landing-enter--header">
          <Link href="/" className="landing-brand" aria-label="JAGUAR SPK หน้าแรก">
            <span className="landing-brand__logo">
              <Image src="/brand/jaguar-spk-emblem.webp" alt="JAGUAR SPK · Break All Limit" width={999} height={746} priority sizes="(max-width: 760px) 76px, 92px" />
            </span>
            <span className="landing-brand__copy"><small>KRATOM</small><small>BUN KHIRI SOI 6</small></span>
          </Link>
          <nav className="landing-header__actions" aria-label="ทางเข้าพนักงาน">
            <Link href="/admin?desk=staff" data-testid="link-staff">พนักงาน</Link>
            <Link href="/admin" data-testid="link-owner">เจ้าของร้าน</Link>
          </nav>
        </header>
        <div className="landing-shell">
          <section className="landing-feature landing-enter landing-enter--hero" aria-labelledby="landing-title">
            <div className="landing-feature__copy">
              <p className="landing-eyebrow">NEIGHBORHOOD MEMBERSHIP · SAMUT PRAKAN</p>
              <h1 id="landing-title">
                จากัวร์ พลังใบ
                <span>ซุปเปอร์ฮีโร่ของคนไทย</span>
              </h1>
              <p className="landing-subcopy">แวะที่บุญศิริ ซอย 6 สะสมแต้ม แล้วเปิดบัตรจากมือถือได้เลย</p>
              <div className="landing-ctas">
                <Link href="/login?mode=register" className="btn btn-gold" data-testid="link-open-wallet">สมัครสมาชิก <BrandIcon name="continue" tone="inherit" /></Link>
                <Link href="/login" className="btn btn-ghost" data-testid="link-member-login">เข้าสู่ระบบ <BrandIcon name="members" tone="gold" /></Link>
              </div>
              <div className="landing-local-note">
                <span className="landing-local-note__mark" aria-hidden="true" />
                <span><strong>JAGUAR KRATOM</strong><small>บุญศิริ ซอย 6 · สมุทรปราการ</small></span>
              </div>
            </div>
            <figure className="landing-campaign landing-campaign--hero landing-members-club">
              <div className="landing-members-club__topline">
                <span>01 / MEMBERS CLUB</span>
                <span>JAGUAR SPK</span>
              </div>
              <div className="landing-members-club__art">
                <Image
                  src="/brand/jaguar-spk-promo.png"
                  alt="ภาพโปรโมชัน Jaguar SPK พี่เสือและทีมงาน พร้อมเวลาเปิด 24 ชั่วโมง ราคาเริ่มต้น 50 บาท และพิกัดบุญคีรี ซอย 6"
                  width={500}
                  height={500}
                  priority
                  sizes="(max-width: 760px) 78vw, 430px"
                />
              </div>
              <figcaption className="landing-members-club__footer">
                <span>เปิด 24 ชั่วโมง · เริ่มต้นขวดละ 50.-</span>
              </figcaption>
            </figure>
          </section>

          <section className="landing-details" aria-label="รายละเอียดร้านและสมาชิก">
            <div className="landing-price">
              <div className="landing-section-heading">
                <span className="landing-kicker">AT THE COUNTER</span>
                <h2>เมนูที่หน้าร้าน</h2>
                <p>รายการสินค้าและราคาจากทางร้าน</p>
              </div>
              <figure className="landing-campaign landing-campaign--board">
                <Image
                  src="/brand/campaign/jaguar-price-board.jpg"
                  alt="ป้ายประชาสัมพันธ์ร้าน แสดงรายการเครื่องดื่มกระท่อมและกัญชาพรีเมียมตามที่ระบุในภาพ"
                  width={1024}
                  height={1024}
                  sizes="(max-width: 760px) 100vw, 48vw"
                />
                <figcaption><span>JAGUAR KRATOM</span><span>รายการหน้าร้าน</span></figcaption>
              </figure>
            </div>
            <div className="landing-members">
              <div className="landing-section-heading">
                <span className="landing-kicker">MADE FOR THE NEIGHBORHOOD</span>
                <h2>สมาชิกจากัวร์</h2>
                <p className="landing-reward-rule">กระท่อมทุก 3 ขวดในบิลเดียว รับ 1 แต้ม · ครบ 10 แต้ม ฟรี 1 ขวด</p>
                <p>สมัครด้วยเบอร์โทร แล้วเปิดบัตรบนมือถือที่เคาน์เตอร์</p>
              </div>
              <ol className="landing-steps">
                <li><span>01</span><strong>สมัครสมาชิก</strong><small>ใช้เบอร์โทรของคุณ</small></li>
                <li><span>02</span><strong>สะสมแต้ม</strong><small>แสดงบัตรเมื่อแวะซื้อ</small></li>
                <li><span>03</span><strong>แลกรางวัล</strong><small>ตรวจสอบสิทธิ์ในบัตร</small></li>
              </ol>
              <Link href="/login?mode=register" className="landing-text-link">เริ่มต้นเป็นสมาชิก <BrandIcon name="continue" tone="gold" /></Link>
            </div>
          </section>

          <nav className="landing-bottom-nav landing-enter landing-enter--nav" aria-label="เมนูสมาชิก">
            <Link href="/card" data-selected="true"><BrandIcon name="leaf" tone="inherit" /><span>บัตรกระท่อม</span></Link>
            <Link href="/card/cannabis"><BrandIcon name="cannabis" tone="emerald" /><span>บัตรกัญชา</span></Link>
            <Link href="/redeem"><BrandIcon name="rewards" tone="gold" /><span>รางวัลกระท่อม</span></Link>
          </nav>
          <footer className="landing-footer"><span>JAGUAR KRATOM</span><span>บุญศิริ ซอย 6 · สมุทรปราการ</span></footer>
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
          <div className="brand-showcase mb-5 flex justify-center rise" style={{ animationDelay: "80ms" }} aria-hidden="true">
            <BrandIcon name="lightning" size={24} tone="emerald" className="brand-showcase__icon brand-showcase__bolt" />
            <BrandIcon name="leaf" size={23} tone="emerald" className="brand-showcase__icon brand-showcase__kratom" />
            <BrandIcon name="cannabis" size={21} tone="emerald" className="brand-showcase__icon brand-showcase__cannabis" />
            <Image
              className="brand-showcase__campaign"
              src="/brand/jaguar-spk-campaign-square.jpg"
              alt="โปสเตอร์ JAGUAR SPK เปิด 24 ชั่วโมง ราคาเริ่มต้นขวดละ 50 บาท ที่บุญคีรี ซอย 6"
              width={2048}
              height={2048}
              priority
              sizes="(max-width: 760px) 62vw, 310px"
            />
          </div>
          <p className="brand-slogan-inline lg:hidden" data-testid="brand-slogan-mobile">พี่เสือพลังใบ ซุปเปอร์ฮีโร่ของคนไทย</p>
          <p className="brand-promo-subtitle">Jaguar SPK · เปิด 24 ชม. · บุญคีรี ซอย 6</p>
          <div className="flex items-baseline justify-between gap-2 mb-2 lg:hidden">
            <p className="eyebrow !mb-0">Private Members</p>
            <p className="shrink-0 text-xs font-semibold text-[var(--gold-2)]">ครบ 10 · ฟรี 1 ขวด</p>
          </div>
          <p className="eyebrow mb-2 hidden lg:block">Private Members</p>
          {session.isSuccess && session.data ? (
              <div className="panel auth-panel p-7 space-y-5" data-testid="panel-session">
              <h2 className="font-display text-2xl font-semibold">ยินดีต้อนรับกลับ</h2>
              <p className="text-[var(--muted)] text-sm">อุปกรณ์นี้เข้าสู่ระบบอยู่แล้ว บัตร <span className="font-mono text-[var(--gold-2)]">{session.data.member_code}</span></p>
              <Link href="/card" className="btn btn-neon w-full" data-testid="link-open-card">เปิดบัตรของฉัน <BrandIcon name="continue" tone="inherit" /></Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-5">{tab === "login" ? "เปิดบัตรของคุณ" : "รับบัตรใบใหม่"}</h2>
              <div role="tablist" onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const next = tab === "login" ? "register" : "login"; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} aria-label="เลือกการเข้าใช้" className="pill-switch flex gap-1 p-1 mb-5">
                <button role="tab" id="tab-login" aria-selected={tab === "login"} tabIndex={tab === "login" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login">เข้าสู่ระบบ</button>
                <button role="tab" id="tab-register" aria-selected={tab === "register"} tabIndex={tab === "register" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register">สมัครสมาชิก</button>
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
