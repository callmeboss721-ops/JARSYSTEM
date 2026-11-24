import assert from "node:assert/strict";
import test from "node:test";
import { buildOwnerActivityCsv, buildOwnerSalesCsv, escapeCsvCell } from "./owner-reports-csv.ts";

test("neutralizes spreadsheet formula prefixes and quotes commas", () => {
  assert.equal(escapeCsvCell("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(escapeCsvCell("+10"), "'+10");
  assert.equal(escapeCsvCell("สูตรทอง, พิเศษ"), '"สูตรทอง, พิเศษ"');
  assert.equal(escapeCsvCell(150), "150");
});

test("builds UTF-8 BOM sales report CSV with formula breakdown", () => {
  const csv = buildOwnerSalesCsv(
    {
      today_sales: 500,
      total_sales: 2500,
      today_visits: 3,
      total_visits: 15,
      today_points_issued: 5,
      today_redemptions: 1,
      redemptions: 4,
      members: 20,
      kratom_members: 18,
      cannabis_members: 2,
      by_formula: [
        {
          formula: "gold",
          today_sales_count: 2,
          today_bottles_sold: 6,
          today_points_awarded: 3,
          today_amount_baht: 300,
          sales_count: 10,
          bottles_sold: 30,
          points_awarded: 15,
          amount_baht: 1500,
        },
      ],
    },
    new Date("2026-11-24T10:00:00.000Z"),
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("ยอดขายวันนี้,500,บาท"));
  assert.ok(csv.includes("สูตรทอง Premium,2,6,3,300,10,30,15,1500"));
});

test("builds UTF-8 BOM activity CSV for accounting records", () => {
  const csv = buildOwnerActivityCsv([
    {
      id: "1",
      event_type: "sale",
      member_code: "JG0001",
      member_label: "คุณเอ",
      description: "ซื้อ 3 ขวด · ฿150",
      points_delta: 1,
      status: "completed",
      created_at: "2026-11-24T10:00:00.000Z",
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("ซื้อสินค้า,JG0001,คุณเอ,ซื้อ 3 ขวด · ฿150,1,สำเร็จ"));
});
