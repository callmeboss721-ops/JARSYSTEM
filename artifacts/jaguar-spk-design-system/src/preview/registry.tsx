import { lazy, type ComponentType } from "react";
import { ColorsPage, FontsPage, LayoutPage, OverviewPage } from "./foundations";

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const BrandButtonDemo = lazyPage(() => import("./demos/brand-button").then(({ BrandButtonDemo }) => BrandButtonDemo));
const BrandIconDemo = lazyPage(() => import("./demos/brand-icon").then(({ BrandIconDemo }) => BrandIconDemo));
const ActionControlsDemo = lazyPage(() => import("./demos/action-controls").then(({ ActionControlsDemo }) => ActionControlsDemo));
const CollectingTrackDemo = lazyPage(() => import("./demos/collecting-track").then(({ CollectingTrackDemo }) => CollectingTrackDemo));
const DialogSheetDemo = lazyPage(() => import("./demos/dialog-sheet").then(({ DialogSheetDemo }) => DialogSheetDemo));
const FeedbackStatesDemo = lazyPage(() => import("./demos/feedback-states").then(({ FeedbackStatesDemo }) => FeedbackStatesDemo));
const FormControlsDemo = lazyPage(() => import("./demos/form-controls").then(({ FormControlsDemo }) => FormControlsDemo));
const JaguarMarkDemo = lazyPage(() => import("./demos/jaguar-mark").then(({ JaguarMarkDemo }) => JaguarMarkDemo));
const MemberCardCarouselDemo = lazyPage(() => import("./demos/member-card-carousel").then(({ MemberCardCarouselDemo }) => MemberCardCarouselDemo));
const MobileTabBarDemo = lazyPage(() => import("./demos/mobile-tab-bar").then(({ MobileTabBarDemo }) => MobileTabBarDemo));
const MembershipCardsDemo = lazyPage(() => import("./demos/membership-cards").then(({ MembershipCardsDemo }) => MembershipCardsDemo));
const PinPadDemo = lazyPage(() => import("./demos/pin-pad").then(({ PinPadDemo }) => PinPadDemo));
const PrimaryButtonDemo = lazyPage(() => import("./demos/primary-button").then(({ PrimaryButtonDemo }) => PrimaryButtonDemo));
const PublicPosterDemo = lazyPage(() => import("./demos/public-poster").then(({ PublicPosterDemo }) => PublicPosterDemo));
const RankEmblemsDemo = lazyPage(() => import("./demos/rank-emblems").then(({ RankEmblemsDemo }) => RankEmblemsDemo));
const SamutPrakanArtDemo = lazyPage(() => import("./demos/samut-prakan-art").then(({ SamutPrakanArtDemo }) => SamutPrakanArtDemo));
const SeparatorDemo = lazyPage(() => import("./demos/separator").then(({ SeparatorDemo }) => SeparatorDemo));
const SkeletonDemo = lazyPage(() => import("./demos/skeleton").then(({ SkeletonDemo }) => SkeletonDemo));
const ToastFeedbackDemo = lazyPage(() => import("./demos/toast-feedback").then(({ ToastFeedbackDemo }) => ToastFeedbackDemo));
const ToggleDemo = lazyPage(() => import("./demos/toggle").then(({ ToggleDemo }) => ToggleDemo));
const TooltipDemo = lazyPage(() => import("./demos/tooltip").then(({ TooltipDemo }) => TooltipDemo));

export type PreviewEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = { name: string; entries: PreviewEntry[] };

export const DESIGN_SYSTEM = {
  title: "JAGUAR SPK Design System",
  description: "ระบบภาพและคอมโพเนนต์ภาษาไทยเป็นหลักสำหรับ JAGUAR SPK DRINK · v3 tokens และ interaction showcases",
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: "overview",
  name: "ภาพรวม",
  description: "โทเค็น v3, แบรนด์เดิม และภาพรวมคอมโพเนนต์ที่นำกลับใช้ได้",
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: "แบรนด์",
    entries: [
      { id: "brand-mark", name: "ตรา JAGUAR", description: "เครื่องหมายต้นฉบับและการแสดงผลที่ไม่ครอป", Page: JaguarMarkDemo },
      { id: "brand-ranks", name: "ตราระดับสมาชิก", description: "ตัวอย่าง shield 10 ระดับตามชื่อและลำดับเดิม", Page: RankEmblemsDemo },
      { id: "brand-city-art", name: "ภาพสมุทรปราการ", description: "ภาพเส้นสะพาน ปากน้ำ และแนวเมือง", Page: SamutPrakanArtDemo },
    ],
  },
  {
    name: "สี",
    entries: [{ id: "color-roles", name: "สีแบรนด์", description: "เขียวนีออน ทอง พื้นหลัง และสีสถานะ v3", Page: ColorsPage }],
  },
  {
    name: "ตัวอักษร",
    entries: [{ id: "type-scale", name: "ฟอนต์ไทย", description: "ฟอนต์หัวข้อ เนื้อหา และรหัส", Page: FontsPage }],
  },
  {
    name: "เลย์เอาต์",
    entries: [{ id: "spacing-radius", name: "ระยะและพื้นผิว", description: "สเกล spacing, radius และ glass surface", Page: LayoutPage }],
  },
  {
    name: "การกระทำ",
    entries: [
      { id: "brand-button", name: "ปุ่มภาพแบรนด์", description: "ปุ่ม JAGUAR SPK พร้อมสถานะและโฟกัส", Page: BrandButtonDemo },
      { id: "v3-actions", name: "Action controls v3", description: "ปุ่มสีเขียว/ทอง เมนู สวิตช์ และ segmented control", Page: ActionControlsDemo },
    ],
  },
  {
    name: "ตัวควบคุม",
    entries: [
      { id: "primary-button", name: "ปุ่มพื้นฐาน", description: "ปุ่มหลายรูปแบบ ขนาด และการประกอบลิงก์", Page: PrimaryButtonDemo },
      { id: "form-controls", name: "ช่องกรอกข้อมูล", description: "Input, Label และ Textarea สำหรับฟอร์ม", Page: FormControlsDemo },
      { id: "separator", name: "เส้นแบ่ง", description: "เส้นแบ่งแนวนอนและแนวตั้ง พร้อมความหมาย", Page: SeparatorDemo },
      { id: "tooltip", name: "คำอธิบายสั้น", description: "Tooltip รองรับเมาส์ โฟกัส และคีย์บอร์ด", Page: TooltipDemo },
      { id: "toggle", name: "สวิตช์กดได้", description: "ปุ่มสลับสถานะที่รองรับคีย์บอร์ดและ disabled", Page: ToggleDemo },
      { id: "dialog-sheet", name: "Dialog และ Sheet", description: "หน้าต่างยืนยันและแผงสไลด์หลายทิศทาง", Page: DialogSheetDemo },
      { id: "toast-feedback", name: "Toast แจ้งเตือน", description: "ข้อความสำเร็จ ผิดพลาด ปัดปิด และ action", Page: ToastFeedbackDemo },
      { id: "skeleton", name: "Skeleton โหลดข้อมูล", description: "โครงร่างบัตรและรายการระหว่างโหลด", Page: SkeletonDemo },
    ],
  },
  {
    name: "คอมโพเนนต์",
    entries: [
      { id: "brand-icons", name: "Icon catalog v3", description: "ค้นหา เลือกขนาด และคัดลอก SVG พร้อม signature icons", Page: BrandIconDemo },
      { id: "collecting-track", name: "แถบสะสม 10 ช่อง", description: "ตัวอย่างแต้มสองคลับพร้อมสถานะพร้อมแลก", Page: CollectingTrackDemo },
      { id: "membership-cards", name: "บัตรและแต้ม", description: "บัตรสองคลับ แสตมป์ และ QR", Page: MembershipCardsDemo },
      { id: "member-card-carousel", name: "สลับบัตรสมาชิก", description: "แท็บสองคลับ ปัด และคีย์บอร์ด", Page: MemberCardCarouselDemo },
      { id: "mobile-tab-bar", name: "Mobile tab bar", description: "ตัวอย่างเมนูมือถือและปุ่มสแกนที่สลับหน้าจอได้", Page: MobileTabBarDemo },
      { id: "pin-pad", name: "แป้น PIN", description: "กรอก ลบ และล้าง PIN แบบควบคุมค่า", Page: PinPadDemo },
      { id: "feedback-states", name: "สถานะและหน้าต่าง", description: "โหลด ว่าง ผิดพลาด ออกจากระบบ และ modal", Page: FeedbackStatesDemo },
    ],
  },
  {
    name: "เนื้อหา",
    entries: [{ id: "public-poster", name: "ป้าย QR สมัครสมาชิก", description: "QR สมัครสมาชิกและรูปแบบพิมพ์", Page: PublicPosterDemo }],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [OVERVIEW_ENTRY, ...NAV_GROUPS.flatMap((group) => group.entries)];

const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(", ")}.`);
}
