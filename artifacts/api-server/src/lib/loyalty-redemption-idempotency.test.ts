import assert from "node:assert/strict";
import test, { after } from "node:test";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

type FixtureClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
  release: () => void;
};
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  test("redemption idempotency integration tests require DATABASE_URL", { skip: true }, () => {});
} else {
  const { loyaltyStore } = await import("./loyalty-store");
  const { pool: appPool } = await import("@workspace/db");
  const { Pool } = createRequire(new URL("../../../../lib/db/src/index.ts", import.meta.url))("pg") as {
    Pool: new (config: { connectionString: string; statement_timeout: number }) => {
      connect: () => Promise<FixtureClient>;
      query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
      end: () => Promise<void>;
    };
  };
  const pool = new Pool({ connectionString: databaseUrl, statement_timeout: 8000 });
  after(async () => { await Promise.all([pool.end(), appPool.end()]); });
  const schemaReady = Boolean((await pool.query(
    `select exists (
      select 1 from information_schema.columns
      where table_schema=current_schema() and table_name='jaguar_redemptions'
        and column_name='rejection_reason'
    ) as ready`,
  )).rows[0]?.ready);

  type Fixture = { memberId: string; rewardId: string };

  async function createFixture(): Promise<Fixture> {
    const memberId = randomUUID();
    const rewardId = randomUUID();
    const memberCode = `T${memberId.replaceAll("-", "").slice(0, 6).toUpperCase()}Z`;
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into jaguar_members(id,member_code,display_name,is_demo,status)
         values($1,$2,'Idempotency test member',false,'active')`,
        [memberId, memberCode],
      );
      await client.query(
        `insert into jaguar_point_balances(member_id,balance,lifetime_earned,lifetime_redeemed)
         values($1,20,20,0)`,
        [memberId],
      );
      await client.query(
        `insert into jaguar_rewards(id,name,description,points_cost,is_active,is_demo)
         values($1,$2,'',10,true,false)`,
        [rewardId, `Idempotency test ${rewardId}`],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    return { memberId, rewardId };
  }

  async function removeFixture({ memberId, rewardId }: Fixture): Promise<void> {
    await pool.query("delete from jaguar_point_transactions where member_id=$1", [memberId]);
    await pool.query("delete from jaguar_redemptions where member_id=$1", [memberId]);
    await pool.query("delete from jaguar_point_balances where member_id=$1", [memberId]);
    await pool.query("delete from jaguar_rewards where id=$1", [rewardId]);
    await pool.query("delete from jaguar_members where id=$1", [memberId]);
  }

  test("replaying a request ID returns the existing redemption without changing points", { skip: !schemaReady && "development schema updates after task merge" }, async () => {
    const fixture = await createFixture();
    try {
      const requestId = randomUUID();
      const first = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });
      const replay = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });
      const routeReplay = await loyaltyStore<Record<string, unknown>>("jaguar_find_redemption_request", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });
      assert.equal(replay.id, first.id);
      assert.equal(routeReplay.id, first.id);
      assert.equal(replay.status, "pending");
      await assert.rejects(
        loyaltyStore("jaguar_request_redemption", {
          p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: randomUUID(),
        }),
        (error: { status?: number }) => error.status === 409,
      );

      const totals = (await pool.query(
        `select b.balance,
          (select count(*)::integer from jaguar_redemptions where member_id=$1) as redemptions
         from jaguar_point_balances b where b.member_id=$1`,
        [fixture.memberId],
      )).rows[0];
      assert.equal(totals.balance, 20);
      assert.equal(totals.redemptions, 1);
    } finally {
      await removeFixture(fixture);
    }
  });

  test("replaying an accepted request still works after its reward is paused", { skip: !schemaReady && "development schema updates after task merge" }, async () => {
    const fixture = await createFixture();
    try {
      const requestId = randomUUID();
      const first = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });

      await pool.query("update jaguar_rewards set is_active=false where id=$1", [fixture.rewardId]);

      const replay = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });
      const routeReplay = await loyaltyStore<Record<string, unknown>>("jaguar_find_redemption_request", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: requestId,
      });

      assert.equal(replay.id, first.id);
      assert.equal(routeReplay.id, first.id);
      assert.equal(replay.status, "pending");

      const totals = (await pool.query(
        `select b.balance,b.lifetime_redeemed,
          (select count(*)::integer from jaguar_redemptions where member_id=$1) as redemptions
         from jaguar_point_balances b where b.member_id=$1`,
        [fixture.memberId],
      )).rows[0];
      assert.equal(totals.balance, 20);
      assert.equal(totals.lifetime_redeemed, 0);
      assert.equal(totals.redemptions, 1);
    } finally {
      await removeFixture(fixture);
    }
  });

  test("rejecting a pending redemption records a reason without spending points and allows a new request", { skip: !schemaReady && "development schema updates after task merge" }, async () => {
    const fixture = await createFixture();
    try {
      const rejectedRequest = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: randomUUID(),
      });
      const rejectedRequestId = String(rejectedRequest.id);
      const rejected = await loyaltyStore<Record<string, unknown>>("jaguar_reject_redemption", {
        p_redemption: rejectedRequestId, p_reason: "Member selected the wrong reward",
      });
      assert.equal(rejected.status, "rejected");
      assert.equal(rejected.rejection_reason, "Member selected the wrong reward");

      await assert.rejects(
        loyaltyStore("jaguar_reject_redemption", {
          p_redemption: rejectedRequestId, p_reason: "Trying to reject again",
        }),
        (error: { status?: number }) => error.status === 409,
      );

      const newRequest = await loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
        p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: randomUUID(),
      });
      assert.equal(newRequest.status, "pending");

      const totals = (await pool.query(
        `select b.balance,b.lifetime_redeemed,
          (select count(*)::integer from jaguar_redemptions where member_id=$1) as redemptions
         from jaguar_point_balances b where b.member_id=$1`,
        [fixture.memberId],
      )).rows[0];
      assert.equal(totals.balance, 20);
      assert.equal(totals.lifetime_redeemed, 0);
      assert.equal(totals.redemptions, 2);
    } finally {
      await removeFixture(fixture);
    }
  });

  test("concurrent repeated requests and confirmations never create a second spend", { skip: !schemaReady && "development schema updates after task merge" }, async () => {
    const fixture = await createFixture();
    try {
      const attempts = await Promise.allSettled([
        loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
          p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: randomUUID(),
        }),
        loyaltyStore<Record<string, unknown>>("jaguar_request_redemption", {
          p_member: fixture.memberId, p_reward: fixture.rewardId, p_request: randomUUID(),
        }),
      ]);
      const successfulAttempts = attempts.filter((attempt) => attempt.status === "fulfilled");
      const failedAttempts = attempts.filter((attempt) => attempt.status === "rejected");
      assert.equal(successfulAttempts.length, 1);
      assert.equal(failedAttempts.length, 1);

      const redemption = successfulAttempts[0];
      assert.ok(redemption && redemption.status === "fulfilled");
      const redemptionId = String(redemption.value.id);
      const confirmations = await Promise.all([
        loyaltyStore<Record<string, unknown>>("jaguar_confirm_redemption", { p_redemption: redemptionId }),
        loyaltyStore<Record<string, unknown>>("jaguar_confirm_redemption", { p_redemption: redemptionId }),
      ]);
      assert.deepEqual(confirmations.map((item) => item.status), ["confirmed", "confirmed"]);

      const totals = (await pool.query(
        `select b.balance,b.lifetime_redeemed,
          (select count(*)::integer from jaguar_point_transactions
           where member_id=$1 and delta=-10 and reason='reward_redemption') as deductions,
          (select count(*)::integer from jaguar_redemptions where member_id=$1) as redemptions
         from jaguar_point_balances b where b.member_id=$1`,
        [fixture.memberId],
      )).rows[0];
      assert.equal(totals.balance, 10);
      assert.equal(totals.lifetime_redeemed, 10);
      assert.equal(totals.deductions, 1);
      assert.equal(totals.redemptions, 1);
    } finally {
      await removeFixture(fixture);
    }
  });
}
