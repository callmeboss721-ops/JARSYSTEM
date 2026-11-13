import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, Award, BadgeCheck, Bell, Check, ChevronDown, CircleAlert,
  CircleCheck, Coins, Copy, CreditCard, Crown, Diamond, Fingerprint, Flame,
  Gift, Gem, Globe, HandCoins, History, House, IdCard, Infinity, Info, Leaf,
  LoaderCircle, LogOut, Plus, QrCode, Receipt, RefreshCw, Search, Settings,
  ShieldCheck, Signal, Sparkles, Sprout, Star, Swords, Trash2, TriangleAlert,
  Trophy, UserRound, UsersRound, Vault, WandSparkles, Waves, X, Zap,
} from "lucide-react";

type IconEntry = { slug: string; label: string; icon: LucideIcon; signature?: "neon" | "gold" };

const ICONS: IconEntry[] = [
  { slug: "member", label: "สมาชิก", icon: UserRound }, { slug: "users", label: "สมาชิกหลายคน", icon: UsersRound },
  { slug: "card", label: "บัตร", icon: CreditCard }, { slug: "id-card", label: "บัตรประจำตัว", icon: IdCard },
  { slug: "points", label: "แต้ม", icon: Coins }, { slug: "gift", label: "รางวัล", icon: Gift },
  { slug: "qr", label: "สแกน QR", icon: QrCode }, { slug: "history", label: "ประวัติ", icon: History },
  { slug: "settings", label: "ตั้งค่า", icon: Settings }, { slug: "search", label: "ค้นหา", icon: Search },
  { slug: "check", label: "ยืนยัน", icon: Check }, { slug: "cancel", label: "ยกเลิก", icon: X },
  { slug: "refresh", label: "โหลดซ้ำ", icon: RefreshCw }, { slug: "loader", label: "กำลังโหลด", icon: LoaderCircle },
  { slug: "success", label: "สำเร็จ", icon: CircleCheck }, { slug: "error", label: "ผิดพลาด", icon: CircleAlert },
  { slug: "warning", label: "เตือน", icon: TriangleAlert }, { slug: "info", label: "ข้อมูล", icon: Info },
  { slug: "badge-check", label: "ยืนยันตัวตน", icon: BadgeCheck }, { slug: "shield-check", label: "ปลอดภัย", icon: ShieldCheck },
  { slug: "crown", label: "ระดับสูง", icon: Crown }, { slug: "trophy", label: "ถ้วยรางวัล", icon: Trophy },
  { slug: "star", label: "พิเศษ", icon: Star }, { slug: "sparkles", label: "ประกาย", icon: Sparkles },
  { slug: "bell", label: "แจ้งเตือน", icon: Bell }, { slug: "log-out", label: "ออกจากระบบ", icon: LogOut },
  { slug: "trash", label: "ลบ", icon: Trash2 }, { slug: "copy", label: "คัดลอก", icon: Copy },
  { slug: "plus", label: "เพิ่ม", icon: Plus }, { slug: "arrow-right", label: "ถัดไป", icon: ArrowRight },
  { slug: "house", label: "หน้าแรก", icon: House }, { slug: "chevron-down", label: "เปิดดู", icon: ChevronDown },
];

const SIGNATURES: IconEntry[] = [
  { slug: "diamond", label: "เพชร · พรีเมียม", icon: Diamond, signature: "neon" },
  { slug: "vault", label: "ตู้เซฟ · ปลอดภัย", icon: Vault, signature: "gold" },
  { slug: "award", label: "เกียรติบัตร · รางวัล", icon: Award, signature: "gold" },
  { slug: "wand", label: "ประกายพิเศษ", icon: WandSparkles, signature: "neon" },
  { slug: "hand-coins", label: "รับแต้มสะสม", icon: HandCoins, signature: "gold" },
  { slug: "receipt", label: "ใบเสร็จ · ประวัติ", icon: Receipt, signature: "neon" },
  { slug: "fingerprint", label: "ยืนยันตัวตน", icon: Fingerprint, signature: "neon" },
  { slug: "infinity", label: "เส้นทางต่อเนื่อง", icon: Infinity, signature: "gold" },
  { slug: "zap", label: "พลัง · เร็ว", icon: Zap, signature: "neon" },
  { slug: "flame", label: "พลังโดดเด่น", icon: Flame, signature: "gold" },
  { slug: "aurora", label: "แสงเหนือ", icon: Waves, signature: "neon" },
  { slug: "signal-lock", label: "สัญญาณ · ล็อก", icon: Signal, signature: "gold" },
];

function IconGrid({
  entries, size, copied, onCopy,
}: {
  entries: IconEntry[];
  size: number;
  copied: string;
  onCopy: (entry: IconEntry, element: HTMLButtonElement) => void;
}) {
  if (entries.length === 0) return <p className="ds-icon-empty">ไม่พบไอคอนที่ตรงกับคำค้นนี้</p>;
  return (
    <div className="ds-v3-icon-grid" aria-label="รายการไอคอน">
      {entries.map(({ slug, label, icon: Icon, signature }) => (
        <button
          key={slug}
          type="button"
          className={`ds-v3-icon-card${signature ? ` ds-v3-icon-card--${signature}` : ""}`}
          aria-label={`คัดลอก SVG ไอคอน ${label}`}
          onClick={(event) => onCopy({ slug, label, icon: Icon, signature }, event.currentTarget)}
        >
          <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
          <span>{label}</span>
          <code>{signature ? "sig" : "icon"}-{slug}</code>
          <small className="ds-v3-copied">{copied === slug ? "คัดลอกแล้ว" : "คัดลอก SVG"}</small>
        </button>
      ))}
    </div>
  );
}

/** Searchable v3 icon catalog; copied SVG is serialized from the rendered icon component. */
export function IconCatalog() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState(24);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const copiedTimer = useRef<number | undefined>(undefined);
  const normalized = query.trim().toLocaleLowerCase();
  const filter = (entries: IconEntry[]) => entries.filter((entry) => `${entry.slug} ${entry.label}`.toLocaleLowerCase().includes(normalized));

  const copySvg = async (entry: IconEntry, button: HTMLButtonElement) => {
    const svg = button.querySelector("svg")?.cloneNode(true) as SVGSVGElement | null;
    if (!svg) return;
    svg.removeAttribute("class");
    svg.removeAttribute("aria-hidden");
    svg.removeAttribute("focusable");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    const markup = new XMLSerializer().serializeToString(svg);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markup);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = markup;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copiedToClipboard = document.execCommand("copy");
        textarea.remove();
        if (!copiedToClipboard) throw new Error("clipboard unavailable");
      }
      setCopied(entry.slug);
      setMessage(`คัดลอก SVG ${entry.slug} แล้ว`);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setMessage("คัดลอกไม่สำเร็จ · ใช้ HTTPS หรืออนุญาต clipboard");
    }
  };

  return (
    <div className="ds-v3-catalog">
      <div className="ds-v3-toolbar">
        <label className="ds-v3-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">ค้นหาไอคอน</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา เช่น แต้ม, QR, crown" />
        </label>
        <div className="ds-v3-size-picker" role="group" aria-label="ขนาดไอคอน">
          {[16, 20, 24, 32].map((value) => (
            <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)}>{value}</button>
          ))}
        </div>
        <span className="ds-v3-count">{filter(ICONS).length} / {ICONS.length} icons</span>
      </div>
      <IconGrid entries={filter(ICONS)} size={size} copied={copied} onCopy={copySvg} />
      <h3 className="ds-v3-subheading">Signature icons</h3>
      <p className="ds-v3-muted">สัญลักษณ์ตกแต่งสำหรับจุดเน้นและการสื่อสารแบรนด์ ไม่ใช่ป้ายบอกสิทธิประโยชน์</p>
      <IconGrid entries={filter(SIGNATURES)} size={size} copied={copied} onCopy={copySvg} />
      <div className="ds-v3-icon-states" aria-label="ตัวอย่างสถานะไอคอน">
        <span><Check size={18} /> ปกติ</span><span className="is-active"><Sparkles size={18} /> เน้น</span>
        <span className="is-disabled"><CircleCheck size={18} /> ปิดใช้งาน</span><span className="is-danger"><CircleAlert size={18} /> ผิดพลาด</span>
      </div>
      <p className="ds-v3-live" role="status" aria-live="polite">{message}</p>
    </div>
  );
}

export { ICONS as V3IconEntries, SIGNATURES as V3SignatureIcons };
