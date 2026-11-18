"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { api } from "./loyalty-api";
import { BrandIcon } from "./brand-icon";
import { SamutPrakanArt } from "./samut-prakan-art";
import { LoginForm, RegisterForm } from "./auth-forms";
import { BrandButton } from "./brand-button";
import { LineOaContact } from "./line-oa-contact";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Jaguar+spk+%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B8%81%E0%B8%B1%E0%B8%8D%E0%B8%8A%E0%B8%B2+%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%89%E0%B8%B1%E0%B8%99/@13.6100796,100.6008541,17z/data=!3m1!4b1!4m6!3m5!1s0x30e2a17b24c91b0f:0x2dd52ed6c8dbd489!8m2!3d13.6100796!4d100.6008541!16s%2Fg%2F11z_klv87h?hl=th&entry=ttu&g_ep=EgoyMDI2MTExNS4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_MAPS_EMBED_URL = "https://maps.google.com/maps?q=13.6100796,100.6008541&z=17&output=embed";
const LINE_OA_URL = "https://line.me/R/ti/p/@880beqva";

const PRODUCTS = [
  {
    name: "เครื่องดื่ม JAGUAR SPK",
    detail: "มี 3 สีฝา",
    bottles: [
      { src: "/brand/product-kratom-gold.webp", alt: "ขวด JAGUAR SPK ฝาสีทอง" },
      { src: "/brand/product-kratom-blue.webp", alt: "ขวด JAGUAR SPK ฝาสีน้ำเงิน" },
      { src: "/brand/product-kratom-red.webp", alt: "ขวด JAGUAR SPK ฝาสีแดง" },
    ],
  },
  {
    src: "/brand/product-tobacco-tin.webp",
    name: "กรองทิพย์",
    detail: "สินค้าในร้าน",
    alt: "ผลิตภัณฑ์กรองทิพย์ในบรรจุภัณฑ์สีแดง",
  },
  {
    src: "/brand/product-vess-packs.webp",
    name: "VESS",
    detail: "Advance · Menthol",
    alt: "ผลิตภัณฑ์ VESS สองรุ่น Advance และ Menthol",
  },
] as const;

export function Welcome({ initialTab }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab ?? "login");
  const [mapPopupOpen, setMapPopupOpen] = useState(false);
  const mapTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const closeMapPopup = () => setMapPopupOpen(false);
    window.addEventListener("jaguar:close-map-popup", closeMapPopup);
    return () => window.removeEventListener("jaguar:close-map-popup", closeMapPopup);
  }, []);
  const closeMapPopup = useCallback(() => {
    setMapPopupOpen(false);
    mapTriggerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!mapPopupOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMapPopup();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mapPopupOpen, closeMapPopup]);
  const session = useQuery<{ authenticated: boolean }>({ queryKey: ["/api/loyalty/session"], queryFn: () => api("/api/loyalty/session"), enabled: initialTab !== undefined, retry: false, refetchOnWindowFocus: false });

  if (initialTab === undefined) {
    return (
      <>
      <main className="jaguar-home jaguar-home--landing customer-art-root min-h-[100dvh]">
        <SamutPrakanArt />
        <header className="jh-header">
          <div className="jh-header__inner">
            <Link href="/" className="jh-brand" aria-label="JAGUAR SPK หน้าแรก">
              <Image src="/ui/jaguar-spk-emblem.png" alt="โลโก้ JAGUAR SPK" width={1254} height={1162} priority sizes="52px" />
              <span><strong>JAGUAR SPK</strong><small>บุญศิริ ซอย 6 · สมุทรปราการ</small></span>
            </Link>
            <nav className="jh-nav" aria-label="เมนูหลัก">
              <a href="#products">สินค้า</a>
              <a href="#membership">สมาชิก</a>
              <a href="#about">รู้จักร้าน</a>
              <a href="#contact">ติดต่อ</a>
            </nav>
            <div className="jh-access">
              <Link href="/admin?desk=staff" data-testid="link-staff"><BrandIcon name="staffAccess" size={15} tone="emerald" />พนักงาน</Link>
              <Link href="/admin" data-testid="link-owner"><BrandIcon name="dashboard" size={15} tone="gold" />เจ้าของร้าน</Link>
            </div>
          </div>
        </header>
        <div className="jh-shell">
          <section className="jh-hero" aria-labelledby="landing-title">
            <div className="jh-hero__copy">
              <p className="jh-kicker">ร้านประจำย่าน · สมุทรปราการ</p>
              <h1 id="landing-title">JAGUAR SPK<br /><span>ร้านใกล้บ้านของคุณ</span></h1>
              <p className="jh-hero__intro">แวะเลือกสินค้าที่ร้าน หรือเริ่มใช้บัตรสมาชิกได้ง่าย ๆ บนมือถือ</p>
              <div className="jh-hero__actions">
                <BrandButton href="/login?mode=register" asset="btn-jaguar" label="สมัครสมาชิก" testId="link-open-wallet" />
                <BrandButton href="/login" asset="btn-leaf" label="เข้าสู่ระบบสมาชิก" testId="link-member-login" />
              </div>
              <a className="jh-hero__location" href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="location" size={17} tone="emerald" />บุญศิริ ซอย 6 · เปิดแผนที่ร้าน
              </a>
            </div>
            <div className="jh-hero__visual">
              <Image
                src="/brand/product-kratom-gold.webp"
                alt="ขวดเครื่องดื่ม JAGUAR SPK ฝาสีทอง"
                width={768}
                height={768}
                priority
                sizes="(max-width: 720px) 78vw, 440px"
              />
              <span className="jh-hero__image-label">JAGUAR SPK · สินค้าในร้าน</span>
            </div>
          </section>

          <section className="jh-clubs" aria-label="บัตรสมาชิก Jaguar">
            <Link href="/card" className="jh-club">
              <Image src="/brand/icon-card-kratom.svg" alt="" width={28} height={28} />
              <span><strong>บัตรสมาชิกกระท่อม</strong><small>เปิดดูบัตรของคุณ</small></span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/card/cannabis" className="jh-club">
              <Image src="/brand/icon-card-cannabis.svg" alt="" width={28} height={28} />
              <span><strong>บัตรสมาชิกกัญชา</strong><small>เปิดดูบัตรของคุณ</small></span>
              <span aria-hidden="true">↗</span>
            </Link>
          </section>
          <figure className="landing-member-guide">
            <Image
              src="/brand/jaguar-member-guide-v3.webp"
              alt="คู่มือสมาชิก JAGUAR SPK: สมัครสมาชิก สะสมแต้มทุกครั้งที่ซื้อ และรับรางวัลเมื่อครบ 10 แต้ม"
              width={1024}
              height={683}
              priority
              sizes="(max-width: 540px) calc(100vw - 32px), (max-width: 1000px) 90vw, 900px"
            />
          </figure>
          <figure className="landing-member-guide landing-delivery-promo">
            <Image
              src="/brand/jaguar-delivery-promo.webp"
              alt="โปสเตอร์โปรโมชัน JAGUAR SPK บริการจัดส่งในสมุทรปราการ พร้อมภาพแอปและ QR สำหรับสั่งซื้อ"
              width={2400}
              height={1792}
              sizes="(max-width: 540px) calc(100vw - 32px), (max-width: 1000px) 90vw, 900px"
            />
          </figure>
          <details className="landing-menu-preview">
            <summary>เมนูหน้าร้าน</summary>
            <Image src="/brand/jaguar-price-board.webp" alt="เมนูสินค้าและราคาหน้าร้าน" width={760} height={760} sizes="(max-width: 440px) 90vw, 440px" />
          </details>

          <section className="jh-section" id="products" aria-labelledby="landing-products-title">
            <div className="jh-section__heading">
              <p className="jh-kicker">สินค้าในร้าน</p>
              <h2 id="landing-products-title">เลือกชมสินค้า</h2>
              <p>ภาพสินค้าบางส่วนที่มีในร้าน สอบถามรายละเอียดได้ทาง LINE OA</p>
            </div>
            <div className="jh-products">
              {PRODUCTS.map((product) => (
                <article className="jh-product" key={product.name}>
                  {("bottles" in product) ? (
                    <div className="jh-product__bottles">
                      {product.bottles.map((bottle) => (
                        <div className="jh-product__bottle" key={bottle.src}>
                          <Image src={bottle.src} alt={bottle.alt} width={768} height={768} loading="lazy" sizes="(max-width: 520px) 28vw, 120px" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="jh-product__image">
                      <Image src={product.src} alt={product.alt} width={768} height={768} loading="lazy" sizes="(max-width: 520px) 90vw, (max-width: 900px) 42vw, 360px" />
                    </div>
                  )}
                  <div className="jh-product__caption"><strong>{product.name}</strong><span>{product.detail}</span></div>
                </article>
              ))}
            </div>
          </section>

          <section className="jh-section jh-membership" id="membership" aria-labelledby="jh-membership-title">
            <div className="jh-section__heading">
              <p className="jh-kicker">JAGUAR MEMBER</p>
              <h2 id="jh-membership-title">สมาชิก ใช้ง่ายทุกครั้งที่แวะ</h2>
              <p>เริ่มต้นจากมือถือ แล้วใช้บัตรสมาชิกที่เคาน์เตอร์</p>
            </div>
            <div className="jh-benefits">
              <article>
                <div className="jh-benefit__meta"><BrandIcon name="members" size={19} tone="emerald" /><span className="jh-benefit__number">01</span></div>
                <h3>สมัครสมาชิก</h3><p>สร้างบัตรสมาชิกจากหน้าเว็บ</p>
              </article>
              <article>
                <div className="jh-benefit__meta"><BrandIcon name="qr" size={19} tone="emerald" /><span className="jh-benefit__number">02</span></div>
                <h3>แสดงบัตรที่ร้าน</h3><p>เปิดบัตรบนมือถือให้พนักงานสแกน</p>
              </article>
              <article>
                <div className="jh-benefit__meta"><BrandIcon name="points" size={19} tone="emerald" /><span className="jh-benefit__number">03</span></div>
                <h3>สะสมแต้ม</h3><p>แต้มจะแสดงอยู่บนบัตรสมาชิก</p>
              </article>
              <article>
                <div className="jh-benefit__meta"><BrandIcon name="phone" size={19} tone="emerald" /><span className="jh-benefit__number">04</span></div>
                <h3>สอบถามสิทธิ์</h3><p>สอบถามรายละเอียดกับพนักงานหรือทาง LINE</p>
              </article>
            </div>
            <div className="jh-membership__links">
              <Link href="/login?mode=register">สมัครสมาชิก <span aria-hidden="true">↗</span></Link>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">ดูข้อมูลร้านและรีวิวบน Google Maps <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <section className="jh-about" id="about" aria-labelledby="jh-about-title">
            <div className="jh-about__brand">
              <Image src="/ui/jaguar-spk-emblem.png" alt="" width={1254} height={1162} loading="lazy" sizes="(max-width: 600px) 88px, 112px" />
            </div>
            <div>
              <p className="jh-kicker">ร้านชุมชน · สมุทรปราการ</p>
              <h2 id="jh-about-title">แวะมาพบกันที่ร้าน</h2>
              <p>JAGUAR SPK เป็นร้านในย่านบุญศิริ ซอย 6 พร้อมบัตรสมาชิกดิจิทัลสำหรับลูกค้าที่ต้องการสะสมแต้ม</p>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="jh-text-link">
                <BrandIcon name="location" size={17} tone="emerald" />ดูตำแหน่งและข้อมูลร้านบน Google Maps
              </a>
            </div>
            <figure className="jh-shop-map">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                title="แผนที่ตำแหน่งร้าน JAGUAR SPK บุญศิริ ซอย 6 สมุทรปราการ"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <figcaption><span>JAGUAR SPK</span><span>บุญศิริ ซอย 6 · สมุทรปราการ</span></figcaption>
            </figure>
          </section>

          <section className="jh-contact" id="contact" aria-labelledby="jh-contact-title">
            <div>
              <p className="jh-kicker">ติดต่อร้าน</p>
              <h2 id="jh-contact-title">มีคำถามเรื่องสินค้า หรือสมาชิก?</h2>
              <p>ส่งข้อความถึงร้าน หรือดูตำแหน่งก่อนแวะมา</p>
            </div>
            <div className="jh-contact__actions">
              <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="jh-map-link" aria-label="เปิดแชตร้านทาง LINE OA">
                LINE OA <BrandIcon name="continue" size={16} tone="emerald" />
              </a>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="jh-map-link">
                <BrandIcon name="location" size={18} tone="emerald" />แผนที่ร้าน
              </a>
            </div>
          </section>

          <footer className="jh-footer">
            <Link href="/" className="jh-footer__brand">JAGUAR SPK</Link>
            <span>บุญศิริ ซอย 6 · สมุทรปราการ</span>
            <div><Link href="/staff">พนักงาน</Link><Link href="/owner">เจ้าของร้าน</Link></div>
          </footer>
        </div>
        <LineOaContact placement="landing" />
      </main>
        <div className={`landing-map-float${mapPopupOpen ? " landing-map-float--open" : ""}`}>
          <section
            id="landing-map-popup"
            className="landing-map-popup"
            aria-label="ตำแหน่งร้าน JAGUAR SPK"
            aria-hidden={!mapPopupOpen}
          >
            <button
              type="button"
              className="landing-map-popup__close"
              aria-label="ปิดรายละเอียดแผนที่"
              tabIndex={mapPopupOpen ? 0 : -1}
              onClick={closeMapPopup}
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="landing-map-popup__brand">
              <span className="landing-map-popup__mark"><BrandIcon name="location" size={20} tone="emerald" /></span>
              <span>
                <strong>JAGUAR SPK</strong>
                <small>ร้านกระท่อม · กัญชา · น้ำท่อม</small>
              </span>
            </div>
            <p>บุญศิริ ซอย 6 · สมุทรปราการ</p>
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" tabIndex={mapPopupOpen ? 0 : -1} data-testid="link-home-map">
              เปิด Google Maps <span aria-hidden="true">↗</span>
            </a>
          </section>
          <button
            type="button"
            ref={mapTriggerRef}
            className="landing-map-float__trigger"
            aria-expanded={mapPopupOpen}
            aria-controls="landing-map-popup"
            aria-label={mapPopupOpen ? "ปิดแผนที่ร้าน" : "เปิดแผนที่ร้าน"}
            data-testid="button-map-popup"
            onClick={() => {
              window.dispatchEvent(new Event("jaguar:close-line-popup"));
              setMapPopupOpen((open) => !open);
            }}
          >
            <BrandIcon name="location" size={20} tone="emerald" />
            <span>แผนที่ร้าน</span>
          </button>
        </div>
      </>
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
                <button role="tab" id="tab-login" aria-selected={tab === "login"} tabIndex={tab === "login" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login"><span className="inline-flex items-center gap-2"><BrandIcon name="staffAccess" size={16} tone={tab === "login" ? "emerald" : "neutral"} />เข้าใช้</span></button>
                <button role="tab" id="tab-register" aria-selected={tab === "register"} tabIndex={tab === "register" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register"><span className="inline-flex items-center gap-2"><BrandIcon name="members" size={16} tone={tab === "register" ? "gold" : "neutral"} />สมัคร</span></button>
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
