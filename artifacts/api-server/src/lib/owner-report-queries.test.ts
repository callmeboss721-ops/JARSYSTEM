import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createRequire } from "node:module";
const {
  ownerAuditLogSql,
  ownerMemberHistorySql,
  ownerReportByFormulaSql,
  ownerReportTotalsSql,
} = await import(new URL("./owner-report-queries.ts", import.meta.url).href);

type FixtureClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
  release: () => void;
};
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for owner report integration tests");
const { Pool } = createRequire(new URL("../../../../lib/db/src/index.ts", import.meta.url))("pg") as {
  Pool: new (config: { connectionString: string; statement_timeout: number }) => {
    connect: () => Promise<FixtureClient>;
    end: () => Promise<void>;
  };
};
const pool = new Pool({ connectionString: databaseUrl, statement_timeout: 8000 });
after(async () => { await pool.end(); });

const regularA = "00000000-0000-4000-8000-000000000001";
const regularB = "00000000-0000-4000-8000-000000000002";
const demo = "00000000-0000-4000-8000-000000000003";
const todayThaiMorning = "(date_trunc('day', now() at time zone 'Asia/Bangkok') + time '00:15') at time zone 'Asia/Bangkok'";
const yesterdayThaiNight = "(date_trunc('day', now() at time zone 'Asia/Bangkok') - interval '1 day' + time '23:45') at time zone 'Asia/Bangkok'";
const oldDate = "'2020-01-01 10:00:00+07'::timestamptz";

async function makeFixture(client: FixtureClient) {
  const definitions = [
    `create temporary table jaguar_members (
      id uuid primary key, member_code text, display_name text, nickname text,
      is_demo boolean, status text
    )`,
    "create temporary table jaguar_point_balances (member_id uuid)",
    "create temporary table jaguar_cannabis_balances (member_id uuid)",
    `create temporary table jaguar_sales (
      id uuid, member_id uuid, bottle_count integer, amount_baht integer,
      formula text, points_awarded integer, created_at timestamptz
    )`,
    `create temporary table jaguar_redemptions (
      id uuid, member_id uuid, reward_id uuid, points_spent integer,
      status text, rejection_reason text, created_at timestamptz
    )`,
    `create temporary table jaguar_cannabis_transactions (
      id uuid, member_id uuid, delta integer, grams_purchased integer,
      reason text, created_at timestamptz
    )`,
    `create temporary table jaguar_point_transactions (
      id uuid, member_id uuid, delta integer, reason text, created_at timestamptz
    )`,
    "create temporary table jaguar_rewards (id uuid, name text)",
    `create temporary table jaguar_transaction_corrections (
      id uuid, member_id uuid, reason text, created_at timestamptz
    )`,
  ];
  for (const sql of definitions) await client.query(sql);

  await client.query(`
    insert into jaguar_members values
      ('${regularA}','REG-A','Member A',null,false,'active'),
      ('${regularB}','REG-B','Member B',null,false,'active'),
      ('${demo}','DEMO-A','Demo Member',null,true,'active');
    insert into jaguar_point_balances values ('${regularA}'),('${regularB}'),('${demo}');
    insert into jaguar_cannabis_balances values ('${regularA}'),('${regularB}'),('${demo}');
    insert into jaguar_sales values
      ('10000000-0000-4000-8000-000000000001','${regularA}',1,100,'red',1,${todayThaiMorning}),
      ('10000000-0000-4000-8000-000000000002','${regularA}',2,200,'red',1,${oldDate}),
      ('10000000-0000-4000-8000-000000000003','${regularB}',1,60,'silver',0,${oldDate}),
      ('10000000-0000-4000-8000-000000000004','${demo}',3,900,'gold',9,${todayThaiMorning});
    insert into jaguar_point_transactions values
      ('20000000-0000-4000-8000-000000000001','${regularA}',1,'sale award',${todayThaiMorning}),
      ('20000000-0000-4000-8000-000000000002','${regularA}',2,'staff_credit',${todayThaiMorning}),
      ('20000000-0000-4000-8000-000000000003','${regularA}',1,'sale correction',${todayThaiMorning}),
      ('20000000-0000-4000-8000-000000000004','${regularA}',7,'old award',${yesterdayThaiNight}),
      ('20000000-0000-4000-8000-000000000005','${demo}',20,'staff_credit',${todayThaiMorning});
    insert into jaguar_cannabis_transactions values
      ('30000000-0000-4000-8000-000000000001','${regularA}',2,200,'ซื้อ 200 g',${todayThaiMorning}),
      ('30000000-0000-4000-8000-000000000002','${regularA}',-10,0,'counter redemption',${todayThaiMorning}),
      ('30000000-0000-4000-8000-000000000003','${regularA}',5,500,'legacy cannabis purchase',${yesterdayThaiNight}),
      ('30000000-0000-4000-8000-000000000004','${regularA}',-10,0,'old redemption',${yesterdayThaiNight}),
      ('30000000-0000-4000-8000-000000000005','${demo}',3,300,'demo purchase',${todayThaiMorning});
    insert into jaguar_rewards values ('40000000-0000-4000-8000-000000000001','Free item');
    insert into jaguar_redemptions values
      ('50000000-0000-4000-8000-000000000001','${regularA}','40000000-0000-4000-8000-000000000001',10,'confirmed',null,${todayThaiMorning}),
      ('50000000-0000-4000-8000-000000000002','${regularA}','40000000-0000-4000-8000-000000000001',20,'confirmed',null,${todayThaiMorning}),
      ('50000000-0000-4000-8000-000000000003','${regularA}','40000000-0000-4000-8000-000000000001',10,'pending',null,${todayThaiMorning}),
      ('50000000-0000-4000-8000-000000000004','${regularB}','40000000-0000-4000-8000-000000000001',10,'confirmed',null,${oldDate}),
      ('50000000-0000-4000-8000-000000000005','${demo}','40000000-0000-4000-8000-000000000001',10,'confirmed',null,${todayThaiMorning}),
      ('50000000-0000-4000-8000-000000000006','${regularB}','40000000-0000-4000-8000-000000000001',10,'rejected','Wrong reward selection',${todayThaiMorning});
    insert into jaguar_transaction_corrections values
      ('60000000-0000-4000-8000-000000000001','${regularA}','corrected sale',${todayThaiMorning}),
      ('60000000-0000-4000-8000-000000000002','${demo}','demo correction',${todayThaiMorning});
  `);
}

test("owner totals and audit use actual ledgers, Bangkok dates, and exclude demos", async () => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local search_path = pg_temp, public");
    await makeFixture(client);

    const totals = (await client.query(ownerReportTotalsSql)).rows[0] as Record<string, number>;
    assert.equal(Number(totals.today_points_issued), 6);
    assert.equal(Number(totals.today_redemptions), 2);
    assert.equal(Number(totals.redemptions), 5);
    assert.equal(Number(totals.kratom_members), 2);
    assert.equal(Number(totals.cannabis_members), 1);
    assert.equal(Number(totals.today_sales), 100);
    assert.equal(Number(totals.total_sales), 360);

    const formulaRows = (await client.query(ownerReportByFormulaSql)).rows as Array<Record<string, number | string>>;
    const red = formulaRows.find((row) => row.formula === "red")!;
    assert.equal(Number(red.points_awarded), 2, "legacy recorded awards must not be recalculated under today's policy");
    assert.equal(Number(red.today_points_awarded), 1);

    const audit = (await client.query(ownerAuditLogSql)).rows as Array<Record<string, string>>;
    const regularEvents = audit.filter((event) => event.member_code !== "DEMO-A");
    const types = new Set(regularEvents.map((event) => event.event_type));
    for (const expected of ["sale", "cannabis", "redemption", "points", "correction"]) {
      assert.ok(types.has(expected), `audit should contain ${expected}`);
    }
    assert.ok(
      regularEvents.some((event) => event.event_type === "redemption" && event.description.includes("แลกรางวัล")),
      "cannabis free redemption should be classified as a redemption",
    );
    assert.ok(
      regularEvents.some((event) => event.status === "rejected" && Number(event.points_delta) === 0 && event.description.includes("Wrong reward selection")),
      "rejected requests should remain visible without appearing as a points deduction",
    );
    assert.ok(audit.every((event) => event.member_code !== "DEMO-A"), "demo member events must be excluded");

    const memberHistory = (await client.query(ownerMemberHistorySql, ["Member A", null, null])).rows as Array<Record<string, string>>;
    assert.ok(memberHistory.length > 0, "member name search should find historical records");
    assert.ok(memberHistory.every((event) => event.member_code === "REG-A"), "member history must not include other members");
    for (const expected of ["sale", "cannabis", "redemption", "points"]) {
      assert.ok(memberHistory.some((event) => event.event_type === expected), `member history should contain ${expected}`);
    }
    const dateLimitedHistory = (await client.query(ownerMemberHistorySql, ["REG-A", "2020-01-01", "2020-01-01"])).rows as Array<Record<string, string>>;
    assert.ok(dateLimitedHistory.length > 0, "date filters should include the selected Bangkok calendar date");
    assert.ok(dateLimitedHistory.every((event) => event.created_at.startsWith("2020-01-01")), "date filters should exclude records outside the selected date");
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
});
