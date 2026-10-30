import Link from "next/link";
import { JaguarMark } from "@/components/brand/jaguar-mark";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6 text-center">
      <div className="flex flex-col items-center gap-5">
        <JaguarMark size={88} />
        <p className="eyebrow">404 · Lost in the soi</p>
        <h1 className="font-display text-3xl font-semibold">หน้านี้ไม่มีอยู่ในซอยเรา</h1>
        <Link href="/" className="btn btn-neon">กลับหน้าแรก</Link>
      </div>
    </main>
  );
}
