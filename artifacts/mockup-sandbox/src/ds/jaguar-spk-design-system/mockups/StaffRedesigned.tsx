import { useState, type FormEvent } from "react";
import { BrandIcon, type BrandIconName } from "@workspace/jaguar-spk-design-system/components/ui/brand-icon";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { Input } from "@workspace/jaguar-spk-design-system/components/ui/input";
import { JaguarMark } from "@workspace/jaguar-spk-design-system/components/ui/jaguar-mark";
import { Label } from "@workspace/jaguar-spk-design-system/components/ui/label";
import { PinPad } from "@workspace/jaguar-spk-design-system/components/ui/pin-pad";

type StaffTab = "counter" | "product-sales" | "members" | "open" | "banking" | "settings";
type DemoMember = { name: string; code: string; phone: string; points: number; cannabisPoints: number; cannabisGrams: number };

const initialMembers: DemoMember[] = [
  { name: "มะลิ", code: "JSPK2048", phone: "xxx-xxx-4821", points: 7, cannabisPoints: 4, cannabisGrams: 400 },
  { name: "ธนา", code: "JSPK3186", phone: "xxx-xxx-9034", points: 10, cannabisPoints: 2, cannabisGrams: 200 },
  { name: "กานต์", code: "JSPK5721", phone: "xxx-xxx-1176", points: 3, cannabisPoints: 0, cannabisGrams: 0 },
];

const tabItems: { id: StaffTab; label: string; icon: BrandIconName }[] = [
  { id: "counter", label: "หน้าเคาน์เตอร์", icon: "lightning" },
  { id: "product-sales", label: "ขายสินค้า", icon: "products" },
  { id: "members", label: "สมาชิก", icon: "members" },
  { id: "open", label: "เปิดบัญชี", icon: "add" },
  { id: "banking", label: "บัญชี / โอน", icon: "banking" },
  { id: "settings", label: "ตั้งค่า PIN", icon: "security" },
];

const sampleItems = [
  { name: "น้ำดื่ม", category: "เครื่องดื่ม", price: 10 },
  { name: "ขนมขบเคี้ยว", category: "ของทานเล่น", price: 25 },
  { name: "แก้ว JAGUAR", category: "ของใช้", price: 89 },
];

export function StaffRedesigned() {
  const [signedIn, setSignedIn] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "workspace",
  );
  const [tab, setTab] = useState<StaffTab>("counter");
  const [pin, setPin] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("JSPK2048");
  const [selectedMember, setSelectedMember] = useState<DemoMember | null>(initialMembers[0]);
  const [counterMode, setCounterMode] = useState<"kratom" | "cannabis">("kratom");
  const [notice, setNotice] = useState("ข้อมูลตัวอย่าง · ไม่มีการเชื่อมต่อระบบร้าน");
  const [customPoints, setCustomPoints] = useState("");
  const [bottles, setBottles] = useState("1");
  const [formula, setFormula] = useState("red");
  const [salesCart, setSalesCart] = useState<Record<string, number>>({});
  const [productCategory, setProductCategory] = useState("ทั้งหมด");
  const [payment, setPayment] = useState("cash");
  const [memberFilter, setMemberFilter] = useState("");
  const [newMember, setNewMember] = useState({ name: "", nickname: "", code: "", phone: "" });
  const [transfer, setTransfer] = useState({ direction: "in", amount: "", note: "" });
  const [bankHistory, setBankHistory] = useState<string[]>(["รับเข้า · ฿1,200 · ตัวอย่าง"]);
  const [editingTransfer, setEditingTransfer] = useState(false);
  const [editTransfer, setEditTransfer] = useState({ direction: "in", amount: "1200", note: "รับเงินหน้าร้าน", reason: "" });
  const [pendingReward, setPendingReward] = useState(true);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rewardHistory, setRewardHistory] = useState(["10:16 · ส่งมอบแล้ว · ตัวอย่าง JSPK3186"]);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [activity, setActivity] = useState<string[]>([
    "ตัวอย่าง · 10:42 · บันทึกซื้อ 2 ขวด",
    "ตัวอย่าง · 10:18 · เพิ่ม 1 แต้ม",
  ]);

  const setSampleNotice = (message: string) => setNotice(`ตัวอย่างจำลอง · ${message} · ไม่บันทึกข้อมูลจริง`);
  const addActivity = (entry: string) => setActivity((items) => [`ตัวอย่าง · ${entry}`, ...items].slice(0, 4));

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = members.find((member) => `${member.name} ${member.code} ${member.phone}`.toLowerCase().includes(search.trim().toLowerCase()));
    if (match) {
      setSelectedMember(match);
      setSampleNotice(`พบสมาชิก ${match.code}`);
    } else {
      setSelectedMember(null);
      setSampleNotice("ไม่พบสมาชิกตัวอย่าง ลองค้นหาด้วย JSPK2048");
    }
  }

  function adjustPoints(amount: number) {
    if (!selectedMember) return;
    setMembers((current) => current.map((member) => member.code === selectedMember.code
      ? { ...member, points: Math.min(10, member.points + amount) }
      : member));
    const nextMember = { ...selectedMember, points: Math.min(10, selectedMember.points + amount) };
    setSelectedMember(nextMember);
    addActivity(`เพิ่ม ${amount} แต้ม · ${selectedMember.code}`);
    setSampleNotice(`เพิ่ม ${amount} แต้มให้ ${selectedMember.code}`);
    setCustomPoints("");
  }

  function recordKratomSale() {
    if (!selectedMember || counterMode !== "kratom" || !bottles || Number(bottles) < 1 || Number(bottles) > 999) return;
    addActivity(`บันทึกซื้อ ${bottles} ขวด · ${selectedMember.code}`);
    setSampleNotice(`บันทึกซื้อ ${bottles} ขวด · ฿${(Number(bottles) * 50).toLocaleString("th-TH")} · แต้มตัวอย่าง`);
  }

  function recordCannabisPurchase() {
    if (!selectedMember || counterMode !== "cannabis" || !bottles || Number(bottles) < 1 || Number(bottles) > 999) return;
    const grams = Number(bottles);
    const addedPoints = Math.floor(grams / 100);
    setMembers((current) => current.map((member) => member.code === selectedMember.code
      ? { ...member, cannabisPoints: Math.min(10, member.cannabisPoints + addedPoints), cannabisGrams: member.cannabisGrams + grams }
      : member));
    addActivity(`ซื้อกัญชา ${grams} กรัม · ${selectedMember.code}`);
    setSampleNotice(`บันทึกซื้อ ${grams} กรัม · เพิ่ม ${addedPoints} แต้มกัญชาตัวอย่าง`);
  }

  function recordProductSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = Object.values(salesCart).reduce((sum, value) => sum + value, 0);
    if (count === 0) {
      setSampleNotice("เพิ่มสินค้าอย่างน้อย 1 รายการก่อนบันทึก");
      return;
    }
    const total = sampleItems.reduce((sum, item) => sum + item.price * (salesCart[item.name] ?? 0), 0);
    addActivity(`ขายสินค้าทั่วไป · ฿${total.toLocaleString("th-TH")}`);
    setSampleNotice(`บันทึกยอดขายตัวอย่าง ฿${total.toLocaleString("th-TH")} · ไม่สะสมแต้ม`);
    setSalesCart({});
  }

  function createDemoMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMember.name.trim() || !newMember.code.trim() || !newMember.phone.trim()) return;
    const created = { name: newMember.nickname.trim() || newMember.name.trim(), code: newMember.code.trim().toUpperCase(), phone: `xxx-xxx-${newMember.phone.slice(-4)}`, points: 0, cannabisPoints: 0, cannabisGrams: 0 };
    setMembers((current) => [created, ...current]);
    setNewMember({ name: "", nickname: "", code: "", phone: "" });
    setSampleNotice(`สร้างบัญชีตัวอย่าง ${created.code}`);
  }

  function recordTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transfer.amount || Number(transfer.amount) <= 0) return;
    const label = `${transfer.direction === "in" ? "รับเข้า" : "เงินออก"} · ฿${Number(transfer.amount).toLocaleString("th-TH")}${transfer.note ? ` · ${transfer.note}` : ""} · ตัวอย่าง`;
    setBankHistory((current) => [label, ...current].slice(0, 5));
    setTransfer({ ...transfer, amount: "", note: "" });
    setSampleNotice("เพิ่มรายการโอนในบัญชีตัวอย่าง");
  }

  function saveTransferCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTransfer.amount || Number(editTransfer.amount) <= 0 || editTransfer.reason.trim().length < 3) {
      setSampleNotice("ตรวจยอดและระบุเหตุผลการแก้ไขอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setBankHistory((current) => [`${editTransfer.direction === "in" ? "รับเข้า" : "เงินออก"} · ฿${Number(editTransfer.amount).toLocaleString("th-TH")}${editTransfer.note ? ` · ${editTransfer.note}` : ""} · แก้ไขตัวอย่าง`, ...current.slice(1)]);
    setEditingTransfer(false);
    setSampleNotice("แก้ไขรายการโอนวันนี้ในตัวอย่าง · มีบันทึกเหตุผล");
  }

  const currentMember = selectedMember
    ? members.find((member) => member.code === selectedMember.code) ?? selectedMember
    : null;
  const counterPoints = currentMember
    ? counterMode === "kratom" ? currentMember.points : currentMember.cannabisPoints
    : 0;
  const cartTotal = sampleItems.reduce((sum, item) => sum + item.price * (salesCart[item.name] ?? 0), 0);

  return (
    <main data-brand-theme="2026" className="dark min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <JaguarMark size={38} src="/__mockup/jaguar-spk-mark.webp" title="JAGUAR SPK" className="object-contain" />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold tracking-wider text-accent sm:text-base">JAGUAR <span className="text-primary">STAFF</span></p>
              <p className="text-xs text-muted-foreground">พื้นที่ทำงานพนักงาน</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent sm:inline-flex">ตัวอย่างเท่านั้น</span>
            <Button type="button" variant="outline" size="sm" onClick={() => { setSignedIn((value) => !value); setNotice("ตัวอย่างจำลอง · โหมดพรีวิวเท่านั้น"); }}>
              {signedIn ? "ดูสถานะ PIN" : "ดูพื้นที่ตัวอย่าง"}
            </Button>
            {signedIn && <Button type="button" variant="ghost" size="sm" onClick={() => { setSignedIn(false); setPin(""); }}>ออกจากตัวอย่าง</Button>}
          </div>
        </div>
      </header>

      {!signedIn ? (
        <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
          <div className="hidden items-center justify-center lg:flex">
            <img src="/__mockup/staff-idle-mascot.webp" alt="" className="max-h-96 max-w-full object-contain" />
          </div>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Staff access · ตัวอย่าง</p>
              <h1 className="font-display text-3xl font-semibold">เข้าสู่ระบบพนักงาน</h1>
              <p className="text-sm text-muted-foreground">ใช้ PIN ที่เจ้าของร้านกำหนด</p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); setSignedIn(true); setPin(""); setNotice("ตัวอย่างจำลอง · เข้าสู่พื้นที่ทำงาน"); }} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="staff-demo-pin">PIN พนักงาน</Label>
                <Input id="staff-demo-pin" type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={12} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 12))} className="min-h-12 text-center text-2xl tracking-[0.5em]" />
              </div>
              <PinPad value={pin} onChange={setPin} label="แป้นตัวเลข PIN พนักงานตัวอย่าง" />
              <Button type="submit" size="lg" className="min-h-12 w-full">เข้าสู่พื้นที่ทำงานตัวอย่าง</Button>
            </form>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground" role="note">
              สวิตช์นี้มีไว้ตรวจหน้าจอเท่านั้น · PIN และการเข้าสู่ระบบไม่เชื่อมต่อบริการจริง
            </p>
            <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setSampleNotice("ลิงก์เข้าสู่ระบบเจ้าของร้านอยู่ในระบบจริง")}>
              เข้าสู่ระบบเจ้าของร้าน
            </Button>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Counter operations · ตัวอย่าง</p>
              <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">เคาน์เตอร์ร้าน</h1>
              <p className="mt-1 text-sm text-muted-foreground">ค้นหาสมาชิก บันทึกรายการ และจัดการเครื่องมือระหว่างกะ</p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              โหมดพรีวิว · ข้อมูลสมมติ · ไม่มีการบันทึกจริง
            </div>
          </section>

          <nav aria-label="เมนูหลักพนักงาน" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-3 lg:grid-cols-6">
            {tabItems.map((item) => (
              <Button key={item.id} type="button" variant={tab === item.id ? "secondary" : "ghost"} aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className="min-h-11 justify-start px-3 text-left">
                <BrandIcon name={item.icon} size={17} tone="inherit" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          <p role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
            <BrandIcon name="pending" size={17} tone="gold" />
            <span>{notice}</span>
          </p>

          {tab === "counter" && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="counter-search-title">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Counter lookup</p>
                      <h2 id="counter-search-title" className="mt-1 font-display text-xl font-semibold">ค้นหาสมาชิก</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">รหัส · เบอร์เต็ม · 4 หลักท้าย · QR</span>
                  </div>
                  <form onSubmit={submitLookup} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="staff-member-lookup">รหัสสมาชิก เบอร์โทร หรือเลขท้าย 4 หลัก</Label>
                      <Input id="staff-member-lookup" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ลองค้นหา JSPK2048" autoComplete="off" className="min-h-12" />
                    </div>
                    <Button type="submit" size="lg" className="min-h-12 self-end">ค้นหา</Button>
                    <Button type="button" size="lg" variant="outline" className="min-h-12 self-end" onClick={() => setSampleNotice("การสแกน QR มีในระบบร้านจริง · ไม่เปิดกล้องในตัวอย่าง")}>
                      <BrandIcon name="qr" size={17} /> สแกน QR
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4" role="group" aria-label="เลือกประเภทบัตร">
                    <Button type="button" variant={counterMode === "kratom" ? "secondary" : "outline"} aria-pressed={counterMode === "kratom"} onClick={() => { setCounterMode("kratom"); setBottles("1"); }}>กระท่อม · ขวด</Button>
                    <Button type="button" variant={counterMode === "cannabis" ? "secondary" : "outline"} aria-pressed={counterMode === "cannabis"} onClick={() => { setCounterMode("cannabis"); setBottles("100"); }}>กัญชา · กรัม</Button>
                    <p className="self-center text-xs text-muted-foreground">ยอดแต้มแยกตามประเภทบัตร · ตัวอย่าง</p>
                  </div>
                  {currentMember ? (
                    <div className="rounded-xl border border-accent/40 bg-background p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">สมาชิกตัวอย่าง</p>
                          <h3 className="font-display text-lg font-semibold">{currentMember.name}</h3>
                          <p className="font-mono text-sm text-accent">{currentMember.code} <span className="text-muted-foreground">· {currentMember.phone}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{counterMode === "kratom" ? "แต้มกระท่อม" : "แต้มกัญชา"} (ตัวอย่าง)</p>
                          <p className="font-display text-3xl font-bold text-primary">{counterPoints}<span className="text-base font-medium text-muted-foreground"> / 10</span></p>
                          {counterMode === "cannabis" && <p className="mt-1 text-xs text-muted-foreground">ซื้อสะสม {currentMember.cannabisGrams} กรัม · แยกจากบัตรกระท่อม</p>}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold">เพิ่มแต้มโบนัส</h4>
                            <span className="text-xs text-muted-foreground">ครั้งละ 1–20 แต้ม</span>
                          </div>
                          {counterMode === "kratom" && <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 5].map((amount) => <Button key={amount} type="button" variant="outline" className="min-h-11" onClick={() => adjustPoints(amount)}>+{amount}</Button>)}
                          </div>}
                          {counterMode === "kratom" && <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const amount = Number(customPoints); if (amount >= 1 && amount <= 20) adjustPoints(amount); else setSampleNotice("ระบุแต้มตัวอย่างตั้งแต่ 1–20"); }}>
                            <div className="min-w-0 flex-1 space-y-2">
                              <Label htmlFor="custom-points">แต้มกำหนดเอง (1–20)</Label>
                              <Input id="custom-points" type="number" min="1" max="20" value={customPoints} onChange={(event) => setCustomPoints(event.target.value)} className="min-h-11" />
                            </div>
                            <Button type="submit" variant="secondary" className="mt-auto min-h-11">เพิ่มแต้ม</Button>
                          </form>}
                          <Button type="button" variant="outline" className="w-full" disabled={counterPoints < 10} onClick={() => { setMembers((current) => current.map((member) => member.code === currentMember.code ? counterMode === "kratom" ? { ...member, points: member.points - 10 } : { ...member, cannabisPoints: member.cannabisPoints - 10 } : member)); setSampleNotice(`ทดลองแลกรางวัลให้ ${currentMember.code} · หัก 10 แต้ม${counterMode === "kratom" ? "กระท่อม" : "กัญชา"}ตัวอย่าง`); addActivity(`แลกรางวัล · ${currentMember.code}`); }}>
                            แลกรางวัล · ใช้ 10 แต้ม
                          </Button>
                          {counterPoints < 10 && <p className="text-xs text-muted-foreground">อีก {10 - counterPoints} แต้มจึงแลกรางวัลตัวอย่างได้</p>}
                        </div>
                        <div className="space-y-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                          <h4 className="font-semibold">{counterMode === "kratom" ? "บันทึกซื้อกระท่อม" : "ประทับแต้มจากยอดซื้อกัญชา"}</h4>
                          {counterMode === "kratom" ? (
                            <div className="grid grid-cols-4 gap-2">
                              {[1, 2, 3, 6].map((qty) => <Button key={qty} type="button" variant={bottles === String(qty) ? "secondary" : "outline"} aria-pressed={bottles === String(qty)} className="min-h-11" onClick={() => setBottles(String(qty))}>{qty} ขวด</Button>)}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {[100, 200, 300, 500].map((qty) => <Button key={qty} type="button" variant={bottles === String(qty) ? "secondary" : "outline"} aria-pressed={bottles === String(qty)} className="min-h-11 px-2 text-xs" onClick={() => setBottles(String(qty))}>+{qty / 100} แต้ม · {qty} กรัม</Button>)}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="staff-sale-quantity">{counterMode === "kratom" ? "จำนวนขวดในบิล" : "จำนวนกรัมที่ซื้อ"}</Label>
                            <Input id="staff-sale-quantity" type="number" min="1" max="999" value={bottles} onChange={(event) => setBottles(event.target.value)} className="min-h-11" />
                          </div>
                          {counterMode === "kratom" && <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">เลือกสูตร</legend>
                            <div className="grid grid-cols-3 gap-2">
                              {[["red", "แดง · Original"], ["silver", "ฟ้า · Refresh"], ["gold", "ทอง · Premium"]].map(([value, label]) => <Button key={value} type="button" size="sm" variant={formula === value ? "secondary" : "outline"} aria-pressed={formula === value} onClick={() => setFormula(value)} className="min-h-11 whitespace-normal px-2">{label}</Button>)}
                            </div>
                          </fieldset>}
                          {counterMode === "kratom" ? <>
                            <p className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                              <span className="text-muted-foreground">ยอดตัวอย่าง</span><strong className="font-mono text-accent">฿{(Number(bottles || 0) * 50).toLocaleString("th-TH")}</strong>
                            </p>
                            <Button type="button" size="lg" className="min-h-12 w-full" onClick={recordKratomSale}>บันทึกยอดซื้อและแต้ม</Button>
                            <p className="text-xs leading-5 text-muted-foreground">฿50 / ขวดตามหน้าร้าน · การสะสมแต้มและเศษสะสมเป็นกติกาของระบบจริง</p>
                          </> : <>
                            <p className="text-xs leading-5 text-muted-foreground">ทุก 100 กรัมต่อ 1 แต้ม · เศษกรัมทบต่อโดยระบบร้าน</p>
                            <Button type="button" size="lg" className="min-h-12 w-full" onClick={recordCannabisPurchase}>บันทึกยอดซื้อกัญชา</Button>
                          </>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      <img src="/__mockup/staff-idle-mascot.webp" alt="" className="h-16 w-14 object-contain" />
                      <span>ค้นหาสมาชิกตัวอย่างก่อนเริ่มบันทึกยอดซื้อหรือแต้ม</span>
                    </div>
                  )}
                </section>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="workflow-title">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Counter flow</p>
                    <h2 id="workflow-title" className="mt-1 font-display text-lg font-semibold">ขั้นตอนทำรายการ</h2>
                    <ol className="mt-4 space-y-3">
                      {["ค้นหาสมาชิก", "ตรวจยอดและสิทธิ์", "บันทึกหรือแลก"].map((step, index) => (
                        <li key={step} className="flex items-center gap-3 text-sm">
                          <span className={`grid size-8 shrink-0 place-items-center rounded-full border ${currentMember && index < 2 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{currentMember && index < 2 ? <BrandIcon name="success" size={15} /> : `0${index + 1}`}</span>
                          <span>{step}</span>
                          {currentMember && index === 1 && <span className="ml-auto text-xs text-primary">กำลังทำรายการ</span>}
                        </li>
                      ))}
                    </ol>
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="activity-title">
                    <div className="flex items-center justify-between gap-2">
                      <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Session activity</p><h2 id="activity-title" className="mt-1 font-display text-lg font-semibold">รายการล่าสุด</h2></div>
                      <BrandIcon name="history" size={20} tone="gold" />
                    </div>
                    <ol className="mt-3 divide-y divide-border">
                      {activity.map((item, index) => <li key={`${item}-${index}`} className="py-3 text-sm text-muted-foreground">{item}</li>)}
                    </ol>
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="redemption-queue-title">
                    <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rewards · ตัวอย่าง</p><h2 id="redemption-queue-title" className="mt-1 font-display text-lg font-semibold">รายการแลกรอส่งมอบ</h2></div><span className="rounded-full border border-border px-3 py-1 text-xs">{pendingReward ? "1 รายการตัวอย่าง" : "0 รายการตัวอย่าง"}</span></div>
                    {pendingReward ? <article className="mt-3 rounded-xl border border-border p-3">
                      <p className="font-semibold">รางวัล 1 รายการ</p><p className="text-sm text-muted-foreground">มะลิ · JSPK2048 · ใช้ 10 แต้ม · ข้อมูลตัวอย่าง</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2"><Button type="button" variant="secondary" className="min-h-11" onClick={() => { setPendingReward(false); setRewardHistory((current) => [`ตัวอย่าง · 11:05 · ยืนยันส่งมอบ · JSPK2048`, ...current]); setSampleNotice("ยืนยันส่งมอบรางวัลตัวอย่างแล้ว"); }}>ยืนยันส่งมอบ</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => setShowRejectForm(true)}>ปฏิเสธคำขอ</Button></div>
                      {showRejectForm && <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); if (rejectReason.trim().length < 3) return; setPendingReward(false); setRewardHistory((current) => [`ตัวอย่าง · 11:05 · ปฏิเสธคำขอ · ${rejectReason}`, ...current]); setRejectReason(""); setShowRejectForm(false); setSampleNotice("ปฏิเสธคำขอตัวอย่าง · ไม่มีการหักแต้มจริง"); }}>
                        <Label htmlFor="sample-reject-reason">เหตุผลการปฏิเสธ (ตัวอย่าง)</Label><Input id="sample-reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} minLength={3} maxLength={200} required className="min-h-11" />
                        <div className="grid grid-cols-2 gap-2"><Button type="button" variant="ghost" onClick={() => { setRejectReason(""); setShowRejectForm(false); }}>ยกเลิก</Button><Button type="submit" variant="outline" className="min-h-11">ยืนยันปฏิเสธ</Button></div>
                      </form>}
                    </article> : <p className="mt-3 text-sm text-muted-foreground">ไม่มีรายการรอยืนยันในตัวอย่างนี้</p>}
                    <div className="mt-4 border-t border-border pt-3"><h3 className="text-sm font-semibold">รายการแลกรางวัลล่าสุด</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{rewardHistory.slice(0, 3).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>
                  </section>
                  <section className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent">Sample data</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">ชื่อสมาชิก ยอดแต้ม ประวัติ และยอดเงินในหน้านี้เป็นข้อมูลสมมติสำหรับตรวจหน้าจอเท่านั้น</p>
                  </section>
                </aside>
              </div>
            </div>
          )}

          {tab === "product-sales" && (
            <section className="space-y-5" aria-labelledby="product-sales-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product counter · ไม่สะสมแต้ม</p><h2 id="product-sales-title" className="mt-1 font-display text-2xl font-semibold">ขายสินค้า</h2><p className="mt-1 text-sm text-muted-foreground">บันทึกการซื้อทั่วไปโดยไม่ต้องใช้รหัสสมาชิก · รายการสมมติ</p></div>
                <div className="w-full space-y-2 sm:w-auto"><Label htmlFor="product-date">ประวัติวันที่ (เวลาไทย)</Label><Input id="product-date" type="date" defaultValue="2026-06-15" className="min-h-11" /></div>
              </div>
              <form onSubmit={recordProductSale} className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="catalog-title">
                  <div className="flex items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">Active catalog · ตัวอย่าง</p><h3 id="catalog-title" className="font-display text-lg font-semibold">เลือกสินค้า</h3></div><span className="rounded-full border border-border px-3 py-1 text-xs">3 รายการตัวอย่าง</span></div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">หมวดสินค้า</p>
                    <div className="flex flex-wrap gap-2" aria-label="กรองหมวดสินค้า">
                      {["ทั้งหมด", ...sampleItems.map((item) => item.category)].map((category) => <Button key={category} type="button" size="sm" variant={productCategory === category ? "secondary" : "outline"} aria-pressed={productCategory === category} className="min-h-11" onClick={() => setProductCategory(category)}>{category}</Button>)}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sampleItems.filter((item) => productCategory === "ทั้งหมด" || item.category === productCategory).map((item) => (
                      <article key={item.name} className="flex flex-col justify-between rounded-xl border border-border bg-background p-4">
                        <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.category} · ตัวอย่าง</p><p className="mt-2 font-mono text-accent">฿{item.price}</p><p className="text-xs text-muted-foreground">สต็อกตัวอย่าง · ไม่ยืนยันยอดจริง</p></div>
                        <div className="mt-4 flex items-center justify-between gap-2"><span className="text-sm">ในตะกร้า {salesCart[item.name] ?? 0}</span><Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setSalesCart((cart) => ({ ...cart, [item.name]: (cart[item.name] ?? 0) + 1 }))}>เพิ่ม</Button></div>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="cart-title">
                  <p className="text-xs text-muted-foreground">Current sale · ตัวอย่าง</p><h3 id="cart-title" className="font-display text-lg font-semibold">ตะกร้าขาย</h3>
                  <ul className="mt-3 divide-y divide-border">
                    {sampleItems.filter((item) => (salesCart[item.name] ?? 0) > 0).map((item) => <li key={item.name} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0 flex-1">{item.name}<small className="block text-muted-foreground">฿{item.price} × {salesCart[item.name]}</small></span>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="icon" variant="outline" aria-label={`ลดจำนวน ${item.name}`} onClick={() => setSalesCart((cart) => ({ ...cart, [item.name]: Math.max(0, (cart[item.name] ?? 0) - 1) }))}>−</Button>
                        <span>{salesCart[item.name]}</span>
                        <Button type="button" size="icon" variant="outline" aria-label={`เพิ่มจำนวน ${item.name}`} onClick={() => setSalesCart((cart) => ({ ...cart, [item.name]: (cart[item.name] ?? 0) + 1 }))}>+</Button>
                      </div>
                    </li>)}
                  </ul>
                  {!Object.values(salesCart).some(Boolean) && <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">เลือกสินค้าจากรายการเพื่อเริ่มตะกร้าตัวอย่าง</p>}
                  <fieldset className="mt-4 space-y-2"><legend className="text-sm font-medium">วิธีชำระเงิน</legend><div className="grid grid-cols-3 gap-2">
                    {[["cash", "เงินสด"], ["transfer", "โอน"], ["other", "อื่น ๆ"]].map(([value, label]) => <Button key={value} type="button" size="sm" variant={payment === value ? "secondary" : "outline"} aria-pressed={payment === value} onClick={() => setPayment(value)} className="min-h-11 px-2">{label}</Button>)}
                  </div></fieldset>
                  <div className="mt-4 space-y-2"><Label htmlFor="product-slip">แนบสลิป (ไม่บังคับ)</Label><Input id="product-slip" type="file" accept="image/jpeg,image/png,image/webp" /><p className="text-xs text-muted-foreground">ภาพส่วนตัว JPG, PNG หรือ WebP · ตัวอย่างเท่านั้น</p></div>
                  <div className="mt-4 flex justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">ยอดรวมตัวอย่าง</span><strong className="font-mono text-xl text-accent">฿{cartTotal.toLocaleString("th-TH")}</strong></div>
                  <Button type="submit" size="lg" className="mt-4 min-h-12 w-full">ยืนยันและบันทึกตัวอย่างการขาย</Button>
                </section>
              </form>
              <section className="rounded-2xl border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs text-muted-foreground">Independent product ledger</p><h3 className="font-display text-lg font-semibold">ประวัติการขายสินค้า</h3></div><p className="text-sm text-muted-foreground">ตัวอย่าง · 2 สำเร็จ · 0 ยกเลิก · ฿1,250</p></div><ul className="mt-3 divide-y divide-border"><li className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>10:42 · น้ำดื่ม × 2 · เงินสด <small className="block text-muted-foreground">ตัวอย่าง · พนักงาน</small></span><strong className="font-mono">฿20</strong></li><li className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>09:58 · แก้ว JAGUAR × 1 · โอน <small className="block text-muted-foreground">ตัวอย่าง · พนักงาน</small></span><strong className="font-mono">฿89</strong></li></ul></section>
            </section>
          )}

          {tab === "members" && (
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="members-title">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Member directory · ตัวอย่าง</p><h2 id="members-title" className="mt-1 font-display text-xl font-semibold">สมาชิกทั้งหมด</h2></div><span className="text-sm text-muted-foreground">{members.length} รายการตัวอย่าง</span></div>
              <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => event.preventDefault()}>
                <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="member-filter">กรองด้วยชื่อหรือรหัส</Label><Input id="member-filter" value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="min-h-11" /></div>
                <Button type="submit" variant="outline" className="min-h-11">ค้นหา</Button>
              </form>
              <ul className="mt-4 divide-y divide-border">
                {members.filter((member) => `${member.name} ${member.code}`.toLowerCase().includes(memberFilter.toLowerCase())).map((member) => <li key={member.code} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1"><p className="font-medium">{member.name} <span className="text-xs text-muted-foreground">ตัวอย่าง</span></p><p className="font-mono text-sm text-accent">{member.code} · {member.phone}</p></div>
                  <p className="font-mono text-xl">{member.points}<span className="ml-1 text-xs text-muted-foreground">แต้ม</span></p>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => { setSelectedMember(member); setSearch(member.code); setTab("counter"); }}>เปิดที่เคาน์เตอร์</Button>
                </li>)}
              </ul>
            </section>
          )}

          {tab === "open" && (
            <section className="max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="create-member-title">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New member · ตัวอย่าง</p><h2 id="create-member-title" className="mb-1 mt-1 font-display text-xl font-semibold">เปิดบัญชีสมาชิก</h2><p className="mb-5 text-sm text-muted-foreground">ช่องข้อมูลตามแบบฟอร์มพนักงาน · จะเพิ่มเฉพาะรายการในตัวอย่างนี้</p>
              <form onSubmit={createDemoMember} className="space-y-4">
                {([["name", "ชื่อจริง"], ["nickname", "ชื่อเล่น"], ["code", "รหัสสมาชิก 6–8 ตัว"], ["phone", "เบอร์มือถือ"]] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`new-member-${key}`}>{label}</Label><Input id={`new-member-${key}`} required={key !== "nickname"} inputMode={key === "phone" ? "tel" : undefined} value={newMember[key]} onChange={(event) => setNewMember((value) => ({ ...value, [key]: key === "code" ? event.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() : event.target.value }))} className="min-h-11" /></div>)}
                <Button type="submit" size="lg" className="min-h-12 w-full">สร้างบัญชีตัวอย่าง</Button>
              </form>
            </section>
          )}

          {tab === "banking" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="bank-account-title">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Counter banking · ตัวอย่าง</p><h2 id="bank-account-title" className="mt-1 font-display text-xl font-semibold">บัญชีรับเงินวันนี้</h2>
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <p className="font-semibold">ธนาคารตัวอย่าง</p><p className="text-sm text-muted-foreground">ร้าน JAGUAR SPK · ข้อมูลสมมติ</p><p className="mt-3 font-mono text-lg">xxx-x-xxxxx-x</p><p className="mt-1 text-xs text-muted-foreground">ข้อมูลบัญชีตัวอย่าง · ไม่ใช่เลขบัญชีจริง</p>
                </div>
                <form onSubmit={recordTransfer} className="mt-5 space-y-4">
                  <fieldset className="space-y-2"><legend className="text-sm font-medium">ประเภทรายการ</legend><div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={transfer.direction === "in" ? "secondary" : "outline"} aria-pressed={transfer.direction === "in"} className="min-h-11" onClick={() => setTransfer((current) => ({ ...current, direction: "in" }))}>รับเข้า</Button>
                    <Button type="button" variant={transfer.direction === "out" ? "secondary" : "outline"} aria-pressed={transfer.direction === "out"} className="min-h-11" onClick={() => setTransfer((current) => ({ ...current, direction: "out" }))}>โอนออก</Button>
                  </div></fieldset>
                  <div className="space-y-2"><Label htmlFor="transfer-amount">จำนวนเงิน (บาท)</Label><Input id="transfer-amount" inputMode="decimal" value={transfer.amount} onChange={(event) => setTransfer((current) => ({ ...current, amount: event.target.value }))} placeholder="เช่น 850" required className="min-h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="transfer-note">หมายเหตุ (ไม่บังคับ)</Label><Input id="transfer-note" value={transfer.note} onChange={(event) => setTransfer((current) => ({ ...current, note: event.target.value }))} placeholder="เช่น ค่าสินค้า / คืนเงิน" className="min-h-11" /></div>
                  {transfer.direction === "in" && <p className="text-xs leading-5 text-muted-foreground">วงเงินรับเข้าเป็นขีดจำกัดประจำวัน · แสดงวงเงินตัวอย่าง ฿10,000</p>}
                  <Button type="submit" size="lg" className="min-h-12 w-full">บันทึก{transfer.direction === "in" ? "รับเงิน" : "เงินออก"}ตัวอย่าง</Button>
                </form>
              </section>
              <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="ledger-title">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transfer ledger · ตัวอย่าง</p><h2 id="ledger-title" className="mt-1 font-display text-xl font-semibold">รายการโอนวันนี้</h2></div><span className="rounded-full border border-border px-3 py-1 text-xs">{bankHistory.length} รายการตัวอย่าง</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">รับเข้า</p><p className="mt-1 font-mono text-lg">฿1,200</p></div><div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">โอนออก</p><p className="mt-1 font-mono text-lg">฿0</p></div></div>
                <ol className="mt-4 divide-y divide-border">{bankHistory.map((item, index) => <li key={`${item}-${index}`} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"><span>{item}<p className="text-xs text-muted-foreground">วันนี้ · ตัวอย่างพนักงาน</p></span>{index === 0 && <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => setEditingTransfer(true)}>แก้ไขรายการ</Button>}</li>)}</ol>
                {editingTransfer && <form onSubmit={saveTransferCorrection} className="mt-3 space-y-3 rounded-xl border border-border p-3">
                  <p className="font-semibold">แก้ไขรายการวันนี้ · ตัวอย่าง</p>
                  <fieldset className="grid grid-cols-2 gap-2"><legend className="mb-2 text-sm">ประเภทรายการ</legend><Button type="button" variant={editTransfer.direction === "in" ? "secondary" : "outline"} aria-pressed={editTransfer.direction === "in"} className="min-h-11" onClick={() => setEditTransfer((current) => ({ ...current, direction: "in" }))}>รับเข้า</Button><Button type="button" variant={editTransfer.direction === "out" ? "secondary" : "outline"} aria-pressed={editTransfer.direction === "out"} className="min-h-11" onClick={() => setEditTransfer((current) => ({ ...current, direction: "out" }))}>โอนออก</Button></fieldset>
                  <div className="space-y-2"><Label htmlFor="edit-transfer-amount">จำนวนเงิน (บาท)</Label><Input id="edit-transfer-amount" inputMode="decimal" value={editTransfer.amount} onChange={(event) => setEditTransfer((current) => ({ ...current, amount: event.target.value }))} required className="min-h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="edit-transfer-note">หมายเหตุ</Label><Input id="edit-transfer-note" value={editTransfer.note} onChange={(event) => setEditTransfer((current) => ({ ...current, note: event.target.value }))} className="min-h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="edit-transfer-reason">เหตุผลการแก้ไข</Label><Input id="edit-transfer-reason" value={editTransfer.reason} onChange={(event) => setEditTransfer((current) => ({ ...current, reason: event.target.value }))} minLength={3} required className="min-h-11" /></div>
                  <div className="grid grid-cols-2 gap-2"><Button type="button" variant="ghost" onClick={() => setEditingTransfer(false)}>ยกเลิก</Button><Button type="submit" className="min-h-11">บันทึกรายการตัวอย่าง</Button></div>
                </form>}
                <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">รายการจริงของระบบสามารถแก้ไขได้เฉพาะรายการวันนี้และเก็บประวัติการแก้ไข · ตัวอย่างนี้ไม่เชื่อมต่อบัญชี</p>
              </section>
            </div>
          )}

          {tab === "settings" && (
            <section className="max-w-xl rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="pin-settings-title">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Security · ตัวอย่าง</p><h2 id="pin-settings-title" className="mt-1 font-display text-xl font-semibold">เปลี่ยน PIN พนักงาน</h2><p className="mb-5 mt-2 text-sm leading-6 text-muted-foreground">ระบบจริงจะออกจากระบบพนักงานบนอุปกรณ์นี้หลังบันทึก · หน้านี้เป็นตัวอย่างในเครื่อง</p>
              <form onSubmit={(event) => { event.preventDefault(); if (newPin.length < 4 || newPin.length > 12) { setSampleNotice("PIN ใหม่ตัวอย่างต้องมี 4–12 หลัก"); return; } setOldPin(""); setNewPin(""); setSampleNotice("ทดลองเปลี่ยน PIN แล้ว · ไม่มีการบันทึกจริง"); }}>
                <div className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="old-staff-pin">PIN ปัจจุบัน</Label><Input id="old-staff-pin" type="password" inputMode="numeric" value={oldPin} onChange={(event) => setOldPin(event.target.value.replace(/\D/g, "").slice(0, 12))} className="min-h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="new-staff-pin">PIN ใหม่ (ตัวเลข 4–12 หลัก)</Label><Input id="new-staff-pin" type="password" inputMode="numeric" maxLength={12} value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 12))} className="min-h-11" /></div>
                  <PinPad value={newPin} onChange={setNewPin} label="แป้นตัวเลขสำหรับ PIN ใหม่ตัวอย่าง" />
                  <Button type="submit" size="lg" className="min-h-12 w-full">ทดลองบันทึก PIN</Button>
                </div>
              </form>
            </section>
          )}

          <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
            JAGUAR SPK STAFF · ข้อมูลทุกช่องเป็นตัวอย่าง · ไม่มี API, การยืนยันตัวตน หรือธุรกรรมจริง
          </footer>
        </div>
      )}
    </main>
  );
}
