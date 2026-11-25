import { createHash, timingSafeEqual } from "node:crypto";
import { pool, type PoolClient } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";
import { logger } from "./logger";
import { privateKey } from "./loyalty-security";
import { calculateCarryPoints } from "./points-policy";
import {
  ownerAuditLogSql,
  ownerMemberHistorySql,
  ownerReportByFormulaSql,
  ownerReportTotalsSql,
} from "./owner-report-queries";

type MemberCard = {
  id: string; member_code: string; display_name: string; nickname: string | null; phone_masked: string | null;
  is_demo: boolean; status: string; balance: number; lifetime_earned: number; lifetime_redeemed: number;
  kratom_remainder_baht: number; cannabis_balance: number; cannabis_remainder_grams: number;
};
type DbClient = PoolClient;
type Args = {
  p_code?: string; p_phone?: string | null; p_name?: string; p_nickname?: string;
  p_method?: "phone" | "member_code" | "nickname"; p_identifier?: string;
  p_member?: string | null; p_reward?: string; p_points?: number; p_request?: string;
  p_redemption?: string; p_pending_only?: boolean; p_reason?: string; p_amount?: number; p_bottle_count?: number;
  p_grams?: number; p_formula?: string; p_qr_token?: string; p_enabled?: boolean; p_staff?: boolean;
  p_slip_path?: string | null;
};
type CannabisCard = {
  member_code: string;
  display_name: string;
  nickname: string | null;
  phone_masked: string | null;
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  grams_remainder: number;
  recent_transactions: Array<{
    id: string; delta: number; grams_purchased: number; reason: string; created_at: string;
    editable?: boolean; corrected?: boolean;
  }>;
};
const fail = (status: number, message: string): never => { throw new LoyaltyError(status, message); };
const demoAccessEnabled = false;
const redemptionSelect = `select d.id,d.member_id,m.member_code,d.reward_id,r.name as reward_name,
  m.nickname as member_nickname,nullif(right(regexp_replace(coalesce(m.phone_e164,''),'[^0-9]','','g'),4),'') as phone_last4,
  d.points_spent,d.status,d.rejection_reason,d.created_at from jaguar_redemptions d
  join jaguar_members m on m.id=d.member_id join jaguar_rewards r on r.id=d.reward_id`;

export function normalizeNickname(value: string): string {
  const nickname = value.normalize("NFC").trim();
  const characterCount = Array.from(nickname).length;
  if (characterCount < 2 || characterCount > 20 ||
      /^\d+$/.test(nickname) ||
      /^\+?(?:66|0)?[\d\s()-]{8,18}$/.test(nickname)) {
    fail(400, "ชื่อเล่นต้องมี 2–20 ตัวอักษร และไม่เป็นเบอร์โทรหรือตัวเลขล้วน");
  }
  return nickname;
}

function maskPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("66") ? `0${digits.slice(2)}` : digits;
  if (local.length < 8) return null;
  return `${local.slice(0, 2)}x-${"x".repeat(Math.max(1, local.length - 7))}-${local.slice(-4)}`;
}

async function lockAndCheckNickname(client: DbClient, nickname: string, code: string, excludeId?: string): Promise<void> {
  const keys = [...new Set([nickname.trim().toLocaleLowerCase("en-US"), code.trim().toLocaleLowerCase("en-US")])].sort();
  if (keys.length === 1 && nickname.trim().toLocaleLowerCase("en-US") === code.trim().toLocaleLowerCase("en-US")) {
    fail(409, "ชื่อเล่นต้องไม่ซ้ำกับรหัสสมาชิก");
  }
  for (const key of keys) {
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [`jaguar-member-identity:${key}`]);
  }
  const collision = (await client.query(`select id from jaguar_members
    where ($3::uuid is null or id<>$3)
      and (lower(btrim(member_code)) in ($1,$2) or lower(btrim(coalesce(nickname,''))) in ($1,$2))
    limit 1`, [keys[0], keys[1] ?? keys[0], excludeId ?? null])).rowCount;
  if (collision) fail(409, "รหัสสมาชิก เบอร์โทร หรือชื่อเล่นถูกใช้แล้ว กรุณาตรวจสอบอีกครั้ง");
}

async function card(client: DbClient, id: string, lock = false): Promise<MemberCard> {
  if (lock) await client.query("select id from jaguar_members where id=$1 for update", [id]);
  const { rows } = await client.query<MemberCard>(`select m.id,m.member_code,m.display_name,m.is_demo,m.status,
    m.nickname,m.phone_e164,b.balance,b.lifetime_earned,b.lifetime_redeemed,
    b.kratom_amount_remainder as kratom_remainder_baht,
    coalesce(b.cannabis_balance,0)::integer as cannabis_balance,
    b.cannabis_grams_remainder as cannabis_remainder_grams from jaguar_members m
    join jaguar_point_balances b on b.member_id=m.id where m.id=$1`, [id]);
  if (!rows[0]) fail(404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง");
  if (rows[0].is_demo && !demoAccessEnabled) fail(404, "ไม่พบรหัสสมาชิก กรุณาตรวจสอบอีกครั้ง");
  if (rows[0].status !== "active") fail(403, "บัญชีสมาชิกไม่พร้อมใช้งาน กรุณาติดต่อพนักงาน");
  const row = rows[0] as MemberCard & { phone_e164?: string | null };
  const { phone_e164: _phone, ...publicCard } = row;
  return { ...publicCard, phone_masked: maskPhone(_phone) };
}

async function cannabisCard(client: DbClient, id: string, lock = false, staffView = false): Promise<CannabisCard> {
  const member = await card(client, id, lock);
  await client.query("insert into jaguar_cannabis_balances(member_id) values($1) on conflict do nothing", [id]);
  const balance = (await client.query(`select coalesce(p.cannabis_balance,c.balance,0)::integer as balance,
      c.lifetime_earned,c.lifetime_redeemed,p.cannabis_grams_remainder as grams_remainder
    from jaguar_point_balances p join jaguar_cannabis_balances c on c.member_id=p.member_id
    where p.member_id=$1${lock ? " for update of p,c" : ""}`, [id])).rows[0];
  if (!balance) fail(503, "บัตรกัญชายังไม่พร้อมใช้งาน");
  const recent = (await client.query(`select t.id,t.delta,t.grams_purchased,t.reason,t.created_at::text as created_at,
      ($2::boolean and t.grams_purchased>0 and
        (t.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date) as editable,
      ($2::boolean and exists(select 1 from jaguar_transaction_corrections x
        where x.entity_type='cannabis_sale' and x.entity_id=t.id)) as corrected
    from jaguar_cannabis_transactions t where t.member_id=$1
    order by t.created_at desc,t.id desc limit 5`, [id, staffView])).rows;
  return {
    member_code: member.member_code,
    display_name: member.display_name,
    nickname: member.nickname,
    phone_masked: member.phone_masked,
    balance: balance.balance,
    lifetime_earned: balance.lifetime_earned,
    lifetime_redeemed: balance.lifetime_redeemed,
    grams_remainder: balance.grams_remainder,
    recent_transactions: recent,
  };
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
        await client.query("select id from jaguar_bank_accounts limit 0");
        await client.query("select id from jaguar_bank_transfers limit 0");
        result = { status: "ok", storage: "postgresql" };
        break;
      case "jaguar_register": {
        const name = args.p_name?.trim() ?? "สมาชิก";
        if (name.length < 1 || name.length > 100) fail(400, "ชื่อสมาชิกยาวเกินกำหนด");
        const nickname = normalizeNickname(args.p_nickname ?? "");
        await lockAndCheckNickname(client, nickname, args.p_code!);
        const { rows } = await client.query(`insert into jaguar_members(member_code,display_name,phone_e164,nickname)
          values($1,$2,$3,$4) returning id`, [args.p_code, name, args.p_phone ?? null, nickname]);
        await client.query("insert into jaguar_point_balances(member_id) values($1)", [rows[0].id]);
        result = await card(client, rows[0].id);
        break;
      }
      case "jaguar_member_login_by": {
        const method = args.p_method!;
        const identifier = args.p_identifier!;
        const columnCheck = method === "phone"
          ? "phone_e164=$1"
          : method === "nickname"
            ? "lower(btrim(nickname))=lower(btrim($1))"
            : "upper(member_code)=upper($1)";
        const found = (await client.query(`select id from jaguar_members
          where ${columnCheck} and status='active' and not is_demo limit 1`, [identifier])).rows[0];
        if (!found) fail(401, "ไม่พบสมาชิก กรุณาตรวจสอบข้อมูล");
        result = await card(client, found.id);
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
      case "jaguar_update_nickname": {
        const nickname = normalizeNickname(args.p_nickname ?? "");
        const member = await card(client, args.p_member!, true);
        await lockAndCheckNickname(client, nickname, member.member_code, member.id);
        await client.query("update jaguar_members set nickname=$2 where id=$1", [args.p_member, nickname]);
        result = await card(client, args.p_member!);
        break;
      }
      case "jaguar_cannabis_feature_get":
        result = { cannabis_points_enabled: await cannabisPointsEnabled(client) };
        break;
      case "jaguar_cannabis_feature_set":
        await client.query(`insert into jaguar_settings(key,value) values('cannabis_points_enabled',$1)
          on conflict(key) do update set value=excluded.value`, [args.p_enabled ? "true" : "false"]);
        result = { cannabis_points_enabled: args.p_enabled === true };
        break;
      case "jaguar_cannabis_card":
        result = await cannabisCard(client, args.p_member!, false, args.p_staff === true);
        break;
      case "jaguar_rewards":
        result = (await client.query("select * from jaguar_rewards where is_active=true and (not is_demo or $1) order by points_cost,name", [demoAccessEnabled])).rows;
        break;
      case "jaguar_member_sales":
        await card(client, args.p_member!);
        result = (await client.query(`with running as (
          select s.*,sum(s.amount_baht) over(
            partition by s.member_id order by s.created_at,s.id rows between unbounded preceding and current row
          ) as cumulative_baht
          from jaguar_sales s where s.member_id=$1
        ), policy_points as (
          select id,formula,bottle_count,amount_baht,
            (floor(cumulative_baht::numeric/100)-floor((cumulative_baht-amount_baht)::numeric/100))::integer as points_awarded,
            created_at
          from running
        )
        select id,formula,bottle_count,amount_baht,points_awarded,created_at
        from policy_points order by created_at desc,id desc limit 5`, [args.p_member])).rows;
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
        [args.p_member ?? null, args.p_pending_only ?? false, demoAccessEnabled])).rows;
        break;
      case "jaguar_find_redemption_request": {
        await card(client, args.p_member!);
        if (!args.p_request) {
          result = null;
          break;
        }
        const prior = (await client.query(
          "select id,member_id,reward_id from jaguar_redemptions where request_id=$1",
          [args.p_request],
        )).rows[0];
        if (!prior) {
          result = null;
          break;
        }
        if (prior.member_id !== args.p_member || prior.reward_id !== args.p_reward) {
          fail(409, "รหัสคำขอซ้ำกับรายการอื่น กรุณาเริ่มคำขอใหม่");
        }
        result = (await client.query(`${redemptionSelect} where d.id=$1`, [prior.id])).rows[0];
        break;
      }
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
            !["red", "silver", "gold"].includes(args.p_formula ?? "") || !args.p_request ||
            !/^[0-9a-f-]{36}$/i.test(args.p_request) ||
            (args.p_slip_path != null && !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(args.p_slip_path))) {
          fail(400, "กรุณาระบุจำนวนขวด สูตรสินค้า และรหัสรายการให้ถูกต้อง");
        }
        const amountBaht = bottleCount * 50;
        const member = await card(client, args.p_member!, true);
        const { points: pointsAwarded, remainder } = calculateCarryPoints(member.kratom_remainder_baht, amountBaht);
        const { rows: existing } = await client.query(`select s.id,s.member_id,s.bottle_count,s.formula,s.slip_path
          from jaguar_sales s where s.request_id=$1`, [args.p_request]);
        if (existing.length) {
          if (existing[0].member_id !== args.p_member || existing[0].bottle_count !== bottleCount || existing[0].formula !== args.p_formula) {
            fail(409, "รหัสคำขอซ้ำ กรุณาโหลดหน้าค้นหาสมาชิกใหม่");
          }
          if (args.p_slip_path && existing[0].slip_path !== args.p_slip_path) {
            if (existing[0].slip_path) fail(409, "รายการนี้มีสลิปอีกไฟล์อยู่แล้ว กรุณาแก้ไขจากประวัติรายการ");
            await client.query("update jaguar_sales set slip_path=$2 where id=$1", [existing[0].id, args.p_slip_path]);
            await client.query(
              `insert into jaguar_transaction_corrections
                (entity_type,entity_id,member_id,reason,before_data,after_data,corrected_by)
               values('kratom_sale',$1,$2,'แนบสลิปภายหลังการบันทึก','{"slip_path":null}'::jsonb,$3::jsonb,'staff')`,
              [existing[0].id, args.p_member, JSON.stringify({ slip_path: args.p_slip_path })],
            );
          }
          result = await card(client, args.p_member!);
          break;
        }
        // Existing sale pricing and point calculations remain separate from the product catalog.
        await client.query(`update jaguar_point_balances
          set balance=balance+$2,lifetime_earned=lifetime_earned+$2,kratom_amount_remainder=$3 where member_id=$1`,
        [args.p_member, pointsAwarded, remainder]);
        if (pointsAwarded) {
          await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,$3)",
            [args.p_member, pointsAwarded, `ซื้อสินค้า ${amountBaht} บาท · สะสมครบ 100 บาทต่อแต้ม`]);
        }
        await client.query(`insert into jaguar_sales(member_id,request_id,bottle_count,amount_baht,formula,points_awarded,points_policy,slip_path)
          values($1,$2,$3,$4,$5,$6,'kratom-cash-v2',$7)`,
        [args.p_member, args.p_request, bottleCount, amountBaht, args.p_formula, pointsAwarded, args.p_slip_path ?? null]);
        result = await card(client, args.p_member!);
        break;
      }
      case "jaguar_staff_cannabis_stamp": {
        const grams = args.p_grams ?? 0;
        if (!Number.isInteger(grams) || grams < 1 || grams > 999 || !args.p_request ||
            !/^[0-9a-f-]{36}$/i.test(args.p_request)) {
          fail(400, "จำนวนกรัมต้องเป็นจำนวนเต็ม 1–999");
        }
        await card(client, args.p_member!, true);
        await client.query("insert into jaguar_cannabis_balances(member_id) values($1) on conflict do nothing", [args.p_member]);
        const current = (await client.query(`select p.cannabis_balance,p.cannabis_grams_remainder,c.balance as legacy_balance
          from jaguar_point_balances p join jaguar_cannabis_balances c on c.member_id=p.member_id
          where p.member_id=$1 for update of p,c`, [args.p_member])).rows[0];
        if (!current) fail(503, "บัตรกัญชายังไม่พร้อมใช้งาน");
        const prior = (await client.query(`select member_id,delta,grams_purchased from jaguar_cannabis_transactions where request_id=$1`,
          [args.p_request])).rows[0];
        if (prior) {
          if (prior.member_id !== args.p_member || prior.grams_purchased !== grams) {
            fail(409, "รหัสคำขอซ้ำ กรุณาค้นหาสมาชิกใหม่ก่อนตอกแต้ม");
          }
        } else {
          if (!await cannabisPointsEnabled(client)) fail(403, "ระบบสะสมแต้มกัญชายังปิดอยู่");
          const { points: pointsAwarded, remainder } = calculateCarryPoints(current.cannabis_grams_remainder, grams);
          const balanceBefore = current.cannabis_balance ?? current.legacy_balance ?? 0;
          await client.query(`update jaguar_point_balances
            set cannabis_balance=$2,cannabis_grams_remainder=$3 where member_id=$1`,
          [args.p_member, balanceBefore + pointsAwarded, remainder]);
          await client.query(`update jaguar_cannabis_balances
            set balance=balance+$2,lifetime_earned=lifetime_earned+$2 where member_id=$1`,
          [args.p_member, pointsAwarded]);
          await client.query(`insert into jaguar_cannabis_transactions(member_id,request_id,delta,grams_purchased,reason,points_policy)
            values($1,$2,$3,$4,$5,'cannabis-100g-v2')`,
          [args.p_member, args.p_request, pointsAwarded, grams, `สะสมครบทุก 100 g · ซื้อ ${grams} g`]);
        }
        result = await cannabisCard(client, args.p_member!);
        break;
      }
      case "jaguar_staff_cannabis_redeem": {
        if (!args.p_request || !/^[0-9a-f-]{36}$/i.test(args.p_request)) fail(400, "รหัสรายการแลกไม่ถูกต้อง");
        await card(client, args.p_member!, true);
        await client.query("insert into jaguar_cannabis_balances(member_id) values($1) on conflict do nothing", [args.p_member]);
        const balance = (await client.query(`select coalesce(p.cannabis_balance,c.balance,0)::integer as balance
          from jaguar_point_balances p join jaguar_cannabis_balances c on c.member_id=p.member_id
          where p.member_id=$1 for update of p,c`, [args.p_member])).rows[0];
        const prior = (await client.query(`select member_id,delta,grams_purchased from jaguar_cannabis_transactions where request_id=$1`,
          [args.p_request])).rows[0];
        if (prior) {
          if (prior.member_id !== args.p_member || prior.delta !== -10 || prior.grams_purchased !== 0) {
            fail(409, "รหัสรายการซ้ำ กรุณาค้นหาสมาชิกใหม่ก่อนแลก");
          }
        } else {
          if (!balance || balance.balance < 10) fail(409, "แต้มกัญชายังไม่ครบ 10 ติ๊ก");
          await client.query("update jaguar_point_balances set cannabis_balance=$2 where member_id=$1",
            [args.p_member, balance.balance - 10]);
          await client.query(`update jaguar_cannabis_balances set balance=balance-10,lifetime_redeemed=lifetime_redeemed+10 where member_id=$1`,
            [args.p_member]);
          await client.query(`insert into jaguar_cannabis_transactions(member_id,request_id,delta,grams_purchased,reason)
            values($1,$2,-10,0,'แลกรางวัล')`, [args.p_member, args.p_request]);
        }
        result = await cannabisCard(client, args.p_member!);
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
          and (not is_demo or $1) order by is_demo asc,id limit 1 for share`, [demoAccessEnabled])).rows[0];
        if (!reward) fail(503, "เจ้าของร้านต้องตั้งรางวัลแลก 10 แต้มในห้องแอดมินก่อน");
        if (member.balance < 10) fail(409, "แต้มสมาชิกยังไม่ครบ 10");
        const { rows } = await client.query(`insert into jaguar_redemptions(member_id,reward_id,points_spent,status,request_id)
          values($1,$2,10,'confirmed',$3) returning id`, [args.p_member, reward.id, args.p_request]);
        await client.query("update jaguar_point_balances set balance=balance-10,lifetime_redeemed=lifetime_redeemed+10 where member_id=$1", [args.p_member]);
        await client.query("insert into jaguar_point_transactions(member_id,delta,reason) values($1,-10,'แลกรางวัล')", [args.p_member]);
        result = { redemption_id: rows[0].id, ...await card(client, args.p_member!) };
        break;
      }
      case "jaguar_request_redemption": {
        const member = await card(client, args.p_member!, true);
        if (args.p_request) {
          const prior = (await client.query(
            "select id,member_id,reward_id from jaguar_redemptions where request_id=$1",
            [args.p_request],
          )).rows[0];
          if (prior) {
            if (prior.member_id !== args.p_member || prior.reward_id !== args.p_reward) {
              fail(409, "รหัสคำขอซ้ำกับรายการอื่น กรุณาเริ่มคำขอใหม่");
            }
            result = (await client.query(`${redemptionSelect} where d.id=$1`, [prior.id])).rows[0];
            break;
          }
        }
        const reward = (await client.query("select points_cost from jaguar_rewards where id=$1 and is_active=true and (not is_demo or $2) for share", [args.p_reward, demoAccessEnabled])).rows[0];
        if (!reward) fail(409, "รางวัลนี้ไม่พร้อมให้แลกแล้ว");
        if ((await client.query("select id from jaguar_redemptions where member_id=$1 and status='pending'", [args.p_member])).rowCount) {
          fail(409, "คุณมีรายการรอรับรางวัลอยู่แล้ว กรุณาติดต่อพนักงาน");
        }
        if (member.balance < reward.points_cost) fail(409, "แต้มที่ใช้ได้ไม่เพียงพอ");
        const created = (await client.query(`insert into jaguar_redemptions(member_id,reward_id,points_spent,request_id)
          values($1,$2,$3,$4) on conflict(request_id) do nothing returning id`,
        [args.p_member, args.p_reward, reward.points_cost, args.p_request ?? null])).rows[0];
        if (created) {
          result = (await client.query(`${redemptionSelect} where d.id=$1`, [created.id])).rows[0];
          break;
        }
        const prior = (await client.query(
          "select id,member_id,reward_id from jaguar_redemptions where request_id=$1",
          [args.p_request],
        )).rows[0];
        if (!prior || prior.member_id !== args.p_member || prior.reward_id !== args.p_reward) {
          fail(409, "รหัสคำขอซ้ำกับรายการอื่น กรุณาเริ่มคำขอใหม่");
        }
        result = (await client.query(`${redemptionSelect} where d.id=$1`, [prior.id])).rows[0];
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
      case "jaguar_reject_redemption": {
        const reason = args.p_reason?.normalize("NFC").trim() ?? "";
        const reasonLength = Array.from(reason).length;
        if (reasonLength < 3 || reasonLength > 200 || /[\u0000-\u001f\u007f]/.test(reason)) {
          fail(400, "ระบุเหตุผลการปฏิเสธ 3–200 ตัวอักษร");
        }
        const redemption = (await client.query(
          "select id,status from jaguar_redemptions where id=$1 for update",
          [args.p_redemption],
        )).rows[0];
        if (!redemption) fail(404, "ไม่พบรายการแลกรางวัล");
        if (redemption.status !== "pending") fail(409, "ปฏิเสธได้เฉพาะคำขอที่รอยืนยัน");
        await client.query(
          "update jaguar_redemptions set status='rejected',rejection_reason=$2 where id=$1",
          [args.p_redemption, reason],
        );
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

async function cannabisPointsEnabled(client?: DbClient): Promise<boolean> {
  const query = client ?? pool;
  const row = (await query.query("select value from jaguar_settings where key='cannabis_points_enabled'")).rows[0];
  return row?.value === "true";
}

export async function isCannabisPointsEnabled(): Promise<boolean> {
  return cannabisPointsEnabled();
}

export async function listStaffMembers(query = "") {
  const normalized = query.trim().replace(/[%_\\]/g, "");
  const rawPhoneDigits = normalized.replace(/\D/g, "");
  const phoneDigits = rawPhoneDigits.startsWith("66")
    ? `0${rawPhoneDigits.slice(2)}`
    : rawPhoneDigits;
  const phoneSearch = phoneDigits.length >= 4 ? phoneDigits : null;
  const rows = (await pool.query(`select m.id,m.member_code,m.display_name,m.nickname,m.phone_e164,m.status,m.is_demo,m.created_at,
    b.balance,b.lifetime_earned,b.lifetime_redeemed,b.kratom_amount_remainder as kratom_remainder_baht,
    coalesce(b.cannabis_balance,0)::integer as cannabis_balance,b.cannabis_grams_remainder as cannabis_remainder_grams
    from jaguar_members m
    join jaguar_point_balances b on b.member_id=m.id
    where m.status <> 'deleted' and (not m.is_demo or $3) and (
      $1='' or m.member_code ilike '%' || $1 || '%' or m.display_name ilike '%' || $1 || '%' or
      coalesce(m.nickname,'') ilike '%' || $1 || '%' or (
        $2::text is not null and regexp_replace(
          case when m.phone_e164 like '+66%' then '0' || substring(m.phone_e164 from 4)
            else coalesce(m.phone_e164,'') end, '[^0-9]', '', 'g'
        ) like '%' || $2 || '%'
      )
    )
    order by m.created_at desc limit 200`, [normalized, phoneSearch, demoAccessEnabled])).rows;
  return rows.map(({ phone_e164, ...row }) => ({ ...row, phone_masked: maskPhone(phone_e164) }));
}
export async function createMember(name: string, code: string, phone: string, inputNickname: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const nickname = normalizeNickname(inputNickname);
    await lockAndCheckNickname(client, nickname, code);
    const { rows } = await client.query(`insert into jaguar_members(display_name,member_code,phone_e164,nickname)
      values($1,$2,$3,$4) returning id,member_code,display_name,status`, [name, code, phone, nickname]);
    await client.query("insert into jaguar_point_balances(member_id) values($1)", [rows[0].id]);
    const member = await card(client, rows[0].id);
    await client.query("commit");
    return member;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (code === "23505") fail(409, "รหัสสมาชิก เบอร์โทร หรือชื่อเล่นถูกใช้แล้ว กรุณาตรวจสอบอีกครั้ง");
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
  const { rows } = await pool.query(ownerReportTotalsSql);
  const byFormula = (await pool.query(ownerReportByFormulaSql)).rows;
  return {
    ...rows[0],
    today_sales: Number(rows[0].today_sales),
    total_sales: Number(rows[0].total_sales),
    by_formula: byFormula.map((row) => ({
      ...row,
      amount_baht: Number(row.amount_baht),
      today_amount_baht: Number(row.today_amount_baht),
    })),
  };
}

export async function ownerAuditLog() {
  const { rows } = await pool.query(ownerAuditLogSql);
  return rows;
}

export async function ownerMemberHistory(query: string, from: string | null, to: string | null) {
  const { rows } = await pool.query(ownerMemberHistorySql, [query.trim(), from, to]);
  return rows;
}

export async function getMemberQr(id: string) {
  // Separate, opaque staff-scan credential: not a customer login code.
  // HMAC makes it stable across reloads without storing a plaintext token.
  const token = privateKey(`jaguar-member-qr:${id}`);
  const hash = createHash("sha256").update(token).digest("hex");
  const result = await pool.query("update jaguar_members set qr_token_hash=$2 where id=$1 and status='active' and (not is_demo or $3) returning id", [id, hash, demoAccessEnabled]);
  if (!result.rowCount) fail(404, "ไม่พบสมาชิก");
  return token;
}

export async function listStaffRewards() {
  return (await pool.query("select * from jaguar_rewards where not is_demo or $1 order by is_active desc,points_cost,name", [demoAccessEnabled])).rows;
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
