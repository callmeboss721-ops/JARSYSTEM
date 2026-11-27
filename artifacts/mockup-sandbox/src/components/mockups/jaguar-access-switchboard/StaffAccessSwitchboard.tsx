import { useState, type FormEvent, type CSSProperties } from "react";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, LockKeyhole, ShieldCheck, Store } from "lucide-react";
import { tokens } from "@workspace/jaguar-spk-design-system/tokens";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import "@workspace/jaguar-spk-design-system/styles.css";
import "./staffaccessswitchboard.css";

type AccessRole = "staff" | "owner";

const roleDetails = {
  staff: {
    label: "พนักงานหน้าร้าน",
    english: "STAFF COUNTER",
    minimumPin: 4,
    tasks: ["ค้นหาสมาชิก", "บันทึกการขาย", "แลกรางวัล"],
    description: "สำหรับบริการลูกค้าและงานประจำวันหน้าร้าน",
  },
  owner: {
    label: "เจ้าของร้าน",
    english: "OWNER CONSOLE",
    minimumPin: 6,
    tasks: ["จัดการสมาชิก", "ดูแลสินค้าและรางวัล", "ตรวจภาพรวมร้าน"],
    description: "สำหรับจัดการข้อมูลและการดำเนินงานของร้าน",
  },
} satisfies Record<AccessRole, {
  label: string;
  english: string;
  minimumPin: number;
  tasks: string[];
  description: string;
}>;

export function StaffAccessSwitchboard() {
  const [role, setRole] = useState<AccessRole>("staff");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [message, setMessage] = useState("");
  const details = roleDetails[role];
  const theme = {
    "--sa-background": tokens.color.brandId2026.background,
    "--sa-surface": tokens.color.brandId2026.surface,
    "--sa-raised": tokens.color.brandId2026.surfaceRaised,
    "--sa-border": tokens.color.brandId2026.border,
    "--sa-border-strong": tokens.color.brandId2026.borderStrong,
    "--sa-text": tokens.color.brandId2026.text,
    "--sa-muted": tokens.color.brandId2026.muted,
    "--sa-gold": tokens.color.brandId2026.gold,
    "--sa-green": tokens.color.brandId2026.jaguarGreen,
    "--sa-focus": tokens.color.brandId2026.neon,
  } as CSSProperties;

  const selectRole = (nextRole: AccessRole) => {
    setRole(nextRole);
    setPin("");
    setMessage("");
  };

  const submitAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length < details.minimumPin) {
      setMessage(`PIN ของ${details.label}ต้องมีอย่างน้อย ${details.minimumPin} หลัก`);
      return;
    }
    setMessage("ตัวอย่างหน้าจอเท่านั้น · การยืนยันตัวตนต้องเชื่อมต่อระบบจริง");
  };

  return (
    <main className="sa-shell dark" data-brand-theme="2026" style={theme}>
      <header className="sa-header">
        <div className="sa-brand">
          <JaguarMark size={42} title="JAGUAR SPK" />
          <span>
            <strong>JAGUAR <i>SPK</i></strong>
            <small>STAFF &amp; OWNER</small>
          </span>
        </div>
        <div className="sa-header-status">
          <span className="sa-status-dot" />
          <span>SECURE ACCESS</span>
        </div>
      </header>

      <div className="sa-layout">
        <section className="sa-intro" aria-labelledby="sa-title">
          <p className="sa-eyebrow"><span>01</span> STORE OPERATIONS <i /></p>
          <h1 id="sa-title">เริ่มต้นที่<br /><em>บทบาทของคุณ</em></h1>
          <p className="sa-intro-copy">
            เลือกพื้นที่ทำงานก่อนกรอก PIN เพื่อให้แน่ใจว่าคุณกำลังเข้าสู่ระบบที่ถูกต้อง
          </p>

          <div className="sa-flow" aria-label="ขั้นตอนการเข้าใช้งาน">
            <div className="sa-flow-step is-current">
              <span>01</span>
              <div><strong>เลือกบทบาท</strong><small>STAFF OR OWNER</small></div>
            </div>
            <span className="sa-flow-line" />
            <div className="sa-flow-step">
              <span>02</span>
              <div><strong>กรอก PIN</strong><small>VERIFY ACCESS</small></div>
            </div>
          </div>

          <aside className="sa-safety-note">
            <ShieldCheck aria-hidden="true" size={20} />
            <div>
              <strong>ตรวจสอบสิทธิ์ก่อนเข้าใช้งาน</strong>
              <p>ชื่อบทบาทและข้อกำหนด PIN จะแสดงชัดเจนก่อนยืนยัน</p>
            </div>
          </aside>

          <p className="sa-edition">JAGUAR KRATOM HOUSE <span>·</span> ACCESS PORTAL</p>
        </section>

        <section className="sa-access-card" aria-labelledby="sa-access-title">
          <div className="sa-card-topline">
            <span><LockKeyhole size={15} aria-hidden="true" /> ACCESS POINT</span>
            <span>01 / 02</span>
          </div>

          <div className="sa-card-heading">
            <p className="sa-overline">CHOOSE YOUR WORKSPACE</p>
            <h2 id="sa-access-title">เข้าสู่ระบบร้านค้า</h2>
            <p>เลือกระดับการเข้าถึงก่อนกรอกรหัสส่วนตัว</p>
          </div>

          <div className="sa-role-switch" role="group" aria-label="เลือกระดับการเข้าถึง">
            <Button
              type="button"
              variant={role === "staff" ? "default" : "ghost"}
              className={`sa-role-choice${role === "staff" ? " is-active" : ""}`}
              aria-pressed={role === "staff"}
              onClick={() => selectRole("staff")}
            >
              <Store aria-hidden="true" />
              <span><strong>พนักงาน</strong><small>STAFF COUNTER</small></span>
            </Button>
            <Button
              type="button"
              variant={role === "owner" ? "secondary" : "ghost"}
              className={`sa-role-choice${role === "owner" ? " is-active is-owner" : ""}`}
              aria-pressed={role === "owner"}
              onClick={() => selectRole("owner")}
            >
              <BriefcaseBusiness aria-hidden="true" />
              <span><strong>เจ้าของร้าน</strong><small>OWNER CONSOLE</small></span>
            </Button>
          </div>

          <div className="sa-selected-role" aria-live="polite">
            <span className={`sa-role-icon${role === "owner" ? " is-owner" : ""}`}>
              {role === "staff" ? <Store size={19} aria-hidden="true" /> : <BriefcaseBusiness size={19} aria-hidden="true" />}
            </span>
            <div>
              <strong>{details.label}</strong>
              <small>{details.description}</small>
            </div>
            <span className="sa-access-tag">{details.english}</span>
          </div>

          <div className="sa-task-list" aria-label={`งานของ${details.label}`}>
            {details.tasks.map((task, index) => (
              <span key={task}><i>{String(index + 1).padStart(2, "0")}</i>{task}</span>
            ))}
          </div>

          <form className="sa-pin-form" onSubmit={submitAccess}>
            <label htmlFor="sa-pin">PIN สำหรับ{details.label}</label>
            <div className="sa-pin-field">
              <Input
                id="sa-pin"
                className="sa-pin-input"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={12}
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 12));
                  setMessage("");
                }}
                aria-describedby="sa-pin-help"
                placeholder="••••••"
                aria-label={`PIN สำหรับ${details.label}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sa-visibility"
                aria-label={showPin ? "ซ่อน PIN" : "แสดง PIN"}
                aria-pressed={showPin}
                onClick={() => setShowPin((visible) => !visible)}
              >
                {showPin ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            <div className="sa-pin-help" id="sa-pin-help">
              <span>ใช้ตัวเลขเท่านั้น</span>
              <span>{details.minimumPin}–12 หลัก</span>
            </div>
            {message && (
              <p
                className={`sa-feedback${pin.length < details.minimumPin ? " is-error" : ""}`}
                role={pin.length < details.minimumPin ? "alert" : "status"}
              >
                {message}
              </p>
            )}
            <Button type="submit" className="sa-submit">
              ดูตัวอย่างการเข้าใช้งาน <ArrowRight aria-hidden="true" />
            </Button>
          </form>

          <p className="sa-demo-footnote">LOCAL PREVIEW · ไม่มีการส่ง PIN หรือเรียก API</p>
        </section>
      </div>

      <footer className="sa-footer">
        <span>JAGUAR SPK <i>STORE ACCESS</i></span>
        <span>STAFF <b>·</b> OWNER <b>·</b> PIN PROTECTED</span>
      </footer>
    </main>
  );
}
