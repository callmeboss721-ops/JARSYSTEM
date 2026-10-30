import { createHash, timingSafeEqual } from "node:crypto";
import { pool, type PoolClient } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";
import { logger } from "./logger";
import { privateKey } from "./loyalty-security";

type MemberCard = { id: string; member_code: string; display_name: string; is_demo: boolean; status: string; balance: number; lifetime_earned: number; lifetime_redeemed: number };
type DbClient = PoolClient;
type Args = { p_code?: string; p_phone?: string | null; p_name?: string; p_member?: string | null; p_reward?: string; p_points?: number; p_request?: string; p_redemption?: string; p_pending_only?: boolean; p_amount?: number; p_bottle_count?: number; p_formula?: string; p_qr_token?: string };
const fail = (status: number, message: string): never => { throw new LoyaltyError(status, message); };
const demoEnabled = () => process.env.NODE_ENV === "development";
const redemptionSelect = `select d.id,d.member_id,m.member_code,d.reward_id,r.name as reward_name,
  d.points_spent,d.status,d.created_at from jaguar_redemptions d
  join jaguar_members m on m.id=d.member_id join jaguar_rewards r on r.id=d.reward_id`;

async function card(client: DbClient, id: string, lock = false): Promise<MemberCard> {
  if (lock) await client.query("select id from jaguar_members where id=$1 for update", [id]);
  const { rows } = await client.query<MemberCard>(`select m.id,m.member_code,m.display_name,m.is_demo,m.status,
    b.balance,b.lifetime_earned,b.lifetime_redeemed from jaguar_members m
    join jaguar_point_balances b on b.member_id=m.id where m.id=$1`, [id]);
  if (!rows[0]) fail(404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง");
  if (rows[0].is_demo && !demoEnabled()) fail(404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง");
  if (rows[0].status !== "active") fail(403, "บัญชีสมาชิกไม่พร้อมใช้งาน กรุณาติดต่อพนักงาน");
  return rows[0];
}

/** Server-only store. Fixed SQL statements, bound values, and one transaction per action. */
export async function loyaltyStore<T>(operation: string, args: Args = {}): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local statement_timeout = '8s'");
    await client.query("set local lock_timeout = '5s'");
    let result: unknown;
    switch (operation) {
      case "jaguar_health":
        await client.query("select id from jaguar_members limit 0");
        result = { status: "ok", storage: "postgresql" };
        break;
      case "jaguar_register": {
        const name = args.p_name?.trim() ?? "สมาชิก";
        if (name.length < 1 || name.length > 100) fail(400, "ชื่อสมาชิกยาวเกินกำหนด");
        const { rows } = await client.query(`insert into jaguar_members(member_code,display_name,phone_e164)
          values($1,$2,$3) returning id`, [args.p_code, name, args.p_phone ?? null]);
        await client.query("insert into jaguar_point_balances(member_id) values($1)", [rows[0].id]);
        result = await card(client, rows[0].id);
        break;
      }
      case "jaguar_member_login": {
        const { rows } = await client.query("select id from jaguar_members where member_code=$1", [args.p_code]);
        if (!rows[0]) fail(404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง");
        result = await card(client, rows[0].id);
        break;
      }
      case "jaguar_card":
        result = await card(client, args.p_member!);
        break;
      case "jaguar_rewards":
        result = (await client.query("select * from jaguar_rewards where is_active=true and (not is_demo or $1) order by points_cost,name", [demoEnabled()])).rows;
        break;
      case "jaguar_member_sales":
        await card(client, args.p_member!);
        result = (await client.query(`select id,formula,bottle_count,amount_baht,points_awarded,created_at
          from jaguar_sales where member_id=$1 order by created_at desc,id desc limit 5`, [args.p_member])).rows;
        break;
      case "jaguar_resolve_qr": {
        if (!args.p_qr_token || !/^[0-9a-f]{64}$/.test(args.p_qr_token)) fail(404, "QR ไม่ถูกต้องหรือหมดอายุ");
        const tokenHash = createHash("sha256").update(args.p_qr_token!).digest("hex");
        const found = (await client.query("select id from jaguar_members where qr_token_hash=$1 and status='active'", [tokenHash])).rows[0];
        if (!found) fail(404, "QR ไม่ถูกต้องหรือหมดอายุ");
        const expected = privateKey(`jaguar-member-qr:${found.id}`);
        if (!timingSafeEqual(Buffer.from(expected), Buffer.from(args.p_qr_token!))) fail(404, "QR ไม่ถูกต้องหรือหมดอายุ");
        result = await card(client, found.id);
        break;
      }
      case "jaguar_activity":
        await card(client, args.p_member!);
        result = (await client.query(`select id,delta,reason,created_at from jaguar_point_transactions
          where member_id=$1 order by created_at desc,id limit 50`, [args.p_member])).rows;
        break;
      case "jaguar_redemptions":
        if (args.p_member) await card(client, args.p_member);
        result = (await client.query(`${redemptionSelect} where ($1::uuid is null or d.member_id=$1)
          and (not $2::boolean or d.status='pending') and (not m.is_demo or $3)
          order by d.created_at desc,d.id limit 100`,
        [args.p_member ?? null, args.p_pending_only ?? false, demoEnabled()])).rows;
        break;
      case "jaguar_add_points": {
        if (!Number.isInteger(args.p_points) || args.p_points! < 1 || args.p_points! > 20 || !args.p_request) {
          fail(400, "จำนวนแต้มต้องอยู่ระหว่าง 1–20");
        }
        await card(client, args.p_member!, true);
        const inserted = await client.query(`insert into jaguar_point_requests(request_id,member_id,points)
          values($1,$2,$3) on conflict(request_id) do nothing returning request_id`,
        [args.p_request, args.p_member, args.p_points]);
        if (!inserted.rowCount) {
          const prior = (await client.query("select member_id,points from jaguar_point_requests where request_id=$1", [args.p_request])).rows[0];
          if (prior.member_id !== args.p_member || prior.points !== args.p_points) fail(409, "รหัสคำขอซ้ำ กรุณาโหลดใหม่ก่อนเพิ่มแต้ม");
        } else {
          await client.query(`update jaguar_point_balances set balance=balance+$2,lifetime_earned=lifetime_earned+$2 where member_id=$1`,
          [args.p_member, args.p_points]);
          await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,'staff_credit')", [args.p_member, args.p_points]);
        }
        result = await card(client, args.p_member!);
        break;
      }
      case "jaguar_staff_stamp": {
        const bottleCount = args.p_bottle_count ?? 0;
        if (!Number.isInteger(bottleCount) || bottleCount < 1 || bottleCount > 999 ||
            !["red", "silver", "gold"].includes(args.p_formula ?? "") || !args.p_request) {
          fail(400, "กรุณาระบุจำนวนขวด สูตรสินค้า และรหัสรายการให้ถูกต้อง");
        }
        const amountBaht = Math.floor(bottleCount / 3) * 150 + (bottleCount % 3) * 60;
        const pointsAwarded = Math.floor(bottleCount / 3);
        await card(client, args.p_member!, true);
        const { rows: existing } = await client.query(`select s.member_id,s.bottle_count,s.formula
          from jaguar_sales s where s.request_id=$1`, [args.p_request]);
        if (existing.length) {
          if (existing[0].member_id !== args.p_member || existing[0].bottle_count !== bottleCount || existing[0].formula !== args.p_formula) {
            fail(409, "รหัสคำขอซ้ำ กรุณาโหลดหน้าค้นหาสมาชิกใหม่");
          }
          result = await card(client, args.p_member!);
          break;
        }
        if (pointsAwarded) {
          await client.query("update jaguar_point_balances set balance=balance+$2,lifetime_earned=lifetime_earned+$2 where member_id=$1", [args.p_member, pointsAwarded]);
          await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,$3)",
            [args.p_member, pointsAwarded, `ซื้อสินค้า ${bottleCount} ขวด · สูตร ${args.p_formula}`]);
        }
        await client.query(`insert into jaguar_sales(member_id,request_id,bottle_count,amount_baht,formula,points_awarded)
          values($1,$2,$3,$4,$5,$6)`, [args.p_member, args.p_request, bottleCount, amountBaht, args.p_formula, pointsAwarded]);
        result = await card(client, args.p_member!);
        break;
      }
      case "jaguar_staff_redeem": {
        const member = await card(client, args.p_member!, true);
        if (!args.p_request || !/^[0-9a-f-]{36}$/i.test(args.p_request)) fail(400, "รหัสคำขอแลกรางวัลไม่ถูกต้อง");
        const prior = (await client.query("select id,member_id from jaguar_redemptions where request_id=$1", [args.p_request])).rows[0];
        if (prior) {
          if (prior.member_id !== args.p_member) fail(409, "รหัสคำขอซ้ำกับสมาชิกอื่น");
          result = { redemption_id: prior.id, ...member };
          break;
        }
        const reward = (await client.query(`select id,points_cost from jaguar_rewards where is_active=true and points_cost=10
          and (not is_demo or $1) order by is_demo asc,id limit 1 for share`, [demoEnabled()])).rows[0];
        if (!reward) fail(503, "เจ้าของร้านต้องตั้งรางวัลแลก 10 แต้มในห้องแอดมินก่อน");
        if (member.balance < 10) fail(409, "แต้มสมาชิกยังไม่ครบ 10");
        const { rows } = await client.query(`insert into jaguar_redemptions(member_id,reward_id,points_spent,status,request_id)
          values($1,$2,10,'confirmed',$3) returning id`, [args.p_member, reward.id, args.p_request]);
        await client.query("update jaguar_point_balances set balance=balance-10,lifetime_redeemed=lifetime_redeemed+10 where member_id=$1", [args.p_member]);
        await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,-10,'แลกรางวัล 2 ขวด')", [args.p_member]);
        result = { redemption_id: rows[0].id, ...await card(client, args.p_member!) };
        break;
      }
      case "jaguar_request_redemption": {
        const member = await card(client, args.p_member!, true);
        const reward = (await client.query("select points_cost from jaguar_rewards where id=$1 and is_active=true and (not is_demo or $2) for share", [args.p_reward, demoEnabled()])).rows[0];
        if (!reward) fail(409, "รางวัลนี้ไม่พร้อมให้แลกแล้ว");
        if ((await client.query("select id from jaguar_redemptions where member_id=$1 and status='pending'", [args.p_member])).rowCount) {
          fail(409, "คุณมีรายการรอรับรางวัลอยู่แล้ว กรุณาติดต่อพนักงาน");
        }
        if (member.balance < reward.points_cost) fail(409, "แต้มที่ใช้ได้ไม่เพียงพอ");
        const created = (await client.query(`insert into jaguar_redemptions(member_id,reward_id,points_spent)
          values($1,$2,$3) returning id`, [args.p_member, args.p_reward, reward.points_cost])).rows[0];
        result = (await client.query(`${redemptionSelect} where d.id=$1`, [created.id])).rows[0];
        break;
      }
      case "jaguar_confirm_redemption": {
        const target = (await client.query("select member_id from jaguar_redemptions where id=$1", [args.p_redemption])).rows[0];
        if (!target) fail(404, "ไม่พบรายการแลกรางวัล");
        const member = await card(client, target.member_id, true);
        const redemption = (await client.query("select * from jaguar_redemptions where id=$1 for update", [args.p_redemption])).rows[0];
        if (redemption.status !== "confirmed") {
          if (redemption.status !== "pending") fail(409, "รายการนี้ถูกดำเนินการแล้ว");
          if (member.balance < redemption.points_spent) fail(409, "แต้มที่ใช้ได้ไม่เพียงพอ");
          await client.query(`update jaguar_point_balances set balance=balance-$2,lifetime_redeemed=lifetime_redeemed+$2 where member_id=$1`,
          [target.member_id, redemption.points_spent]);
          await client.query("update jaguar_redemptions set status='confirmed' where id=$1", [args.p_redemption]);
          await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,'reward_redemption')",
          [target.member_id, -redemption.points_spent]);
        }
        result = (await client.query(`${redemptionSelect} where d.id=$1`, [args.p_redemption])).rows[0];
        break;
      }
      case "jaguar_summary": {
        const { rows } = await client.query(`select
          (select count(*)::integer from jaguar_members) as members,
          (select count(*)::integer from jaguar_redemptions where status='pending') as pending_redemptions,
          (select coalesce(sum(lifetime_earned),0)::integer from jaguar_point_balances) as points_issued`);
        result = rows[0];
        break;
      }
      default: throw new Error("Unsupported loyalty operation");
    }
    await client.query("commit");
    return result as T;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") fail(409, "รหัสสมาชิกหรือเบอร์โทรศัพท์นี้ถูกใช้แล้ว กรุณาตรวจสอบอีกครั้ง");
    logger.error({ operation, databaseCode: /^[A-Z0-9]{5}$/.test(code) ? code : undefined }, "Loyalty database operation failed");
    throw new LoyaltyError(503, "ฐานข้อมูลไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่");
  } finally {
    client.release();
  }
}

export async function listStaffMembers(query = "") {
  const normalized = query.trim().replace(/[%_\\]/g, "");
  return (await pool.query(`select m.id,m.member_code,m.display_name,m.status,m.is_demo,m.created_at,
    b.balance,b.lifetime_earned,b.lifetime_redeemed from jaguar_members m
    join jaguar_point_balances b on b.member_id=m.id
    where m.status <> 'deleted' and (not m.is_demo or $2) and ($1='' or m.member_code ilike '%' || $1 || '%' or m.display_name ilike '%' || $1 || '%')
    order by m.created_at desc limit 200`, [normalized, demoEnabled()])).rows;
}
export async function createMember(name: string, code: string, phone: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(`insert into jaguar_members(display_name,member_code,phone_e164)
      values($1,$2,$3) returning id,member_code,display_name,status`, [name, code, phone]);
    await client.query("insert into jaguar_point_balances(member_id) values($1)", [rows[0].id]);
    const member = await card(client, rows[0].id);
    await client.query("commit");
    return member;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") fail(409, "รหัสสมาชิกหรือเบอร์โทรศัพท์นี้ถูกใช้แล้ว");
    logger.error({ operation: "owner_member_create", databaseCode: code }, "Member create failed");
    throw new LoyaltyError(503, "บันทึกสมาชิกไม่ได้ กรุณาลองใหม่");
  } finally { client.release(); }
}
export async function softDeleteMember(id: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local lock_timeout = '5s'");
    const member = (await client.query("select status from jaguar_members where id=$1 for update", [id])).rows[0];
    if (!member || member.status === "deleted") fail(404, "ไม่พบสมาชิกที่ต้องการลบ");
    if ((await client.query("select id from jaguar_redemptions where member_id=$1 and status='pending' limit 1", [id])).rowCount) {
      fail(409, "สมาชิกมีรายการรอรับรางวัล กรุณาจัดการให้เสร็จก่อนปิดบัญชี");
    }
    await client.query("update jaguar_members set status='deleted' where id=$1", [id]);
    await client.query("commit");
    return { ok: true };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logger.error({ operation: "owner_member_close" }, "Member closure failed");
    throw new LoyaltyError(503, "ปิดบัญชีสมาชิกไม่ได้ กรุณาลองใหม่");
  } finally { client.release(); }
}
export async function ownerReport() {
  const { rows } = await pool.query(`with local_day as (
    select (now() at time zone 'Asia/Bangkok')::date as day
  ), totals as (
    select coalesce(sum(s.amount_baht),0)::bigint as today_sales,
      count(s.id)::integer as today_visits from jaguar_sales s,local_day d
    where (s.created_at at time zone 'Asia/Bangkok')::date=d.day and not exists(
      select 1 from jaguar_members m where m.id=s.member_id and m.is_demo)
  ), all_sales as (
    select coalesce(sum(s.amount_baht),0)::bigint as total_sales,
      count(s.id)::integer as total_visits from jaguar_sales s
      join jaguar_members m on m.id=s.member_id where not m.is_demo
  ), redeemed as (
    select count(d.id)::integer as redemptions from jaguar_redemptions d
      join jaguar_members m on m.id=d.member_id where d.status='confirmed' and not m.is_demo
  )
    select totals.today_sales,totals.today_visits,all_sales.total_sales,all_sales.total_visits,
      redeemed.redemptions,(select count(*)::integer from jaguar_members where status='active' and not is_demo) as members
    from totals,all_sales,redeemed`);
  const byFormula = (await pool.query(`select s.formula,count(*)::integer as sales_count,
    coalesce(sum(s.bottle_count),0)::integer as bottles_sold,
    coalesce(sum(s.points_awarded),0)::integer as points_awarded,
    coalesce(sum(s.amount_baht),0)::bigint as amount_baht from jaguar_sales s
    join jaguar_members m on m.id=s.member_id where not m.is_demo group by s.formula
    order by case s.formula when 'red' then 1 when 'silver' then 2 else 3 end`)).rows;
  return {
    ...rows[0],
    today_sales: Number(rows[0].today_sales),
    total_sales: Number(rows[0].total_sales),
    by_formula: byFormula.map((row) => ({ ...row, amount_baht: Number(row.amount_baht) })),
  };
}

export async function seedDevDemoData() {
  if (process.env.NODE_ENV !== "development") return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(`insert into jaguar_members(member_code,display_name,phone_e164,is_demo)
      values('JAG-001','บัญชีตัวอย่าง — ข้อมูลทดลอง',null,true)
      on conflict(member_code) do nothing returning id`);
    const demo = rows[0] ?? (await client.query("select id from jaguar_members where member_code='JAG-001' and is_demo=true")).rows[0];
    if (demo) await client.query("insert into jaguar_point_balances(member_id) values($1) on conflict do nothing", [demo.id]);
    await client.query(`insert into jaguar_rewards(name,description,points_cost,is_demo)
      select 'รับฟรี 2 ขวด','รางวัลตัวอย่างสำหรับทดลองระบบในสภาพแวดล้อมพัฒนา',10,true
      where not exists(select 1 from jaguar_rewards where is_demo=true and points_cost=10)`);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    const dbError = error as { code?: string; constraint?: string };
    logger.error({ operation: "dev_demo_seed", dbCode: dbError.code, constraint: dbError.constraint }, "Development demo data setup failed");
    throw error;
  } finally { client.release(); }
}

export async function getMemberQr(id: string) {
  // Separate, opaque staff-scan credential: not a customer login code.
  // HMAC makes it stable across reloads without storing a plaintext token.
  const token = privateKey(`jaguar-member-qr:${id}`);
  const hash = createHash("sha256").update(token).digest("hex");
  const result = await pool.query("update jaguar_members set qr_token_hash=$2 where id=$1 and status='active' and (not is_demo or $3) returning id", [id, hash, demoEnabled()]);
  if (!result.rowCount) fail(404, "ไม่พบสมาชิก");
  return token;
}

export async function listStaffRewards() {
  return (await pool.query("select * from jaguar_rewards where not is_demo or $1 order by is_active desc,points_cost,name", [demoEnabled()])).rows;
}
export async function createReward(name: string, description: string, pointsCost: number) {
  return (await pool.query(`insert into jaguar_rewards(name,description,points_cost) values($1,$2,$3) returning *`,
    [name, description, pointsCost])).rows[0];
}
export async function setRewardActive(id: string, active: boolean) {
  const reward = (await pool.query("update jaguar_rewards set is_active=$2 where id=$1 returning *", [id, active])).rows[0];
  if (!reward) fail(404, "ไม่พบรางวัล");
  return reward;
}
