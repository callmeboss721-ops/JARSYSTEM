import { useState } from "react";
import { BrandIcon } from "@workspace/jaguar-spk-design-system/components/ui/brand-icon";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { CollectingTrack } from "@workspace/jaguar-spk-design-system/components/ui/membership-cards";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";

const STARTING_POINTS = 6;
const MAX_POINTS = 10;

export function MemberPointsPath() {
  const [points, setPoints] = useState(STARTING_POINTS);
  const [activity, setActivity] = useState<string[]>([
    "ตัวอย่างจำลอง · เพิ่ม 1 แต้ม",
    "ตัวอย่างจำลอง · เพิ่ม 2 แต้ม",
  ]);
  const [notice, setNotice] = useState("ข้อมูลตัวอย่าง · ไม่เชื่อมต่อสมาชิกจริง");

  function addPoints(amount: number) {
    const next = Math.min(MAX_POINTS, points + amount);
    const added = next - points;
    if (added <= 0) {
      setNotice("ตัวอย่างนี้ครบ 10/10 แล้ว · เริ่มใหม่เพื่อทดลองอีกครั้ง");
      return;
    }
    setPoints(next);
    setActivity((items) => [`ตัวอย่างจำลอง · เพิ่ม ${added} แต้ม`, ...items].slice(0, 4));
    setNotice(next === MAX_POINTS ? "ครบ 10/10 แต้มในตัวอย่างนี้แล้ว" : `เพิ่ม ${added} แต้มในตัวอย่างแล้ว`);
  }

  function resetDemo() {
    setPoints(0);
    setActivity(["เริ่มเดโมใหม่ · แต้มตัวอย่าง 0"]);
    setNotice("เริ่มตัวอย่างใหม่แล้ว");
  }

  const remaining = MAX_POINTS - points;
  const complete = points === MAX_POINTS;

  return (
    <main className="dark ds-app min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <JaguarMark size={48} title="JAGUAR SPK" />
            <div>
              <p className="font-display text-lg font-bold tracking-wide">JAGUAR SPK</p>
              <p className="text-xs tracking-widest text-muted-foreground">สมาชิก JAGUAR SPK</p>
            </div>
          </div>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 text-xs font-semibold text-accent">
            <BrandIcon name="security" size={16} tone="gold" />
            เดโม · ข้อมูลสมมติ
          </span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)] lg:items-stretch">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary">
                <BrandIcon name="progress" size={17} tone="gold" />
                แต้มสมาชิก
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                {complete
                  ? <>ครบ <span className="text-primary">10 แต้ม</span> พร้อมรับรางวัล</>
                  : <>อีก <span className="text-primary">{remaining} แต้ม</span> ถึงรางวัล</>}
              </h1>
            </div>

            <section className="ds-glass flex flex-col gap-5 p-5 sm:p-6" aria-label="สรุปแต้มสมาชิกตัวอย่าง">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <BrandIcon name="memberCode" size={21} tone="emerald" />
                  </span>
                  <div>
                    <p className="text-xs tracking-widest text-muted-foreground">สมาชิกตัวอย่าง</p>
                    <h2 className="font-display text-lg font-semibold">มะลิ <span className="font-mono text-sm text-muted-foreground">· DEMO-2048</span></h2>
                  </div>
                </div>
                <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium ${complete ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  <BrandIcon name={complete ? "success" : "pending"} size={15} tone={complete ? "emerald" : "neutral"} />
                  {complete ? "พร้อมแลก" : "กำลังสะสม"}
                </span>
              </div>

              <div className="flex items-end justify-between gap-3 border-t border-border pt-5">
                <div>
                  <p className="text-sm text-muted-foreground">แต้มสะสม</p>
                  <p className="font-display text-5xl font-bold leading-none text-primary">
                    {points}<span className="ml-2 font-mono text-xl font-medium text-muted-foreground">/10</span>
                  </p>
                </div>
                <p className="max-w-36 text-right text-sm leading-6 text-muted-foreground" role="status" aria-live="polite">
                  {complete ? "ครบ 10 แต้ม" : `อีก ${remaining} แต้ม`}
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="ความคืบหน้าแต้มตัวอย่าง" aria-valuemin={0} aria-valuemax={MAX_POINTS} aria-valuenow={points}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${points * 10}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">ข้อมูลนี้เป็นตัวอย่างเท่านั้น</p>
            </section>
          </div>

          <section className="ds-glass flex flex-col justify-between gap-6 p-5 sm:p-6" aria-labelledby="demo-controls-title">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <BrandIcon name="addPoints" size={19} tone="gold" />
                <p className="text-xs font-semibold tracking-widest">ทดลองใช้งาน</p>
              </div>
              <h2 id="demo-controls-title" className="font-display text-xl font-semibold">เพิ่มแต้มตัวอย่าง</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Button type="button" size="lg" onClick={() => addPoints(1)} disabled={complete} className="min-h-12">
                <BrandIcon name="add" size={18} tone="inherit" />
                เพิ่ม 1 แต้ม
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => addPoints(3)} disabled={complete} className="min-h-12">
                <BrandIcon name="lightning" size={18} tone="inherit" />
                เพิ่ม 3 แต้ม
              </Button>
              <Button type="button" variant="outline" onClick={resetDemo} className="min-h-11 sm:col-span-2 lg:col-span-1">
                เริ่มใหม่ที่ 0
              </Button>
              {complete && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setNotice("เดโมเท่านั้น · ไม่มีการแลกรางวัลจริง")}
                  className="min-h-12 sm:col-span-2 lg:col-span-1"
                >
                  <BrandIcon name="redeem" size={18} tone="inherit" />
                  ทดลองแลกรางวัล
                </Button>
              )}
            </div>

            <p className="flex items-start gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">
              <BrandIcon name={complete ? "success" : "pending"} size={16} tone={complete ? "emerald" : "gold"} />
              {notice}
            </p>
          </section>
        </section>

        <section className="ds-glass space-y-5 p-5 sm:p-6" aria-labelledby="points-path-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground">ตัวอย่าง · บัตรกระท่อม</p>
              <h2 id="points-path-title" className="font-display text-xl font-semibold">เส้นทางสะสมแต้ม</h2>
            </div>
            <span className="font-mono text-sm text-accent">{points.toString().padStart(2, "0")} / 10</span>
          </div>
          <CollectingTrack balance={points} kind="kratom" />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><BrandIcon name="success" size={15} tone="emerald" /> แต้มที่สะสมแล้ว</span>
            <span>{complete ? "ครบ 10 แต้ม" : `เหลืออีก ${remaining} แต้ม`}</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_1fr]" aria-label="รายละเอียดเดโม">
          <div className="ds-glass flex items-start gap-3 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <BrandIcon name="security" size={19} tone="emerald" />
            </span>
            <div>
              <h2 className="font-display font-semibold">ข้อมูลตัวอย่างเท่านั้น</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">ไม่เชื่อมบัญชีสมาชิกหรือยอดแต้มจริง</p>
            </div>
          </div>
          <div className="ds-glass flex items-start gap-3 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
              <BrandIcon name="history" size={19} tone="gold" />
            </span>
            <div>
              <h2 className="font-display font-semibold">รายการตัวอย่าง</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground" aria-live="polite">
                {activity.slice(0, 3).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-muted-foreground">
          JAGUAR SPK · ข้อมูลสมาชิกตัวอย่าง
        </footer>
      </div>
    </main>
  );
}
