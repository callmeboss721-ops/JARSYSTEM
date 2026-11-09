import Link from "next/link";
import { BrandIcon } from "@/components/brand/brand-icon";
import { JaguarMark } from "@/components/brand/jaguar-mark";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6 text-center">
      <section className="panel flex w-full max-w-sm flex-col items-center gap-4 p-7">
        <JaguarMark size={64} />
        <BrandIcon name="error" tone="danger" size={26} />
        <p className="eyebrow">404 · NOT FOUND</p>
        <h1 className="font-display text-2xl font-semibold">ไม่พบหน้านี้</h1>
        <p className="text-sm text-[var(--muted)]">ลิงก์นี้ไม่มีในระบบ</p>
        <Link href="/" className="btn btn-neon w-full">กลับหน้าแรก</Link>
      </section>
    </main>
  );
}
