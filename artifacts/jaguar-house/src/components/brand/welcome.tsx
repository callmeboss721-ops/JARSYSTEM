"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { api } from "./loyalty-api";
import { BrandIcon, type BrandIconName } from "./brand-icon";
import { BrandV4Icon } from "@workspace/jaguar-spk-design-system/components/ui/brand-v4-icon";
import { MotionBadge } from "@workspace/jaguar-spk-design-system/components/ui/motion-badge";
import { SamutPrakanArt } from "./samut-prakan-art";
import { LoginForm, RegisterForm } from "./auth-forms";
import { BrandArtworkButton, BrandButton, BrandDeliveryLink } from "./brand-button";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Jaguar+spk+%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B8%81%E0%B8%B1%E0%B8%8D%E0%B8%8A%E0%B8%B2+%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%89%E0%B8%B1%E0%B8%99/@13.6100796,100.6008541,17z/data=!3m1!4b1!4m6!3m5!1s0x30e2a17b24c91b0f:0x2dd52ed6c8dbd489!8m2!3d13.6100796!4d100.6008541!16s%2Fg%2F11z_klv87h?hl=th&entry=ttu&g_ep=EgoyMDI2MTExNS4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_MAPS_EMBED_URL = "https://maps.google.com/maps?q=13.6100796,100.6008541&z=17&output=embed";

const PRODUCT_VARIANTS = [
  { variant: "gold", name: "สูตร JG01 · ฝาทอง", src: "/brand/product-kratom-gold.webp", alt: "ขวด JAGUAR SPK สูตร JG01 ฝาสีทอง" },
  { variant: "blue", name: "สูตรฟ้า · ฝาน้ำเงิน", src: "/brand/product-kratom-blue.webp", alt: "ขวด JAGUAR SPK สูตรฟ้า ฝาสีน้ำเงิน" },
  { variant: "red", name: "สูตรแดง · ฝาแดง", src: "/brand/product-kratom-red.webp", alt: "ขวด JAGUAR SPK สูตรแดง ฝาสีแดง" },
] as const;
type ProductFilter = "all" | (typeof PRODUCT_VARIANTS)[number]["variant"];
const PRODUCT_FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "ทุกรส" },
  { value: "gold", label: "ฝาทอง" },
  { value: "blue", label: "ฝาน้ำเงิน" },
  { value: "red", label: "ฝาแดง" },
];
const MEMBERSHIP_STEPS = [
  {
    number: "01",
    title: "สมัครสมาชิก",
    description: "สร้างบัตรสมาชิกจากหน้าเว็บในไม่กี่วินาที",
    image: "/brand/steps/step-01-register.webp",
    alt: "ตัวอย่างขั้นตอนสมัครบัตรสมาชิก JAGUAR SPK",
  },
  {
    number: "02",
    title: "แสดงบัตรที่ร้าน",
    description: "เปิดบัตรบนมือถือให้พนักงานสแกน QR",
    image: "/brand/steps/step-02-collect.webp",
    alt: "ตัวอย่างการแสดงบัตรและสะสมแต้มที่ร้าน",
  },
  {
    number: "03",
    title: "แลกรางวัล",
    description: "ตรวจสอบแต้มและสอบถามสิทธิ์ที่หน้าร้าน",
    image: "/brand/steps/step-03-redeem.webp",
    alt: "ตัวอย่างขั้นตอนแลกรางวัลสมาชิก",
  },
] as const;

const LANDING_TABS: { id: string; href: string; label: string; icon: BrandIconName }[] = [
  { id: "top", href: "#top", label: "หน้าแรก", icon: "crown" },
  { id: "products", href: "#products", label: "สินค้า", icon: "products" },
  { id: "card", href: "/card", label: "บัตรสมาชิก", icon: "qr" },
  { id: "contact", href: "#contact", label: "ติดต่อ", icon: "phone" },
];
const LANDING_SECTION_IDS = ["top", "products", "membership", "about", "contact"] as const;

export function Welcome({ initialTab }: { initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab ?? "login");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [mapPopupOpen, setMapPopupOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("top");
  const mapTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (initialTab !== undefined || typeof IntersectionObserver === "undefined") return;
    const tabFor: Record<string, string> = { top: "top", products: "products", membership: "products", about: "contact", contact: "contact" };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(tabFor[visible.target.id] ?? "top");
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    LANDING_SECTION_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [initialTab]);
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
  const session = useQuery<{ authenticated: boolean }>({ queryKey: ["/api/loyalty/session"], queryFn: () => api("/api/loyalty/session"), enabled: true, retry: false, refetchOnWindowFocus: false });

  if (initialTab === undefined) {
    return (
      <>
      <main className="jaguar-home jaguar-home--landing customer-art-root min-h-[100dvh]">
        <SamutPrakanArt />
        <header className="jh-header">
          <div className="jh-header__inner">
            <Link href="/" className="jh-brand" aria-label="JAGUAR SPK หน้าแรก">
              <Image src="/brand/jaguar-spk-emblem-crisp.webp" alt="โลโก้ JAGUAR SPK" width={512} height={512} priority sizes="52px" />
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
          {session.isSuccess && session.data?.authenticated && (
            <Link className="jh-member-shortcut" href="/card" data-testid="link-session-member-card">
              <span>เปิดบัตรสมาชิกและสแกน QR ของคุณทันที</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <section className="jh-hero" id="top" aria-labelledby="landing-title">
            <div className="jh-hero__copy">
              <p className="jh-kicker jh-kicker--with-motion"><MotionBadge name="open-24h-beacon" size={26} assetBase="/brand/v4" />ร้านประจำย่าน · สมุทรปราการ · เปิด 24 ชม.</p>
              <h1 id="landing-title" className="sr-only">JAGUAR SPK</h1>
              <p className="jh-hero__intro">เปิดบัตรสมาชิกเพื่อดูแต้มและ QR ส่วนตัว หรือสมัครใหม่ได้ในไม่กี่วินาที</p>
              <div className="jh-clubs jh-clubs--hero" role="group" aria-label="บัตรสมาชิก Jaguar">
                <Link href="/card" className="jh-club" data-club="kratom" data-testid="link-hero-kratom-card">
                  <span className="jh-club__badge-icon">
                    <BrandV4Icon name="kratom-bottle" size={36} assetBase="/brand/v4" />
                  </span>
                  <span>
                    <em className="jh-club__eyebrow">KRATOM PASS · CROWN GOLD</em>
                    <strong>บัตรสมาชิกกระท่อม</strong>
                    <small>ดูแต้มสะสมและ QR ส่วนตัว</small>
                  </span>
                  <span className="jh-club__arrow" aria-hidden="true">↗</span>
                </Link>
                <Link href="/card/cannabis" className="jh-club" data-club="cannabis" data-testid="link-hero-cannabis-card">
                  <span className="jh-club__badge-icon">
                    <BrandV4Icon name="cannabis-pass" size={36} assetBase="/brand/v4" />
                  </span>
                  <span>
                    <em className="jh-club__eyebrow">CANNABIS PASS · JAGUAR GREEN</em>
                    <strong>บัตรสมาชิกกัญชา</strong>
                    <small>บัตรแยกเฉพาะหมวด · ตรวจแต้มของคุณ</small>
                  </span>
                  <span className="jh-club__arrow" aria-hidden="true">↗</span>
                </Link>
              </div>
              <p className="jh-hero__promo"><span>PROMO</span>สะสม 10 แต้ม รับฟรี 1 รายการ</p>
              <div className="jh-hero__actions">
                <BrandArtworkButton href="/login?mode=register" src="/ui/artwork/signup-card.webp" label="สมัครบัตรสมาชิก" testId="link-open-wallet" />
                <BrandArtworkButton href="/login" src="/ui/artwork/sign-in.webp" label="เข้าสู่ระบบสมาชิก" testId="link-member-login" />
              </div>
              <a className="jh-hero__location" href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                <BrandV4Icon name="map-pin-spk" size={20} assetBase="/brand/v4" />97/56 ซอยบุญศิริ 6 · เปิดแผนที่ร้าน
              </a>
            </div>
            <div className="jh-hero__visual">
              <Image
                src="/brand/jaguar-spk-campaign-banner.webp"
                alt="ภาพแคมเปญ JAGUAR SPK พร้อมมาสคอต"
                width={1200}
                height={675}
                priority
                sizes="(max-width: 720px) 60vw, 440px"
              />
              <span className="jh-hero__image-label">JAGUAR SPK · Brand Campaign</span>
            </div>
          </section>
          <section className="jh-section" id="products" aria-labelledby="landing-products-title">
            <div className="jh-section__header-row">
              <div className="jh-section__heading">
                <p className="jh-kicker">ภาพตัวอย่างสินค้า</p>
                <h2 id="landing-products-title">เครื่องดื่ม JAGUAR SPK</h2>
                <p>ภาพเป็นตัวอย่างสินค้า · สอบถามรายการและสต็อกหน้าร้านก่อนซื้อ</p>
              </div>
              <div className="jh-product-filters" role="group" aria-label="กรองรสเครื่องดื่ม">
                {PRODUCT_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.value}
                    className="jh-product-filter"
                    aria-pressed={productFilter === filter.value}
                    data-testid={`product-filter-${filter.value}`}
                    onClick={() => setProductFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="jh-products jh-products--variants" aria-live="polite">
              {PRODUCT_VARIANTS.filter((product) => productFilter === "all" || product.variant === productFilter).map((product) => (
                <article className="jh-product" key={product.variant} data-variant={product.variant} data-testid={`product-${product.variant}`}>
                  <div className="jh-product__image">
                    <Image
                      src={product.src}
                      alt={product.alt}
                      width={768}
                      height={768}
                      loading="lazy"
                      sizes="(max-width: 520px) 46vw, 360px"
                    />
                  </div>
                  <div className="jh-product__caption">
                    <strong>{product.name}</strong>
                    <span>ภาพตัวอย่าง · เช็กสต็อกก่อนซื้อ</span>
                    <div className="jh-product__price"><span>ราคา</span><strong>฿50 <small>/ ขวด</small></strong></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jh-section jh-membership" id="membership" aria-labelledby="jh-membership-title">
            <div className="jh-section__heading">
              <p className="jh-kicker">JAGUAR MEMBER</p>
              <h2 id="jh-membership-title">สมาชิก ใช้ง่ายทุกครั้งที่แวะ</h2>
              <p>เริ่มต้นจากมือถือ แล้วแสดงบัตรสมาชิกดิจิทัลที่เคาน์เตอร์</p>
            </div>
            <div className="jh-three-steps">
              {MEMBERSHIP_STEPS.map((step) => (
                <article className="jh-step-card" key={step.number}>
                  <Image
                    className="jh-step-card__image"
                    src={step.image}
                    alt={step.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    sizes="(max-width: 680px) 100vw, 33vw"
                  />
                  <div className="jh-step-card__copy">
                    <span className="jh-step-card__number">{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="jh-membership__promo" role="note">
              <span className="jh-membership__promo-tag">PROMO</span>
              <p>
                โปรโมชันที่ร้านยืนยัน: <strong>สะสม 10 แต้ม รับฟรี 1 รายการ</strong> · สอบถามสินค้าที่ร่วมรายการและเงื่อนไขที่หน้าร้าน
              </p>
            </div>
            <div className="jh-membership__links">
              <Link href="/login?mode=register" className="jh-membership__primary-link">สมัครสมาชิก <span aria-hidden="true">↗</span></Link>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">ดูข้อมูลร้านและรีวิวบน Google Maps <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <section className="jh-about" id="about" aria-labelledby="jh-about-title">
            <div className="jh-about__brand">
              <Image src="/brand/jaguar-spk-emblem-crisp.webp" alt="" width={512} height={512} loading="lazy" sizes="(max-width: 600px) 88px, 112px" />
            </div>
            <div>
              <p className="jh-kicker">ร้านชุมชน · สมุทรปราการ</p>
              <h2 id="jh-about-title">แวะมาพบกันที่ร้าน</h2>
              <p>JAGUAR SPK อยู่ที่ 97/56 ซอยบุญศิริ 6 เปิด 24 ชั่วโมง พร้อมบัตรสมาชิกดิจิทัลสำหรับลูกค้า</p>
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="jh-text-link">
                <BrandV4Icon name="map-pin-spk" size={20} assetBase="/brand/v4" />ดูตำแหน่งและข้อมูลร้านบน Google Maps
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
              <p className="jh-kicker jh-kicker--with-motion"><MotionBadge name="open-24h-beacon" size={24} assetBase="/brand/v4" />ติดต่อร้าน · เปิด 24 ชม.</p>
              <h2 id="jh-contact-title">มีคำถามเรื่องสินค้า หรือสมาชิก?</h2>
              <p>เปิด 24 ชั่วโมง · พื้นที่จัดส่งและเงื่อนไขต้องโทรยืนยันกับร้านก่อนสั่ง</p>
            </div>
            <div className="jh-contact__actions">
              <BrandDeliveryLink />
              <a href="tel:0996125914" className="jh-contact__action-link jh-contact__call-link">
                <BrandIcon name="phone" size={18} tone="gold" />โทร 099-612-5914
              </a>
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
        <nav className="jh-tabbar" aria-label="เมนูลัด">
          <div className="jh-tabbar__track">
            {LANDING_TABS.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.id}
                  href={item.href}
                  className="jh-tabbar__item"
                  aria-current={activeSection === item.id ? "location" : undefined}
                  data-testid={`tabbar-${item.id}`}
                >
                  <BrandIcon name={item.icon} size={20} tone={activeSection === item.id ? "gold" : "neutral"} />
                  <span>{item.label}</span>
                </a>
              ) : (
                <Link key={item.id} href={item.href} className="jh-tabbar__item jh-tabbar__item--card" data-testid={`tabbar-${item.id}`}>
                  <span className="jh-tabbar__card-icon"><BrandIcon name={item.icon} size={22} tone="neutral" /></span>
                  <span>{item.label}</span>
                </Link>
              ),
            )}
            <button
              type="button"
              className="jh-tabbar__item"
              aria-expanded={mapPopupOpen}
              aria-controls="landing-map-popup"
              data-testid="tabbar-map"
              onClick={() => setMapPopupOpen((open) => !open)}
            >
              <BrandIcon name="location" size={20} tone={mapPopupOpen ? "gold" : "neutral"} />
              <span>แผนที่</span>
            </button>
          </div>
        </nav>
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
                  src="/brand/mascot-welcome.webp"
                  alt="มาสคอต JAGUAR SPK โบกมือทักทาย"
                  width={720}
                  height={720}
                  loading="lazy"
                  sizes="(min-width: 901px) 230px, 1px"
                />
                <figcaption>JAGUAR SPK · MEMBER CLUB</figcaption>
              </figure>
            </div>
          </section>

          <section className="jaguar-auth-access" aria-labelledby="auth-access-title">
            <div className="jaguar-auth-access__heading">
              <span className="jaguar-auth-mobile-badge" aria-hidden="true">
                <Image
                  src="/brand/mascot-welcome.webp"
                  alt=""
                  width={112}
                  height={112}
                  loading="lazy"
                  sizes="84px"
                />
              </span>
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
