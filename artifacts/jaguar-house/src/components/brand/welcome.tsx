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

const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Jaguar+spk+%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B8%81%E0%B8%B1%E0%B8%8D%E0%B8%8A%E0%B8%B2+%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%89%E0%B8%B1%E0%B8%99/@13.6100796,100.6008541,17z/data=!3m1!4b1!4m6!3m5!1s0x30e2a17b24c91b0f:0x2dd52ed6c8dbd489!8m2!3d13.6100796!4d100.6008541!16s%2Fg%2F11z_klv87h?hl=th&entry=ttu&g_ep=EgoyMDI2MTExNS4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_MAPS_EMBED_URL = "https://maps.google.com/maps?q=13.6100796,100.6008541&z=17&output=embed";

const PRODUCTS = [
  {
    name: "เครื่องดื่ม JAGUAR SPK",
    detail: "ภาพตัวอย่าง · สอบถามสต็อก",
    bottles: [
      { src: "/brand/product-kratom-gold.webp", alt: "ขวด JAGUAR SPK ฝาสีทอง" },
      { src: "/brand/product-kratom-blue.webp", alt: "ขวด JAGUAR SPK ฝาสีน้ำเงิน" },
      { src: "/brand/product-kratom-red.webp", alt: "ขวด JAGUAR SPK ฝาสีแดง" },
    ],
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
              <span><strong>JAGUAR SPK</strong><small>97/56 ซอยบุญศิริ 6 · สมุทรปราการ</small></span>
            </Link>
            <nav className="jh-nav" aria-label="เมนูหลัก">
              <a href="#products">สินค้า</a>
              <a href="#membership">สมาชิก</a>
              <a href="#about">รู้จักร้าน</a>
              <Link href="/brand">รู้จัก JAGUAR SPK</Link>
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
                <BrandIcon name="location" size={17} tone="emerald" />97/56 ซอยบุญศิริ 6 · เปิดแผนที่ร้าน
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
              <Image
                src="/brand/jaguar-spk-mascot-face.webp"
                alt=""
                aria-hidden="true"
                width={112}
                height={112}
                className="jh-hero__mascot"
                sizes="72px"
              />
              <span className="jh-hero__image-label">JAGUAR SPK · ภาพตัวอย่าง</span>
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
          <section className="jh-section" id="products" aria-labelledby="landing-products-title">
            <div className="jh-section__heading">
              <p className="jh-kicker">ภาพตัวอย่างสินค้า</p>
              <h2 id="landing-products-title">เครื่องดื่ม JAGUAR SPK</h2>
              <p>เจ้าของยืนยันราคา ฿60 ต่อขวด · ภาพเป็นตัวอย่าง สอบถามสต็อกก่อนซื้อ</p>
            </div>
            <div className="jh-products">
              {PRODUCTS.map((product) => (
                <article className="jh-product" key={product.name}>
                  <div className="jh-product__bottles">
                    {product.bottles.map((bottle) => (
                      <div className="jh-product__bottle" key={bottle.src}>
                        <Image
                          src={bottle.src}
                          alt={bottle.alt}
                          width={768}
                          height={768}
                          loading="lazy"
                          sizes="(max-width: 520px) 28vw, 120px"
                        />
                      </div>
                    ))}
                    </div>
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
                <h3>สอบถามสิทธิ์</h3><p>สอบถามรายละเอียดกับพนักงานหรือโทรหาร้าน</p>
              </article>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              โปรโมชันที่ร้านยืนยัน: สะสม 10 แต้ม รับฟรี 1 รายการ · สอบถามสินค้าที่ร่วมรายการและเงื่อนไข
            </p>
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
              <p>JAGUAR SPK อยู่ที่ 97/56 ซอยบุญศิริ 6 เปิด 24 ชั่วโมง พร้อมบัตรสมาชิกดิจิทัลสำหรับลูกค้า</p>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="jh-text-link">
                <BrandIcon name="location" size={17} tone="emerald" />ดูตำแหน่งและข้อมูลร้านบน Google Maps
              </a>
            </div>
            <figure className="jh-shop-map">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                title="แผนที่ตำแหน่งร้าน JAGUAR SPK 97/56 ซอยบุญศิริ 6 สมุทรปราการ"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <figcaption><span>JAGUAR SPK</span><span>97/56 ซอยบุญศิริ 6 · สมุทรปราการ</span></figcaption>
            </figure>
          </section>

          <section className="jh-contact" id="contact" aria-labelledby="jh-contact-title">
            <div>
              <p className="jh-kicker">ติดต่อร้าน</p>
              <h2 id="jh-contact-title">มีคำถามเรื่องสินค้า หรือสมาชิก?</h2>
              <p>เปิด 24 ชั่วโมง · จัดส่งบริเวณใกล้เคียงบางเมือง กรุณาสอบถามสต็อกและพื้นที่จัดส่ง</p>
              <p>
                โทรศัพท์:{" "}
                <a href="tel:0996125914" className="jh-text-link">
                  0996125914
                </a>
              </p>
            </div>
            <div className="jh-contact__actions">
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="jh-map-link">
                <BrandIcon name="location" size={18} tone="emerald" />แผนที่ร้าน
              </a>
            </div>
          </section>

          <footer className="jh-footer">
            <Link href="/" className="jh-footer__brand">JAGUAR SPK</Link>
            <span>97/56 ซอยบุญศิริ 6 · สมุทรปราการ</span>
            <div><Link href="/staff">พนักงาน</Link><Link href="/owner">เจ้าของร้าน</Link></div>
          </footer>
        </div>
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
            <p>97/56 ซอยบุญศิริ 6 · สมุทรปราการ</p>
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
            onClick={() => setMapPopupOpen((open) => !open)}
          >
            <BrandIcon name="location" size={20} tone="emerald" />
            <span>แผนที่ร้าน</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div className={`customer-art-root jaguar-auth-page ${initialTab === "login" ? "jaguar-auth-page--login" : "jaguar-auth-page--register"}`}>
      <SamutPrakanArt />
      <div className="jaguar-auth-shell">
        <header className="jaguar-auth-topbar">
          <Link href="/" className="jaguar-auth-brand" aria-label="JAGUAR SPK หน้าแรก">
            <Image
              src="/brand/jaguar-spk-wordmark.webp"
              alt="JAGUAR SPK"
              width={480}
              height={214}
              priority
              sizes="(max-width: 560px) 148px, 190px"
            />
          </Link>
          <div className="jaguar-auth-topbar__right">
            <span className="jaguar-auth-location"><BrandIcon name="location" size={15} tone="emerald" />97/56 ซอยบุญศิริ 6 · สมุทรปราการ</span>
            <nav className="jaguar-auth-staff" aria-label="เมนูพนักงาน">
              <Link href="/staff" data-testid="link-staff">พนักงาน</Link>
              <Link href="/owner" data-testid="link-owner">เจ้าของร้าน</Link>
            </nav>
          </div>
        </header>

        <main className="jaguar-auth-main">
          <section className="jaguar-auth-story" aria-labelledby="auth-story-title">
            <div className="jaguar-auth-story__copy">
              <p className="jaguar-auth-kicker">JAGUAR SPK · MEMBER CLUB</p>
              <h1 id="auth-story-title">สมาชิกใกล้ตัว<br /><span>รางวัลใกล้คุณ</span></h1>
              <p className="jaguar-auth-story__intro">บัตรสมาชิกดิจิทัล ใช้ได้ทุกครั้งที่แวะมา</p>
            </div>
            <div className="jaguar-auth-story__lower">
              <ol className="jaguar-auth-steps" aria-label="วิธีใช้บัตรสมาชิก">
                {[["01", "เปิดบัตร"], ["02", "สะสมแต้ม"], ["03", "แลกรางวัล"]].map(([number, label]) => (
                  <li key={number}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </li>
                ))}
              </ol>
              <figure className="jaguar-auth-product">
                <Image
                  src="/brand/product-kratom-gold.webp"
                  alt="เครื่องดื่ม JAGUAR SPK"
                  width={768}
                  height={768}
                  loading="lazy"
                  sizes="(min-width: 901px) 230px, 1px"
                />
                <Image
                  src="/brand/jaguar-spk-mascot-face.webp"
                  alt=""
                  aria-hidden="true"
                  width={96}
                  height={96}
                  className="jaguar-auth-product__mascot"
                  sizes="56px"
                />
                <figcaption>JAGUAR SPK · เครื่องดื่ม</figcaption>
              </figure>
            </div>
          </section>

          <section className="jaguar-auth-access" aria-labelledby="auth-access-title">
            <div className="jaguar-auth-access__heading">
              <p className="jaguar-auth-kicker">{tab === "login" ? "MEMBER ACCESS" : "JOIN THE CLUB"}</p>
              <h2 id="auth-access-title">{tab === "login" ? "เข้าสู่บัตรสมาชิก" : "สมัครสมาชิก"}</h2>
              <p>{tab === "login" ? "เลือกวิธีเข้าใช้ที่สะดวก" : "กรอกข้อมูลเพื่อเปิดบัตรใหม่"}</p>
            </div>

            {session.isSuccess && session.data?.authenticated ? (
              <div className="panel auth-panel jaguar-auth-panel jaguar-auth-session" data-testid="panel-session">
                <BrandIcon name="members" size={24} tone="emerald" />
                <h2>เข้าสู่ระบบแล้ว</h2>
                <BrandButton href="/card" asset="btn-jaguar" label="เปิดบัตรสมาชิก" testId="link-open-card" />
              </div>
            ) : (
              <>
                <div
                  role="tablist"
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    event.preventDefault();
                    const next = tab === "login" ? "register" : "login";
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }}
                  aria-label="เลือกการเข้าใช้"
                  className="pill-switch jaguar-auth-tabs"
                >
                  <button type="button" role="tab" id="tab-login" aria-selected={tab === "login"} tabIndex={tab === "login" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("login")} data-testid="tab-login">
                    <span><BrandIcon name="staffAccess" size={16} tone={tab === "login" ? "emerald" : "neutral"} />เข้าใช้</span>
                  </button>
                  <button type="button" role="tab" id="tab-register" aria-selected={tab === "register"} tabIndex={tab === "register" ? 0 : -1} aria-controls="panel-auth" className="tab" onClick={() => setTab("register")} data-testid="tab-register">
                    <span><BrandIcon name="members" size={16} tone={tab === "register" ? "gold" : "neutral"} />สมัคร</span>
                  </button>
                </div>
                <div id="panel-auth" role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel auth-panel auth-form-panel jaguar-auth-panel">
                  {tab === "login" ? <LoginForm /> : <RegisterForm />}
                </div>
                {session.isError && (session.error as { status?: number })?.status !== 401 && (
                  <p className="jaguar-auth-server-status" role="status">เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว คุณยังลองเข้าสู่ระบบได้</p>
                )}
              </>
            )}

            <div className="jaguar-auth-assurance">
              <BrandIcon name="qr" size={16} tone="emerald" />
              <span>บัตรและ QR ของคุณอยู่ในมือถือ</span>
            </div>
          </section>
        </main>

        <footer className="jaguar-auth-footer">
          <span>JAGUAR SPK MEMBER</span>
          <span>สมุทรปราการ</span>
        </footer>
      </div>
    </div>
  );
}
