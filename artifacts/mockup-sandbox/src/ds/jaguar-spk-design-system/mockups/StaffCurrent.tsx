import { useState, type FormEvent } from "react";
import { BrandIcon } from "@workspace/jaguar-spk-design-system/components/ui/brand-icon";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import { PinPad } from "@workspace/jaguar-spk-design-system/components/ui/pin-pad";

/**
 * Source-based extraction of the existing /staff signed-out state.
 * The PIN input is local preview state only; it never calls the live API.
 */
export function StaffCurrent() {
  const [pin, setPin] = useState("");

  function preventPreviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main
      data-brand-theme="2026"
      className="dark min-h-screen bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 100% 0%, hsl(var(--brand-id-2026-gold) / .06), transparent 38%), linear-gradient(hsl(var(--brand-id-2026-background) / .24), hsl(var(--brand-id-2026-background) / .24)), url('/__mockup/jaguar-operations-ambient.webp')",
        backgroundPosition: "center",
        backgroundSize: "auto, auto, cover",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll, scroll, fixed",
      }}
    >
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <a href="#staff" className="flex min-h-11 items-center gap-2 no-underline">
            <JaguarMark
              size={34}
              src="/__mockup/jaguar-spk-mark.webp"
              title="JAGUAR SPK"
              className="object-contain"
            />
            <span className="font-display tracking-wider text-accent">
              JAGUAR <small className="text-primary">STAFF</small>
            </span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <section className="mx-auto w-full max-w-sm pt-4" aria-labelledby="staff-access-title">
          <div className="mb-6 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Staff access
            </p>
            <h1 id="staff-access-title" className="mt-2 font-display text-3xl font-semibold">
              เข้าสู่ระบบพนักงาน
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">ใช้ PIN ที่เจ้าของร้านกำหนด</p>
          </div>

          <form
            className="space-y-4 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xl shadow-background/30 sm:p-6"
            onSubmit={preventPreviewSubmit}
          >
            <div className="space-y-2">
              <label htmlFor="staff-current-pin" className="text-sm text-muted-foreground">
                PIN พนักงาน
              </label>
              <input
                id="staff-current-pin"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={12}
                className="min-h-12 w-full rounded-xl border border-input bg-background px-4 text-center text-2xl tracking-[.5em] outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 12))}
                aria-label="PIN พนักงาน"
              />
            </div>

            <PinPad value={pin} onChange={setPin} label="แป้นตัวเลข PIN พนักงาน" />

            <Button type="submit" size="lg" className="min-h-12 w-full rounded-xl">
              เข้าสู่พื้นที่ทำงาน
            </Button>
          </form>

          <a
            href="#owner-login"
            onClick={(event) => event.preventDefault()}
            className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <BrandIcon name="staffAccess" size={16} />
            เข้าสู่ระบบเจ้าของร้าน
          </a>
        </section>
      </div>
    </main>
  );
}
