import { useEffect, useRef, useState } from "react";
import {
  Bell, Check, ChevronDown, Copy, History, LogOut, RefreshCw, Search,
  Settings, Trash2, UserRound,
} from "lucide-react";

const MENU_ITEMS = [
  { label: "โปรไฟล์ของฉัน", icon: UserRound },
  { label: "ประวัติสะสม", icon: History },
  { label: "ตั้งค่า", icon: Settings },
];

function DemoAction({ label, variant }: { label: string; variant: "primary" | "secondary" | "ghost" | "danger" }) {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const activate = () => {
    if (state === "loading") return;
    setState("loading");
    timer.current = window.setTimeout(() => {
      setState("success");
      timer.current = window.setTimeout(() => setState("idle"), 1250);
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 700);
  };
  return (
    <button type="button" className={`ds-v3-button ds-v3-button--${variant}`} onClick={activate} disabled={state === "loading"} aria-live="polite">
      {state === "loading" ? <span className="ds-v3-loading-mark" aria-hidden="true" /> : state === "success" ? <Check size={17} aria-hidden="true" /> : null}
      {state === "loading" ? "กำลังทำงาน…" : state === "success" ? "สำเร็จ" : label}
    </button>
  );
}

/** Local-only interaction gallery for v3 action controls. */
export function ActionControls() {
  const [switchOn, setSwitchOn] = useState(true);
  const [segment, setSegment] = useState("cannabis");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("ตัวอย่างปุ่มและเมนูทำงานเฉพาะในหน้านี้");
  const menuRoot = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      menuRoot.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    }
    const onPointer = (event: PointerEvent) => {
      if (menuRoot.current && !menuRoot.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const iconAction = (label: string) => setMessage(`${label} · ตัวอย่างเฉพาะในหน้านี้`);
  return (
    <div className="ds-v3-actions">
      <section>
        <h3>Primary · เขียวนีออน</h3>
        <div className="ds-v3-action-row"><DemoAction label="สะสมแต้ม" variant="primary" /><DemoAction label="ดูบัตรสมาชิก" variant="primary" /><button className="ds-v3-button ds-v3-button--primary" disabled>ปิดใช้งาน</button></div>
      </section>
      <section>
        <h3>Secondary · ทอง</h3>
        <div className="ds-v3-action-row"><DemoAction label="ดูรางวัล" variant="secondary" /><DemoAction label="โปรโมชั่น" variant="secondary" /><button className="ds-v3-button ds-v3-button--secondary" disabled>ปิดใช้งาน</button></div>
      </section>
      <section>
        <h3>Ghost · Danger</h3>
        <div className="ds-v3-action-row"><DemoAction label="ดูประวัติ" variant="ghost" /><DemoAction label="ยกเลิกรายการ" variant="danger" /><button className="ds-v3-button ds-v3-button--danger" onClick={() => iconAction("ลบ")}><Trash2 size={17} /> ลบ (ตัวอย่าง)</button></div>
      </section>
      <section>
        <h3>Icon buttons · Switch</h3>
        <div className="ds-v3-action-row">
          {[
            { label: "ค้นหา", icon: Search }, { label: "ตั้งค่า", icon: Settings },
            { label: "แจ้งเตือน", icon: Bell }, { label: "โหลดซ้ำ", icon: RefreshCw },
            { label: "คัดลอก", icon: Copy }, { label: "ออกจากระบบ", icon: LogOut },
          ].map(({ label, icon: Icon }) => <button className="ds-v3-icon-button" type="button" key={label} aria-label={label} onClick={() => iconAction(label)}><Icon size={19} /></button>)}
          <label className="ds-v3-switch"><input type="checkbox" checked={switchOn} onChange={(event) => setSwitchOn(event.target.checked)} /><span aria-hidden="true" /><span>รับการแจ้งเตือน</span></label>
          <label className="ds-v3-switch"><input type="checkbox" disabled /><span aria-hidden="true" /><span>ปิดใช้งาน</span></label>
        </div>
      </section>
      <section className="ds-v3-controls-bottom">
        <h3>Dropdown · Segmented</h3>
        <div className="ds-v3-action-row">
          <div className="ds-v3-dropdown" ref={menuRoot}>
            <button ref={trigger} type="button" className="ds-v3-button ds-v3-button--secondary" aria-haspopup="menu" aria-expanded={open} aria-controls="ds-v3-member-menu" onClick={() => setOpen((value) => !value)}>
              เมนูสมาชิก <ChevronDown size={18} className={open ? "is-open" : ""} />
            </button>
            {open ? <div
              className="ds-v3-menu"
              id="ds-v3-member-menu"
              role="menu"
              aria-label="เมนูสมาชิก"
              onKeyDown={(event) => {
                if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
                const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
                const nextIndex = event.key === "Home" ? 0
                  : event.key === "End" ? items.length - 1
                    : (currentIndex + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
                items[nextIndex]?.focus();
              }}
            >
              {MENU_ITEMS.map(({ label, icon: Icon }) => <button role="menuitem" type="button" key={label} onClick={() => { setOpen(false); setMessage(`${label} · ตัวอย่างเฉพาะในหน้านี้`); }}><Icon size={18} />{label}</button>)}
              <hr />
              <button role="menuitem" type="button" className="is-danger" onClick={() => { setOpen(false); setMessage("ออกจากระบบ · ตัวอย่างเฉพาะในหน้านี้"); }}><LogOut size={18} />ออกจากระบบ</button>
            </div> : null}
          </div>
          <div className="ds-v3-segmented" role="group" aria-label="เลือกตัวอย่างบัตร">
            {[["cannabis", "บัตรกัญชา"], ["kratom", "บัตรกระท่อม"]].map(([value, label]) => <button type="button" key={value} aria-pressed={segment === value} onClick={() => { setSegment(value); setMessage(`${label} · accent ตัวอย่าง`); }}>{label}</button>)}
          </div>
        </div>
        <p className="ds-v3-muted">เลือกอยู่: {segment === "cannabis" ? "บัตรกัญชา" : "บัตรกระท่อม"}</p>
      </section>
      <p className="ds-v3-live" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
