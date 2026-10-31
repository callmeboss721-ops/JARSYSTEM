"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[100dvh] grid place-items-center p-6">
      <section className="panel max-w-md p-8 text-center" role="alert">
        <p className="eyebrow">Jaguar Kratom</p>
        <h1 className="font-display text-2xl mt-4">ไม่สามารถแสดงหน้านี้ได้</h1>
        <p className="mt-3 text-[var(--muted)]">กรุณาลองใหม่ ข้อมูลสมาชิกของคุณไม่ได้ถูกลบ</p>
        <button type="button" className="btn btn-ghost mt-6" onClick={reset}>ลองอีกครั้ง</button>
      </section>
    </main>
  );
}
