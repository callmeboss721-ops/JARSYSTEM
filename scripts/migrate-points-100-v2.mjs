/**
 * One-time, development-only migration to cash/gram accumulation.
 * Requires an explicit opt-in: JAGUAR_POINTS_MIGRATION=dev.
 * Run only after the development schema has been pushed.
 */
import { createRequire } from "node:module";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) {
  throw new Error("This migration is not allowed in a production deployment");
}
if (process.env.JAGUAR_POINTS_MIGRATION !== "dev") {
  throw new Error("Set JAGUAR_POINTS_MIGRATION=dev to confirm this is the development database");
}

const require = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { Pool } = require("pg");
const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const version = "points-v2-cash100-cannabis100g";

try {
  const client = await db.connect();
  try {
    await client.query("begin");
    await client.query("set local statement_timeout='30s'");
    await client.query("set local lock_timeout='8s'");
    const prior = (await client.query("select value from jaguar_settings where key='jaguar_points_policy_version' for update")).rows[0]?.value;
    if (prior === version) {
      await client.query("commit");
      console.log("Points policy migration already applied; no changes made.");
    } else {
      await client.query("lock table jaguar_point_balances in exclusive mode");
      await client.query("lock table jaguar_sales in share mode");
      await client.query("lock table jaguar_cannabis_transactions in share mode");
      await client.query(`insert into jaguar_points_policy_snapshots(
        member_id,policy_version,old_kratom_balance,old_kratom_lifetime_earned,old_kratom_lifetime_redeemed,
        old_cannabis_balance,old_cannabis_lifetime_earned,old_cannabis_lifetime_redeemed
      )
      select m.id,$1,coalesce(p.balance,0),coalesce(p.lifetime_earned,0),coalesce(p.lifetime_redeemed,0),
        coalesce(p.cannabis_balance,c.balance,0),coalesce(c.lifetime_earned,0),coalesce(c.lifetime_redeemed,0)
      from jaguar_members m
      left join jaguar_point_balances p on p.member_id=m.id
      left join jaguar_cannabis_balances c on c.member_id=m.id
      on conflict(member_id) do nothing`, [version]);

      await client.query(`with sales as (
        select member_id,coalesce(sum(amount_baht),0)::bigint as total_baht
        from jaguar_sales group by member_id
      ), redeemed as (
        select member_id,coalesce(sum(points_spent),0)::bigint as spent
        from jaguar_redemptions where status='confirmed' group by member_id
      )
      update jaguar_point_balances p set
        balance=greatest(floor(coalesce(s.total_baht,0)::numeric/100)::bigint-coalesce(r.spent,0),0)::integer,
        lifetime_earned=floor(coalesce(s.total_baht,0)::numeric/100)::integer,
        lifetime_redeemed=coalesce(r.spent,0)::integer,
        kratom_amount_remainder=mod(coalesce(s.total_baht,0),100)::integer
      from jaguar_members m
      left join sales s on s.member_id=m.id
      left join redeemed r on r.member_id=m.id
      where p.member_id=m.id`);

      await client.query("insert into jaguar_cannabis_balances(member_id) select id from jaguar_members on conflict do nothing");
      await client.query(`with grams as (
        select member_id,coalesce(sum(grams_purchased),0)::bigint as total_grams
        from jaguar_cannabis_transactions where grams_purchased>0 group by member_id
      ), redeemed as (
        select member_id,coalesce(sum(-delta) filter (where delta<0),0)::bigint as spent
        from jaguar_cannabis_transactions group by member_id
      ), recalculated as (
        select c.member_id,
          floor(coalesce(g.total_grams,0)::numeric/100)::bigint as earned,
          mod(coalesce(g.total_grams,0),100)::integer as remainder,
          coalesce(r.spent,0)::bigint as redeemed
        from jaguar_cannabis_balances c
        left join grams g on g.member_id=c.member_id
        left join redeemed r on r.member_id=c.member_id
      )
      update jaguar_cannabis_balances c set
        balance=greatest(x.earned-x.redeemed,0)::integer,
        lifetime_earned=x.earned::integer,
        lifetime_redeemed=x.redeemed::integer
      from recalculated x where c.member_id=x.member_id`);
      await client.query(`with grams as (
        select member_id,coalesce(sum(grams_purchased),0)::bigint as total_grams
        from jaguar_cannabis_transactions where grams_purchased>0 group by member_id
      ), redeemed as (
        select member_id,coalesce(sum(-delta) filter (where delta<0),0)::bigint as spent
        from jaguar_cannabis_transactions group by member_id
      )
      update jaguar_point_balances p set
        cannabis_balance=greatest(
          floor(coalesce(g.total_grams,0)::numeric/100)::bigint-coalesce(r.spent,0),0
        )::integer,
        cannabis_grams_remainder=mod(coalesce(g.total_grams,0),100)::integer
      from jaguar_members m
      left join grams g on g.member_id=m.id
      left join redeemed r on r.member_id=m.id
      where p.member_id=m.id`);

      await client.query("alter table jaguar_cannabis_transactions drop constraint if exists jaguar_cannabis_transaction_delta");
      await client.query(`insert into jaguar_settings(key,value) values('cannabis_points_enabled','false')
        on conflict(key) do nothing`);
      await client.query(`insert into jaguar_settings(key,value) values('jaguar_points_policy_version',$1)
        on conflict(key) do update set value=excluded.value`, [version]);
      const result = await client.query(`select
        (select count(*)::integer from jaguar_points_policy_snapshots where policy_version=$1) as preserved_members,
        (select count(*)::integer from jaguar_sales where points_policy='legacy-bottle-v1') as old_sales_preserved,
        (select count(*)::integer from jaguar_cannabis_transactions where points_policy='legacy-gram-v1') as old_cannabis_history_preserved`, [version]);
      await client.query("commit");
      console.log(`Points policy migration applied. Preserved member snapshots: ${result.rows[0].preserved_members}; sales history rows: ${result.rows[0].old_sales_preserved}; cannabis history rows: ${result.rows[0].old_cannabis_history_preserved}.`);
    }
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} finally {
  await db.end();
}
