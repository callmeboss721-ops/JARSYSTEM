import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Jaguar+spk+%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B8%81%E0%B8%B1%E0%B8%8D%E0%B8%8A%E0%B8%B2+%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%AD%E0%B8%A1+%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%89%E0%B8%B1%E0%B8%99/@13.6100796,100.6008541,17z/data=!3m1!4b1!4m6!3m5!1s0x30e2a17b24c91b0f:0x2dd52ed6c8dbd489!8m2!3d13.6100796!4d100.6008541!16s%2Fg%2F11z_klv87h?hl=th&entry=ttu&g_ep=EgoyMDI2MTExNS4wIKXMDSoASAFQAw%3D%3D";
const STORE_PHONE = "0996125914";

export const metadata: Metadata = {
  title: "รู้จัก JAGUAR SPK | 97/56 ซอยบุญศิริ 6",
  description:
    "JAGUAR SPK เปิด 24 ชั่วโมง ที่ 97/56 ซอยบุญศิริ 6 โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
  openGraph: {
    title: "รู้จัก JAGUAR SPK | 97/56 ซอยบุญศิริ 6",
    description: "เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "รู้จัก JAGUAR SPK | 97/56 ซอยบุญศิริ 6",
    description: "เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
  },
};

const pathways = [
  {
    number: "01",
    title: "แวะที่ร้าน",
    description: "พบกันที่ 97/56 ซอยบุญศิริ 6 จังหวัดสมุทรปราการ",
    href: GOOGLE_MAPS_URL,
    label: "ดูแผนที่ร้าน",
    external: true,
  },
  {
    number: "02",
    title: "ใช้บัตรสมาชิก",
    description: "เปิดบัตรสมาชิกบนมือถือเมื่อมาที่ร้าน",
    href: "/card",
    label: "เปิดบัตรสมาชิก",
    external: false,
  },
  {
    number: "03",
    title: "เริ่มต้นออนไลน์",
    description: "สมัครสมาชิกผ่านหน้าเว็บของ JAGUAR SPK",
    href: "/login?mode=register",
    label: "สมัครสมาชิก",
    external: false,
  },
] as const;

export default function BrandPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-[var(--radius)] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="JAGUAR SPK กลับหน้าแรก"
          >
            <Image
              src="/brand/jaguar-spk-emblem-crisp.webp"
              alt=""
              width={64}
              height={64}
              className="h-12 w-12 object-contain"
              priority
              sizes="48px"
            />
            <span className="grid">
              <span className="font-display text-sm font-semibold tracking-widest text-accent">
                JAGUAR SPK
              </span>
              <span className="text-xs text-muted-foreground">97/56 ซอยบุญศิริ 6</span>
            </span>
          </Link>
          <nav aria-label="เมนูหน้าแนะนำแบรนด์" className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden min-h-11 items-center rounded-[var(--radius)] px-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              หน้าแรก
            </Link>
            <Button asChild variant="outline" size="sm">
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                แผนที่ร้าน
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <section
          aria-labelledby="brand-title"
          className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24"
        >
          <div className="relative z-10">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              ร้านประจำย่าน · สมุทรปราการ
            </p>
            <h1
              id="brand-title"
              className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              JAGUAR SPK
              <span className="mt-2 block text-accent">ใกล้บ้าน ในแบบของคุณ</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              ร้านที่ 97/56 ซอยบุญศิริ 6 พร้อมประสบการณ์สมาชิกดิจิทัล
              แวะมาที่ร้าน หรือเริ่มต้นจัดการบัตรสมาชิกผ่านมือถือได้
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/login?mode=register">สมัครสมาชิก</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/card">เปิดบัตรสมาชิก</Link>
              </Button>
            </div>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              97/56 ซอยบุญศิริ 6 · สมุทรปราการ
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div
              aria-hidden="true"
              className="absolute inset-5 rounded-full bg-primary/10 blur-3xl"
            />
            <figure className="relative grid min-h-80 place-items-center overflow-hidden rounded-[var(--radius)] border border-secondary/30 bg-card p-8 shadow-xl sm:min-h-[26rem] sm:p-12">
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-[var(--radius)] border border-border/70"
              />
              <Image
                src="/brand/jaguar-spk-brand-id-2026-emblem.png"
                alt="ตราสัญลักษณ์ JAGUAR SPK"
                width={512}
                height={512}
                className="relative z-10 h-auto w-full max-w-80 object-contain drop-shadow-xl"
                priority
                sizes="(max-width: 640px) 72vw, (max-width: 1024px) 420px, 480px"
              />
              <Image
                src="/brand/jaguar-spk-mascot-face.webp"
                alt=""
                aria-hidden="true"
                width={112}
                height={112}
                className="brand-page-mascot"
                sizes="72px"
              />
              <figcaption className="relative z-10 mt-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                97/56 ซอยบุญศิริ 6 · สมุทรปราการ
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-labelledby="experience-title"
          className="border-y border-border/70 py-12 sm:py-16"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                ร้านจริง · สมาชิกดิจิทัล
              </p>
              <h2
                id="experience-title"
                className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl"
              >
                สองทางที่มาบรรจบกัน
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[var(--radius)] border border-border/80 bg-card/70 p-5 sm:p-6">
                <p className="font-mono text-xs tracking-widest text-secondary">ที่ร้าน</p>
                <h3 className="mt-4 font-display text-xl font-semibold">แวะมาพบกัน</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  JAGUAR SPK อยู่ที่ 97/56 ซอยบุญศิริ 6 จังหวัดสมุทรปราการ
                  เปิดแผนที่เพื่อดูตำแหน่งร้านก่อนเดินทาง
                </p>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  เปิด Google Maps <span aria-hidden="true">↗</span>
                </a>
              </article>
              <article className="rounded-[var(--radius)] border border-primary/30 bg-card/70 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs tracking-widest text-primary">บนมือถือ</p>
                    <h3 className="mt-4 font-display text-xl font-semibold">บัตรสมาชิกดิจิทัล</h3>
                  </div>
                  <Image
                    src="/brand/mascot-digital-guide.webp"
                    alt=""
                    aria-hidden="true"
                    width={128}
                    height={128}
                    className="h-20 w-20 shrink-0 rounded-[var(--radius)] border border-border/70 object-contain sm:h-24 sm:w-24"
                    sizes="96px"
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  สมัครผ่านเว็บ เปิดบัตรบนมือถือ และแสดงบัตรที่ร้าน
                  แต้มสมาชิกแสดงอยู่บนบัตรของคุณ
                </p>
                <Link
                  href="/card"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ดูบัตรสมาชิก <span aria-hidden="true">↗</span>
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="store-details-title"
          className="border-t border-border/70 py-12 sm:py-16"
        >
          <div className="mb-7 max-w-2xl sm:mb-9">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              ข้อมูลที่ร้านยืนยัน
            </p>
            <h2
              id="store-details-title"
              className="mt-3 font-display text-3xl font-semibold sm:text-4xl"
            >
              ก่อนแวะหรือสั่งซื้อ
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              รายละเอียดร้านตามข้อมูลปัจจุบันที่เจ้าของยืนยัน สอบถามร้านเพื่อเช็กสต็อกและเงื่อนไขเพิ่มเติม
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-[var(--radius)] border border-border/80 bg-card/70 p-5">
              <h3 className="font-display text-lg font-semibold">เวลาเปิดร้าน</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">เปิด 24 ชั่วโมง</p>
            </article>
            <article className="rounded-[var(--radius)] border border-border/80 bg-card/70 p-5">
              <h3 className="font-display text-lg font-semibold">โทรศัพท์</h3>
              <a
                href={`tel:${STORE_PHONE}`}
                className="mt-2 inline-flex min-h-11 items-center text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {STORE_PHONE}
              </a>
            </article>
            <article className="rounded-[var(--radius)] border border-border/80 bg-card/70 p-5">
              <h3 className="font-display text-lg font-semibold">ราคาเครื่องดื่ม</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                ฿60 ต่อขวด · สอบถามสต็อกก่อนซื้อ
              </p>
            </article>
            <article className="rounded-[var(--radius)] border border-border/80 bg-card/70 p-5">
              <h3 className="font-display text-lg font-semibold">บริการจัดส่ง</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                บริเวณใกล้เคียงบางเมือง กรุณาโทรสอบถามพื้นที่และเงื่อนไขก่อนสั่ง
              </p>
            </article>
            <article className="rounded-[var(--radius)] border border-secondary/30 bg-card/70 p-5 sm:col-span-2 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold">โปรโมชันสมาชิก</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                สะสม 10 แต้ม รับฟรี 1 รายการ สอบถามสินค้าที่ร่วมรายการและเงื่อนไขที่ร้าน
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="pathways-title" className="py-12 sm:py-16 lg:py-20">
          <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                เริ่มจากตรงนี้
              </p>
              <h2
                id="pathways-title"
                className="mt-3 font-display text-3xl font-semibold sm:text-4xl"
              >
                เลือกเส้นทางที่สะดวก
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              มาที่ร้าน ใช้บัตรสมาชิก หรือโทรสอบถามรายละเอียดจากร้าน
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map((pathway) => (
              <article
                key={pathway.number}
                className="flex min-w-0 flex-col rounded-[var(--radius)] border border-border/80 bg-card/70 p-5 sm:p-6"
              >
                <span className="font-mono text-sm tracking-widest text-secondary">
                  {pathway.number}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{pathway.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">
                  {pathway.description}
                </p>
                <div className="mt-5">
                  {pathway.external ? (
                    <Button asChild variant="outline" className="w-full">
                      <a href={pathway.href} target="_blank" rel="noopener noreferrer">
                        {pathway.label}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant={pathway.href === "/login?mode=register" ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link href={pathway.href}>{pathway.label}</Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="contact-title"
          className="mb-12 grid gap-6 rounded-[var(--radius)] border border-secondary/30 bg-card/80 p-6 sm:mb-16 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              ยินดีต้อนรับ
            </p>
            <h2 id="contact-title" className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              อยากรู้ข้อมูลเพิ่มเติม?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              เปิด 24 ชั่วโมง · โทร {STORE_PHONE} · จัดส่งบริเวณใกล้เคียงบางเมือง
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`tel:${STORE_PHONE}`}
              aria-label={`โทรหาร้าน ${STORE_PHONE}`}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image
                src="/brand/jaguar-spk-call-now.png"
                alt=""
                width={488}
                height={112}
                className="h-14 w-[244px] max-w-full object-contain"
                sizes="244px"
              />
            </a>
            <Button asChild variant="outline">
              <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
                ดูแผนที่ร้าน
              </a>
            </Button>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-border/70 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="rounded-[var(--radius)] font-display font-semibold tracking-widest text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            JAGUAR SPK
          </Link>
          <span>97/56 ซอยบุญศิริ 6 · สมุทรปราการ</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/card"
              className="rounded-[var(--radius)] underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              บัตรสมาชิก
            </Link>
            <Link
              href="/card/cannabis"
              className="rounded-[var(--radius)] underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              บัตรสมาชิกกัญชา
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
