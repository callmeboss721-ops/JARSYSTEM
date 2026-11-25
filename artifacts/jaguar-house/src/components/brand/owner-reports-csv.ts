import type { Formula, OwnerAuditEntry, OwnerSummary } from "@workspace/api-client-react";

const FORMULA_LABELS: Record<Formula, string> = {
  red: "สูตรแดง Original",
  silver: "สูตรฟ้า Refresh / Mild",
  gold: "สูตรทอง Premium",
};

const EVENT_LABELS: Record<OwnerAuditEntry["event_type"], string> = {
  sale: "ซื้อสินค้า",
  cannabis: "ซื้อกัญชา",
  redemption: "แลกรางวัล",
  points: "เพิ่มแต้ม",
  correction: "แก้ไขรายการ",
};

const STATUS_LABELS: Record<OwnerAuditEntry["status"], string> = {
  completed: "สำเร็จ",
  redeemed: "แลกแล้ว",
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  rejected: "ปฏิเสธแล้ว",
  corrected: "แก้ไขแล้ว",
};

/**
 * Escapes a CSV cell and neutralizes spreadsheet formula injection (leading =, +, -, @, tab, CR).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return safe;
}

function toCsvText(rows: Array<Array<string | number | null | undefined>>): string {
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

export function buildOwnerSalesCsv(summary: OwnerSummary, generatedAt = new Date()): string {
  const timestamp = generatedAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const rows: Array<Array<string | number | null | undefined>> = [
    ["รายงานสรุปยอดขาย JAGUAR SPK", timestamp],
    [],
    ["หัวข้อสรุป", "จำนวน", "หน่วย"],
    ["ยอดขายวันนี้", summary.today_sales, "บาท"],
    ["ยอดขายรวมทั้งหมด", summary.total_sales, "บาท"],
    ["จำนวนครั้งเข้าร้านวันนี้", summary.today_visits, "ครั้ง"],
    ["จำนวนครั้งเข้าร้านรวม", summary.total_visits, "ครั้ง"],
    ["แต้มที่ออกวันนี้", summary.today_points_issued, "แต้ม"],
    ["แลกฟรีหน้าร้านวันนี้", summary.today_redemptions, "ครั้ง"],
    ["แลกรางวัลรวม", summary.redemptions, "ครั้ง"],
    ["สมาชิกทั้งหมด", summary.members, "คน"],
    ["สมาชิกมีรายการซื้อกระท่อมจริง", summary.kratom_members, "คน"],
    ["สมาชิกมีรายการซื้อกัญชาจริง", summary.cannabis_members, "คน"],
    [],
    ["สูตร", "บิลวันนี้", "ขวดวันนี้", "แต้มวันนี้", "ยอดวันนี้ (บาท)", "บิลรวม", "ขวดรวม", "แต้มรวม", "ยอดรวม (บาท)"],
    ...summary.by_formula.map((row) => [
      FORMULA_LABELS[row.formula] ?? row.formula,
      row.today_sales_count,
      row.today_bottles_sold,
      row.today_points_awarded,
      row.today_amount_baht,
      row.sales_count,
      row.bottles_sold,
      row.points_awarded,
      row.amount_baht,
    ]),
  ];
  return toCsvText(rows);
}

export function buildOwnerActivityCsv(events: OwnerAuditEntry[]): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["วันเวลา (เวลาไทย)", "ประเภท", "รหัสสมาชิก", "ชื่อสมาชิก", "รายละเอียด", "แต้มเปลี่ยนแปลง", "สถานะ"],
    ...events.map((event) => [
      new Date(event.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      EVENT_LABELS[event.event_type] ?? event.event_type,
      event.member_code,
      event.member_label || event.member_code,
      event.description,
      event.points_delta,
      STATUS_LABELS[event.status] ?? event.status,
    ]),
  ];
  return toCsvText(rows);
}

export function downloadCsvFile(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
