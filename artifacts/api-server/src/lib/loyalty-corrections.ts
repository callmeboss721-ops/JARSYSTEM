import { pool, type PoolClient } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";
import { logger } from "./logger";
import { calculateCarryPoints, calculateCumulativePointDelta } from "./points-policy";

type Formula = "red" | "silver" | "gold";
type CorrectionEntity = "kratom_sale" | "cannabis_sale" | "redemption" | "bank_transfer";
type CorrectionSnapshot = Record<string, string | number | null>;

type StaffSale = {
  id: string;
  formula: Formula;
  bottle_count: number;
  amount_baht: number;
  points_awarded: number;
  created_at: string;
  editable: boolean;
  corrected: boolean;
  has_slip: boolean;
};

function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

function cleanReason(value: string): string {
  const reason = value.normalize("NFC").trim();
  const length = Array.from(reason).length;
  if (length < 3 || length > 200 || /[\u0000-\u001f\u007f]/.test(reason)) {
    fail(400, "ระบุเหตุผลการแก้ไข 3–200 ตัวอักษร");
  }
  return reason;
}

async function begin(client: PoolClient): Promise<void> {
  await client.query("begin");
  await client.query("set local statement_timeout = '8s'");
  await client.query("set local lock_timeout = '5s'");
}

async function writeCorrection(
  client: PoolClient,
  entityType: CorrectionEntity,
  entityId: string,
  memberId: string | null,
  reason: string,
  before: CorrectionSnapshot,
  after: CorrectionSnapshot,
): Promise<void> {
  await client.query(
    `insert into jaguar_transaction_corrections
      (entity_type,entity_id,member_id,reason,before_data,after_data,corrected_by)
     values($1,$2,$3,$4,$5::jsonb,$6::jsonb,'staff')`,
    [entityType, entityId, memberId, reason, JSON.stringify(before), JSON.stringify(after)],
  );
}

function reportFailure(operation: string, error: unknown): never {
  if (error instanceof LoyaltyError) throw error;
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  logger.error({ operation, databaseCode: /^[A-Z0-9]{5}$/.test(code) ? code : undefined }, "Loyalty correction failed");
  throw new LoyaltyError(503, "บันทึกการแก้ไขไม่ได้ กรุณาลองใหม่");
}

async function staffSalesFor(client: PoolClient, memberId: string): Promise<StaffSale[]> {
  const rows = (await client.query<StaffSale>(
    `select s.id,s.formula,s.bottle_count,s.amount_baht,s.points_awarded,
       (s.slip_path is not null) as has_slip,
       s.created_at::text as created_at,true as editable,
       exists(select 1 from jaguar_transaction_corrections c
          where c.entity_type='kratom_sale' and c.entity_id=s.id
            and (c.before_data ? 'bottle_count' or c.before_data ? 'amount_baht' or c.before_data ? 'formula')) as corrected
     from jaguar_sales s
     where s.member_id=$1
       and (s.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date
     order by s.created_at desc,s.id desc limit 30`,
    [memberId],
  )).rows;
  return rows;
}

export async function listStaffSales(memberId: string): Promise<StaffSale[]> {
  const client = await pool.connect();
  try { return await staffSalesFor(client, memberId); }
  finally { client.release(); }
}

export async function getStaffSaleSlipPath(id: string): Promise<string> {
  const result = await pool.query<{ slip_path: string | null }>(
    `select s.slip_path from jaguar_sales s
     join jaguar_members m on m.id=s.member_id
     where s.id=$1 and not m.is_demo and m.status='active'
       and (s.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date`,
    [id],
  );
  const path = result.rows[0]?.slip_path;
  if (!path) fail(404, "ไม่พบสลิปของรายการนี้");
  return path;
}

export async function updateStaffSaleSlip(id: string, slipPath: string | null): Promise<{ has_slip: boolean }> {
  if (slipPath !== null && !/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(slipPath)) {
    fail(400, "ไฟล์แนบไม่ถูกต้อง");
  }
  const client = await pool.connect();
  try {
    await begin(client);
    const sale = (await client.query<{
      member_id: string;
      slip_path: string | null;
      is_today: boolean;
    }>(
      `select s.member_id,s.slip_path,
         ((s.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date) as is_today
       from jaguar_sales s join jaguar_members m on m.id=s.member_id
       where s.id=$1 and m.status='active' and not m.is_demo
       for update of s`,
      [id],
    )).rows[0];
    if (!sale) fail(404, "ไม่พบรายการซื้อที่ต้องการแก้ไข");
    if (!sale.is_today) fail(409, "แก้ไขได้เฉพาะรายการซื้อของวันนี้");
    if (sale.slip_path !== slipPath) {
      await client.query("update jaguar_sales set slip_path=$2 where id=$1", [id, slipPath]);
      await writeCorrection(
        client,
        "kratom_sale",
        id,
        sale.member_id,
        "เปลี่ยนภาพสลิปรายการซื้อ",
        { slip_path: sale.slip_path },
        { slip_path: slipPath },
      );
    }
    await client.query("commit");
    return { has_slip: slipPath !== null };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    reportFailure("staff_kratom_sale_slip_update", error);
  } finally {
    client.release();
  }
}

export async function correctStaffSale(
  id: string,
  input: { bottle_count: number; formula: Formula; reason: string },
): Promise<{ member_id: string; sales: StaffSale[] }> {
  const client = await pool.connect();
  try {
    await begin(client);
    const targetMemberId = (await client.query<{ member_id: string }>(
      "select member_id from jaguar_sales where id=$1",
      [id],
    )).rows[0]?.member_id;
    if (!targetMemberId) fail(404, "ไม่พบรายการซื้อที่ต้องการแก้ไข");

    const member = (await client.query<{ id: string }>(
      "select id from jaguar_members where id=$1 and status='active' and not is_demo for update",
      [targetMemberId],
    )).rows[0];
    if (!member) fail(404, "ไม่พบสมาชิกที่ใช้งานได้");

    const target = (await client.query<{
      id: string;
      member_id: string;
      bottle_count: number;
      formula: Formula;
      amount_baht: number;
      points_awarded: number;
      is_today: boolean;
    }>(
      `select id,member_id,bottle_count,formula,amount_baht,points_awarded,
        ((created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date) as is_today
       from jaguar_sales where id=$1 for update`,
      [id],
    )).rows[0];
    if (!target) fail(404, "ไม่พบรายการซื้อที่ต้องการแก้ไข");
    if (!target.is_today) fail(409, "แก้ไขได้เฉพาะรายการซื้อของวันนี้");

    const balance = (await client.query<{
      balance: number;
      lifetime_earned: number;
      lifetime_redeemed: number;
      kratom_amount_remainder: number;
    }>(
      `select balance,lifetime_earned,lifetime_redeemed,kratom_amount_remainder
       from jaguar_point_balances where member_id=$1 for update`,
      [target.member_id],
    )).rows[0];
    if (!balance) fail(404, "ไม่พบยอดแต้มสมาชิก");

    const sales = (await client.query<{
      id: string;
      bottle_count: number;
      formula: Formula;
      amount_baht: number;
      points_awarded: number;
      points_policy: string;
      slip_path: string | null;
    }>(
      `select id,bottle_count,formula,amount_baht,points_awarded,points_policy,slip_path
       from jaguar_sales where member_id=$1 order by created_at,id for update`,
      [target.member_id],
    )).rows;
    const oldTotalAmount = sales.reduce((total, sale) => total + sale.amount_baht, 0);
    let remainder = (balance.kratom_amount_remainder - (oldTotalAmount % 100) + 100) % 100;
    const newAmount = input.bottle_count * 50;
    const correctedSales = sales.map((sale) => {
      const isTarget = sale.id === id;
      const bottleCount = isTarget ? input.bottle_count : sale.bottle_count;
      const formula = isTarget ? input.formula : sale.formula;
      const amount = isTarget ? newAmount : sale.amount_baht;
      const earned = calculateCarryPoints(remainder, amount);
      remainder = earned.remainder;
      return {
        id: sale.id,
        bottle_count: bottleCount,
        formula,
        amount_baht: amount,
        points_awarded: earned.points,
        has_slip: sale.slip_path !== null,
        isTarget,
      };
    });
    const nextTotalAmount = correctedSales.reduce((total, sale) => total + sale.amount_baht, 0);
    // Migration-era per-sale awards may still be legacy values, and lifetime_earned
    // also includes staff-issued points. Compare sale totals under the active rule.
    const pointDelta = calculateCumulativePointDelta(oldTotalAmount, nextTotalAmount);
    const nextBalance = balance.balance + pointDelta;
    const nextLifetimeEarned = balance.lifetime_earned + pointDelta;
    if (nextBalance < 0 || nextLifetimeEarned < 0) {
      fail(409, "แก้รายการนี้แล้วแต้มจะติดลบ กรุณาตรวจสอบรายการแลกและยอดซื้อก่อน");
    }

    const reason = cleanReason(input.reason);

    const salesById = new Map(sales.map((sale) => [sale.id, sale]));
    for (const sale of correctedSales) {
      const previous = salesById.get(sale.id)!;
      const changed = sale.isTarget || sale.points_awarded !== previous.points_awarded;
      if (!changed && previous.points_policy === "kratom-cash-v2") continue;
      await client.query(
        `update jaguar_sales set bottle_count=$2,formula=$3,amount_baht=$4,
          points_awarded=$5,points_policy='kratom-cash-v2' where id=$1`,
        [sale.id, sale.bottle_count, sale.formula, sale.amount_baht, sale.points_awarded],
      );
      if (changed) {
        await writeCorrection(
          client,
          "kratom_sale",
          sale.id,
          target.member_id,
          reason,
          {
            bottle_count: previous.bottle_count,
            formula: previous.formula,
            amount_baht: previous.amount_baht,
            points_awarded: previous.points_awarded,
          },
          {
            bottle_count: sale.bottle_count,
            formula: sale.formula,
            amount_baht: sale.amount_baht,
            points_awarded: sale.points_awarded,
          },
        );
      }
    }
    await client.query(
      `update jaguar_point_balances set balance=$2,lifetime_earned=$3,kratom_amount_remainder=$4
       where member_id=$1`,
      [target.member_id, nextBalance, nextLifetimeEarned, remainder],
    );
    if (pointDelta !== 0) {
      await client.query(
        "insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,'ปรับแต้มจากการแก้ไขยอดซื้อ')",
        [target.member_id, pointDelta],
      );
    }
    const result = { member_id: target.member_id, sales: await staffSalesFor(client, target.member_id) };
    await client.query("commit");
    logger.info({ operation: "staff_kratom_sale_corrected", transactionId: id, memberId: target.member_id }, "Kratom sale corrected");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    reportFailure("staff_kratom_sale_correction", error);
  } finally {
    client.release();
  }
}

export async function correctStaffCannabisSale(
  id: string,
  input: { grams: number; reason: string },
): Promise<string> {
  const client = await pool.connect();
  try {
    await begin(client);
    const targetMemberId = (await client.query<{ member_id: string }>(
      "select member_id from jaguar_cannabis_transactions where id=$1 and grams_purchased>0",
      [id],
    )).rows[0]?.member_id;
    if (!targetMemberId) fail(404, "ไม่พบรายการซื้อกัญชาที่ต้องการแก้ไข");

    const member = (await client.query<{ id: string }>(
      "select id from jaguar_members where id=$1 and status='active' and not is_demo for update",
      [targetMemberId],
    )).rows[0];
    if (!member) fail(404, "ไม่พบสมาชิกที่ใช้งานได้");

    const target = (await client.query<{
      id: string;
      member_id: string;
      delta: number;
      grams_purchased: number;
      reason: string;
      is_today: boolean;
    }>(
      `select id,member_id,delta,grams_purchased,reason,
        ((created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date) as is_today
       from jaguar_cannabis_transactions where id=$1 and grams_purchased>0 for update`,
      [id],
    )).rows[0];
    if (!target) fail(404, "ไม่พบรายการซื้อกัญชาที่ต้องการแก้ไข");
    if (!target.is_today) fail(409, "แก้ไขได้เฉพาะรายการซื้อของวันนี้");

    await client.query(
      "insert into jaguar_cannabis_balances(member_id) values($1) on conflict do nothing",
      [target.member_id],
    );
    const balance = (await client.query<{
      balance: number;
      remainder: number;
      lifetime_earned: number;
      lifetime_redeemed: number;
    }>(
      `select coalesce(p.cannabis_balance,c.balance,0)::integer as balance,
          p.cannabis_grams_remainder as remainder,c.lifetime_earned,c.lifetime_redeemed
       from jaguar_point_balances p join jaguar_cannabis_balances c on c.member_id=p.member_id
       where p.member_id=$1 for update of p,c`,
      [target.member_id],
    )).rows[0];
    if (!balance) fail(503, "บัตรกัญชายังไม่พร้อมใช้งาน");

    const purchases = (await client.query<{
      id: string;
      grams_purchased: number;
      delta: number;
      points_policy: string;
      reason: string;
    }>(
      `select id,grams_purchased,delta,points_policy,reason from jaguar_cannabis_transactions
       where member_id=$1 and grams_purchased>0 order by created_at,id for update`,
      [target.member_id],
    )).rows;
    const oldTotalGrams = purchases.reduce((total, purchase) => total + purchase.grams_purchased, 0);
    let remainder = (balance.remainder - (oldTotalGrams % 100) + 100) % 100;
    const correctedPurchases = purchases.map((purchase) => {
      const grams = purchase.id === id ? input.grams : purchase.grams_purchased;
      const earned = calculateCarryPoints(remainder, grams);
      remainder = earned.remainder;
      return { ...purchase, grams_purchased: grams, delta: earned.points, isTarget: purchase.id === id };
    });
    const nextTotalGrams = correctedPurchases.reduce((total, purchase) => total + purchase.grams_purchased, 0);
    // Historical per-transaction deltas can retain their former rule after the
    // one-time migration, so derive the old earned amount from recorded grams.
    const pointDelta = calculateCumulativePointDelta(oldTotalGrams, nextTotalGrams);
    const nextBalance = balance.balance + pointDelta;
    const nextLifetimeEarned = balance.lifetime_earned + pointDelta;
    if (nextBalance < 0 || nextLifetimeEarned < 0) {
      fail(409, "แก้รายการนี้แล้วแต้มจะติดลบ กรุณาตรวจสอบรายการแลกและยอดซื้อก่อน");
    }

    const reason = cleanReason(input.reason);

    for (const purchase of correctedPurchases) {
      const old = purchases.find((row) => row.id === purchase.id);
      if (!purchase.isTarget && old?.delta === purchase.delta && old?.points_policy === "cannabis-100g-v2") continue;
      const purchaseReason = purchase.isTarget
        ? `สะสมครบทุก 100 g · ซื้อ ${purchase.grams_purchased} g`
        : purchase.reason;
      await client.query(
        `update jaguar_cannabis_transactions set grams_purchased=$2,delta=$3,reason=$4,
          points_policy='cannabis-100g-v2' where id=$1`,
        [purchase.id, purchase.grams_purchased, purchase.delta, purchaseReason],
      );
      if (purchase.isTarget || old?.delta !== purchase.delta) {
        await writeCorrection(
          client,
          "cannabis_sale",
          purchase.id,
          target.member_id,
          reason,
          { grams_purchased: old?.grams_purchased ?? 0, points_awarded: old?.delta ?? 0, reason: old?.reason ?? "" },
          { grams_purchased: purchase.grams_purchased, points_awarded: purchase.delta, reason: purchaseReason },
        );
      }
    }
    await client.query(
      `update jaguar_point_balances set cannabis_balance=$2,cannabis_grams_remainder=$3 where member_id=$1`,
      [target.member_id, nextBalance, remainder],
    );
    await client.query(
      `update jaguar_cannabis_balances set balance=$2,lifetime_earned=$3 where member_id=$1`,
      [target.member_id, nextBalance, nextLifetimeEarned],
    );
    await client.query("commit");
    logger.info({ operation: "staff_cannabis_sale_corrected", transactionId: id, memberId: target.member_id }, "Cannabis sale corrected");
    return target.member_id;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    reportFailure("staff_cannabis_sale_correction", error);
  } finally {
    client.release();
  }
}

export async function listRecentStaffRedemptions() {
  return (await pool.query(
    `select d.id,d.member_id,m.member_code,m.nickname as member_nickname,
       nullif(right(regexp_replace(coalesce(m.phone_e164,''),'[^0-9]','','g'),4),'') as phone_last4,
       d.reward_id,r.name as reward_name,d.points_spent,d.status,d.rejection_reason,d.created_at::text as created_at,
       exists(select 1 from jaguar_transaction_corrections c
         where c.entity_type='redemption' and c.entity_id=d.id) as corrected
     from jaguar_redemptions d
     join jaguar_members m on m.id=d.member_id
     join jaguar_rewards r on r.id=d.reward_id
     where (d.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date
       and not m.is_demo
     order by d.created_at desc,d.id desc limit 40`,
  )).rows;
}

export async function correctStaffRedemption(
  id: string,
  input: { reward_id: string; reason: string },
) {
  const client = await pool.connect();
  try {
    await begin(client);
    const memberId = (await client.query<{ member_id: string }>(
      "select member_id from jaguar_redemptions where id=$1",
      [id],
    )).rows[0]?.member_id;
    if (!memberId) fail(404, "ไม่พบรายการแลกรางวัลที่ต้องการแก้ไข");
    const member = (await client.query<{ id: string }>(
      "select id from jaguar_members where id=$1 and status='active' and not is_demo for update",
      [memberId],
    )).rows[0];
    if (!member) fail(404, "ไม่พบสมาชิกที่ใช้งานได้");
    const redemption = (await client.query<{
      id: string;
      member_id: string;
      reward_id: string;
      points_spent: number;
      status: string;
      is_today: boolean;
      reward_name: string;
    }>(
      `select d.id,d.member_id,d.reward_id,d.points_spent,d.status,r.name as reward_name,
        ((d.created_at at time zone 'Asia/Bangkok')::date=(now() at time zone 'Asia/Bangkok')::date) as is_today
       from jaguar_redemptions d join jaguar_rewards r on r.id=d.reward_id
       where d.id=$1 for update of d`,
      [id],
    )).rows[0];
    if (!redemption) fail(404, "ไม่พบรายการแลกรางวัลที่ต้องการแก้ไข");
    if (!redemption.is_today) fail(409, "แก้ไขได้เฉพาะรายการแลกรางวัลของวันนี้");
    const reward = (await client.query<{ id: string; name: string; points_cost: number }>(
      "select id,name,points_cost from jaguar_rewards where id=$1 and is_active=true and not is_demo for share",
      [input.reward_id],
    )).rows[0];
    if (!reward) fail(409, "เลือกรางวัลที่เปิดใช้งานอยู่");
    const reason = cleanReason(input.reason);

    if (redemption.status === "confirmed") {
      const points = (await client.query<{ balance: number; lifetime_redeemed: number }>(
        "select balance,lifetime_redeemed from jaguar_point_balances where member_id=$1 for update",
        [memberId],
      )).rows[0];
      if (!points) fail(404, "ไม่พบยอดแต้มสมาชิก");
      const pointDelta = redemption.points_spent - reward.points_cost;
      if (points.balance + pointDelta < 0 || points.lifetime_redeemed + (reward.points_cost - redemption.points_spent) < 0) {
        fail(409, "แต้มคงเหลือไม่พอสำหรับการแก้ไขรายการนี้");
      }
      if (pointDelta !== 0) {
        await client.query(
          `update jaguar_point_balances set balance=balance+$2,
            lifetime_redeemed=lifetime_redeemed-$2 where member_id=$1`,
          [memberId, pointDelta],
        );
        await client.query(
          "insert into jaguar_point_transactions(member_id,delta,reason) values($1,$2,'ปรับแต้มจากการแก้ไขรายการแลก')",
          [memberId, pointDelta],
        );
      }
    } else if (redemption.status === "pending") {
      const points = (await client.query<{ balance: number }>(
        "select balance from jaguar_point_balances where member_id=$1 for update",
        [memberId],
      )).rows[0];
      if (!points || points.balance < reward.points_cost) {
        fail(409, "แต้มคงเหลือไม่พอสำหรับรางวัลที่เลือก");
      }
    } else {
      fail(409, "สถานะรายการนี้ไม่รองรับการแก้ไข");
    }

    const before: CorrectionSnapshot = {
      reward_id: redemption.reward_id,
      reward_name: redemption.reward_name,
      points_spent: redemption.points_spent,
      status: redemption.status,
    };
    const after: CorrectionSnapshot = {
      reward_id: reward.id,
      reward_name: reward.name,
      points_spent: reward.points_cost,
      status: redemption.status,
    };
    await client.query(
      "update jaguar_redemptions set reward_id=$2,points_spent=$3 where id=$1",
      [id, reward.id, reward.points_cost],
    );
    await writeCorrection(client, "redemption", id, memberId, reason, before, after);
    const result = (await client.query(
      `select d.id,d.member_id,m.member_code,m.nickname as member_nickname,
         nullif(right(regexp_replace(coalesce(m.phone_e164,''),'[^0-9]','','g'),4),'') as phone_last4,
         d.reward_id,r.name as reward_name,d.points_spent,d.status,d.rejection_reason,d.created_at::text as created_at,
         true as corrected
       from jaguar_redemptions d
       join jaguar_members m on m.id=d.member_id
       join jaguar_rewards r on r.id=d.reward_id
       where d.id=$1`,
      [id],
    )).rows[0];
    await client.query("commit");
    logger.info({ operation: "staff_redemption_corrected", redemptionId: id, memberId }, "Redemption corrected");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    reportFailure("staff_redemption_correction", error);
  } finally {
    client.release();
  }
}

