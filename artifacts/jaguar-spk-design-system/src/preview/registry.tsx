import { lazy, type ComponentType } from "react";
import { ColorsPage, FontsPage, LayoutPage, OverviewPage } from "./foundations";

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const BrandButtonDemo = lazyPage(() => import("./demos/brand-button").then(({ BrandButtonDemo }) => BrandButtonDemo));
const BrandIconDemo = lazyPage(() => import("./demos/brand-icon").then(({ BrandIconDemo }) => BrandIconDemo));
const JaguarMarkDemo = lazyPage(() => import("./demos/jaguar-mark").then(({ JaguarMarkDemo }) => JaguarMarkDemo));
const MembershipCardsDemo = lazyPage(() => import("./demos/membership-cards").then(({ MembershipCardsDemo }) => MembershipCardsDemo));
const RankEmblemsDemo = lazyPage(() => import("./demos/rank-emblems").then(({ RankEmblemsDemo }) => RankEmblemsDemo));

export type PreviewEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = { name: string; entries: PreviewEntry[] };

export const DESIGN_SYSTEM = {
  title: "JAGUAR SPK Design System",
  description: "ระบบภาพและคอมโพเนนต์สำหรับ JAGUAR SPK DRINK ที่ถอดแบบจากเว็บ Jaguar Kratom House",
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: "overview",
  name: "ภาพรวม",
  description: "สี ตัวอักษร โลโก้ และตัวอย่างคอมโพเนนต์ชุดแรก",
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: "แบรนด์",
    entries: [
      { id: "brand-mark", name: "ตรา JAGUAR", description: "เครื่องหมายต้นฉบับและการแสดงผลที่ไม่ครอป", Page: JaguarMarkDemo },
      { id: "brand-ranks", name: "ตราระดับสมาชิก", description: "ชุดตราสมาชิก 10 ระดับจากภาพร้าน", Page: RankEmblemsDemo },
    ],
  },
  {
    name: "สี",
    entries: [{ id: "color-roles", name: "สีแบรนด์", description: "ทอง มรกต พื้นหลัง และสีสถานะ", Page: ColorsPage }],
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
    entries: [{ id: "brand-button", name: "ปุ่มภาพแบรนด์", description: "ปุ่ม JAGUAR SPK พร้อมสถานะและโฟกัส", Page: BrandButtonDemo }],
  },
  {
    name: "คอมโพเนนต์",
    entries: [
      { id: "brand-icons", name: "ไอคอน glass", description: "ไอคอนเส้นที่ใช้สีตามความหมาย", Page: BrandIconDemo },
      { id: "membership-cards", name: "บัตรและแต้ม", description: "บัตรสองคลับ แสตมป์ และ QR", Page: MembershipCardsDemo },
    ],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [OVERVIEW_ENTRY, ...NAV_GROUPS.flatMap((group) => group.entries)];

const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(", ")}.`);
}
