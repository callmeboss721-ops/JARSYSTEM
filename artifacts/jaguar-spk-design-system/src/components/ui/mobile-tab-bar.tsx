import { useState } from "react";
import { Gift, House, QrCode, Sparkles, UserRound } from "lucide-react";

const TABS = [
  { id: "home", label: "หน้าแรก", title: "ยินดีต้อนรับสู่ JAGUAR SPK", detail: "จัดการบัตรและแต้มของคุณได้ที่นี่", icon: House },
  { id: "points", label: "สะสมแต้ม", title: "แต้มสะสมของคุณ", detail: "ตัวอย่างการแสดงสถานะแต้ม", icon: Sparkles },
  { id: "scan", label: "สแกน QR", title: "สแกน QR", detail: "ตัวอย่างปุ่มสแกน · ไม่มีการเปิดกล้อง", icon: QrCode },
  { id: "rewards", label: "รางวัล", title: "รางวัล", detail: "ตัวอย่างหน้ารางวัล", icon: Gift },
  { id: "profile", label: "โปรไฟล์", title: "โปรไฟล์สมาชิก", detail: "ตัวอย่างข้อมูลและการตั้งค่า", icon: UserRound },
];

/** Compact, stateful mobile navigation sample. All tabs are local preview behavior. */
export function MobileTabBar() {
  const [active, setActive] = useState("home");
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];
  const CurrentIcon = current.icon;
  return (
    <div className="ds-v3-phone">
      <section
        className="ds-v3-phone-screen"
        id="ds-v3-tab-panel"
        role="tabpanel"
        aria-labelledby={`ds-v3-tab-${current.id}`}
        aria-live="polite"
      >
        <CurrentIcon size={30} aria-hidden="true" />
        <strong>{current.title}</strong>
        <span>{current.detail}</span>
      </section>
      <div className="ds-v3-tabbar" role="tablist" aria-label="เมนูหลักตัวอย่าง">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`ds-v3-tab-${id}`}
            type="button"
            role="tab"
            aria-controls="ds-v3-tab-panel"
            aria-selected={active === id}
            aria-label={label}
            tabIndex={active === id ? 0 : -1}
            className={id === "scan" ? "ds-v3-tab ds-v3-tab--scan" : "ds-v3-tab"}
            onClick={() => setActive(id)}
            onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const currentIndex = TABS.findIndex((tab) => tab.id === active);
              const nextIndex = event.key === "Home" ? 0
                : event.key === "End" ? TABS.length - 1
                  : (currentIndex + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
              const nextTab = TABS[nextIndex];
              setActive(nextTab.id);
              window.requestAnimationFrame(() => document.getElementById(`ds-v3-tab-${nextTab.id}`)?.focus());
            }}
          >
            <Icon size={id === "scan" ? 25 : 20} aria-hidden="true" />
            {id !== "scan" ? <span>{label}</span> : null}
          </button>
        ))}
      </div>
      <p className="ds-v3-muted">ตัวอย่างเฉพาะในหน้านี้ · ปุ่มสแกนไม่เปิดกล้อง</p>
    </div>
  );
}
