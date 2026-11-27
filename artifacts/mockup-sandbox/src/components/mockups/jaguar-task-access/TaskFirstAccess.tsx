import { useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Package,
  ReceiptText,
  Search,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { tokens } from "@workspace/jaguar-spk-design-system/tokens";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import "@workspace/jaguar-spk-design-system/styles.css";
import "./taskfirstaccess.css";

type AccessRole = "staff" | "owner";

const destinations = [
  {
    id: "member-search",
    role: "staff",
    title: "ค้นหาสมาชิก",
    subtitle: "MEMBER LOOKUP",
    description: "ค้นหาบัญชีสมาชิกเพื่อดูข้อมูลและบริการที่เคาน์เตอร์",
    action: "ค้นหาสมาชิก",
    icon: Search,
  },
  {
    id: "record-sale",
    role: "staff",
    title: "บันทึกการขาย",
    subtitle: "RECORD A SALE",
    description: "เริ่มรายการขายหน้าร้านและตรวจสอบรายการก่อนบันทึก",
    action: "บันทึกการขาย",
    icon: ReceiptText,
  },
  {
    id: "redeem-reward",
    role: "staff",
    title: "แลกรางวัล",
    subtitle: "REDEEM REWARD",
    description: "ตรวจสิทธิ์สมาชิกและดำเนินการแลกรางวัลที่หน้าร้าน",
    action: "แลกรางวัล",
    icon: Gift,
  },
  {
    id: "manage-members",
    role: "owner",
    title: "จัดการสมาชิก",
    subtitle: "MEMBER MANAGEMENT",
    description: "ดูแลบัญชีสมาชิกและข้อมูลที่เกี่ยวข้องกับร้าน",
    action: "จัดการสมาชิก",
    icon: UsersRound,
  },
  {
    id: "catalog-rewards",
    role: "owner",
    title: "สินค้าและรางวัล",
    subtitle: "CATALOG & REWARDS",
    description: "จัดการแค็ตตาล็อกสินค้าและรายการรางวัลของร้าน",
    action: "ดูแลสินค้าและรางวัล",
    icon: Package,
  },
  {
    id: "store-overview",
    role: "owner",
    title: "ภาพรวมร้าน",
    subtitle: "STORE OVERVIEW",
    description: "เข้าสู่ภาพรวมการดำเนินงานและข้อมูลของร้าน",
    action: "ดูภาพรวมร้าน",
    icon: ChartNoAxesCombined,
  },
] satisfies Array<{
  id: string;
  role: AccessRole;
  title: string;
  subtitle: string;
  description: string;
  action: string;
  icon: typeof Search;
}>;

export function TaskFirstAccess() {
  const [selectedId, setSelectedId] = useState("member-search");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [feedback, setFeedback] = useState("");
  const selected = destinations.find((destination) => destination.id === selectedId) ?? destinations[0];
  const role = selected.role;
  const isOwner = role === "owner";
  const minimumPin = isOwner ? 6 : 4;
  const theme = {
    "--ta-background": tokens.color.brandId2026.background,
    "--ta-surface": tokens.color.brandId2026.surface,
    "--ta-raised": tokens.color.brandId2026.surfaceRaised,
    "--ta-border": tokens.color.brandId2026.border,
    "--ta-border-strong": tokens.color.brandId2026.borderStrong,
    "--ta-text": tokens.color.brandId2026.text,
    "--ta-muted": tokens.color.brandId2026.muted,
    "--ta-gold": tokens.color.brandId2026.gold,
    "--ta-green": tokens.color.brandId2026.jaguarGreen,
    "--ta-focus": tokens.color.brandId2026.neon,
  } as CSSProperties;

  const chooseDestination = (id: string) => {
    setSelectedId(id);
    setPin("");
    setFeedback("");
  };

  const submitAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length < minimumPin) {
      setFeedback(`PIN สำหรับ${isOwner ? "เจ้าของร้าน" : "พนักงาน"}ต้องมีอย่างน้อย ${minimumPin} หลัก`);
      return;
    }
    setFeedback(`ตัวอย่างเส้นทาง “${selected.title}” เท่านั้น · ยังไม่ได้เชื่อมต่อระบบยืนยันตัวตน`);
  };

  return (
    <main className="ta-shell" data-brand-theme="2026" style={theme}>
      <header className="ta-header">
        <div className="ta-brand">
          <JaguarMark size={42} title="JAGUAR SPK" />
          <span>
            <strong>JAGUAR <i>SPK</i></strong>
            <small>STAFF &amp; OWNER ACCESS</small>
          </span>
        </div>
        <div className="ta-secure"><span /> SECURE ACCESS</div>
      </header>

      <div className="ta-main">
        <section className="ta-heading" aria-labelledby="ta-title">
          <p className="ta-kicker"><span>01</span> TASK-FIRST ENTRY <i /></p>
          <div className="ta-heading-row">
            <div>
              <h1 id="ta-title">เริ่มจากงานที่ต้องทำ</h1>
              <p>เลือกปลายทางก่อน ระบบจะแสดงช่องทางเข้าใช้งานของบทบาทที่จำเป็น</p>
            </div>
            <div className="ta-step-note"><span>01</span> เลือกงาน <b>→</b> <span>02</span> ยืนยันตัวตน</div>
          </div>
        </section>

        <div className="ta-workspace">
          <section className="ta-routes" aria-label="เลือกเส้นทางการทำงาน">
            <div className="ta-group-heading">
              <div className="ta-group-mark ta-mark-staff"><Store size={17} aria-hidden="true" /></div>
              <div><h2>งานหน้าร้าน</h2><p>STAFF COUNTER</p></div>
              <span className="ta-group-owner">พนักงาน</span>
            </div>
            <div className="ta-route-grid">
              {destinations.filter((destination) => destination.role === "staff").map((destination, index) => {
                const Icon = destination.icon;
                const active = destination.id === selectedId;
                return (
                  <button
                    key={destination.id}
                    type="button"
                    className={`ta-route${active ? " is-selected" : ""}`}
                    aria-pressed={active}
                    onClick={() => chooseDestination(destination.id)}
                  >
                    <span className="ta-route-top"><Icon size={18} aria-hidden="true" /><span>0{index + 1}</span></span>
                    <strong>{destination.title}</strong>
                    <small>{destination.description}</small>
                    <span className="ta-route-action">{destination.action}<ArrowUpRight size={15} aria-hidden="true" /></span>
                  </button>
                );
              })}
            </div>

            <div className="ta-group-heading ta-owner-heading">
              <div className="ta-group-mark ta-mark-owner"><ChartNoAxesCombined size={17} aria-hidden="true" /></div>
              <div><h2>งานบริหารร้าน</h2><p>OWNER CONSOLE</p></div>
              <span className="ta-group-owner">เจ้าของร้าน</span>
            </div>
            <div className="ta-route-grid">
              {destinations.filter((destination) => destination.role === "owner").map((destination, index) => {
                const Icon = destination.icon;
                const active = destination.id === selectedId;
                return (
                  <button
                    key={destination.id}
                    type="button"
                    className={`ta-route ta-route-owner${active ? " is-selected" : ""}`}
                    aria-pressed={active}
                    onClick={() => chooseDestination(destination.id)}
                  >
                    <span className="ta-route-top"><Icon size={18} aria-hidden="true" /><span>0{index + 1}</span></span>
                    <strong>{destination.title}</strong>
                    <small>{destination.description}</small>
                    <span className="ta-route-action">{destination.action}<ArrowUpRight size={15} aria-hidden="true" /></span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className={`ta-gate${isOwner ? " is-owner" : ""}`} aria-labelledby="ta-gate-title">
            <div className="ta-gate-topline">
              <span><LockKeyhole size={15} aria-hidden="true" /> ACCESS GATE</span>
              <span>02 / 02</span>
            </div>
            <p className="ta-gate-eyebrow">SELECTED DESTINATION</p>
            <h2 id="ta-gate-title">{selected.title}</h2>
            <p className="ta-gate-description">{selected.description}</p>

            <div className="ta-gate-role">
              <span className="ta-role-symbol">{isOwner ? <ChartNoAxesCombined size={18} /> : <Store size={18} />}</span>
              <span><strong>ยืนยันบทบาท: {isOwner ? "เจ้าของร้าน" : "พนักงาน"}</strong><small>{isOwner ? "OWNER CONSOLE · 6–12 DIGITS" : "STAFF COUNTER · 4–12 DIGITS"}</small></span>
              <ShieldCheck size={17} aria-label="บทบาทถูกกำหนดจากงานที่เลือก" />
            </div>

            <form className="ta-pin-form" onSubmit={submitAccess}>
              <label htmlFor="ta-pin">PIN สำหรับ{isOwner ? "เจ้าของร้าน" : "พนักงาน"}</label>
              <div className="ta-pin-entry">
                <Input
                  id="ta-pin"
                  className="ta-pin-input"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={12}
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 12));
                    setFeedback("");
                  }}
                  placeholder="••••••"
                  aria-label={`PIN สำหรับ${isOwner ? "เจ้าของร้าน" : "พนักงาน"}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ta-toggle-pin"
                  aria-label={showPin ? "ซ่อน PIN" : "แสดง PIN"}
                  aria-pressed={showPin}
                  onClick={() => setShowPin((visible) => !visible)}
                >
                  {showPin ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
              <div className="ta-pin-hint"><span>ใช้ตัวเลขเท่านั้น</span><span>{minimumPin}–12 หลัก</span></div>
              {feedback && <p className={`ta-feedback${pin.length < minimumPin ? " is-error" : ""}`} role={pin.length < minimumPin ? "alert" : "status"}>{feedback}</p>}
              <Button type="submit" className="ta-submit">
                ยืนยันเพื่อเข้าใช้งาน <ArrowRight aria-hidden="true" />
              </Button>
            </form>

            <div className="ta-safety">
              <ShieldCheck size={17} aria-hidden="true" />
              <p>ปลายทางและบทบาทแสดงชัดเจนก่อนกรอก PIN</p>
            </div>
            <p className="ta-demo-note">LOCAL PREVIEW · ไม่มีการส่ง PIN หรือเรียก API</p>
          </aside>
        </div>

        <div className="ta-bottom-note">
          <span><ShieldCheck size={16} aria-hidden="true" /> เข้าใช้งานตามหน้าที่ ลดความสับสนระหว่างพนักงานและเจ้าของร้าน</span>
          <span>TASK → ROLE → PIN</span>
        </div>
      </div>

      <footer className="ta-footer">
        <span>JAGUAR SPK <i>STORE ACCESS</i></span>
        <span>STAFF <b>·</b> OWNER <b>·</b> TASK FIRST</span>
      </footer>
    </main>
  );
}
