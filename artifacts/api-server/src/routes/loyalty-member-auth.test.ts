import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import type { AddressInfo } from "node:net";

const testDatabaseUrl = process.env.JAGUAR_TEST_DATABASE_URL;

test("member login methods return the authenticated member card contract", {
  skip: !testDatabaseUrl
    ? "Set JAGUAR_TEST_DATABASE_URL to an isolated test database; DATABASE_URL is never used as a fallback."
    : false,
}, async () => {
  if (!testDatabaseUrl) return;

  const databaseProtocol = new URL(testDatabaseUrl).protocol;
  assert.ok(
    databaseProtocol === "postgres:" || databaseProtocol === "postgresql:",
    "JAGUAR_TEST_DATABASE_URL must be a PostgreSQL URL.",
  );

  // Tests use only this explicitly opted-in database and an ephemeral session key.
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SESSION_SECRET = randomUUID() + randomUUID();

  const [{ default: app }, { pool }, { privateKey }, { GetMemberCardResponse }] = await Promise.all([
    import("../app"),
    import("@workspace/db"),
    import("../lib/loyalty-security"),
    import("@workspace/api-zod"),
  ]);

  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const id = randomUUID();
  const memberId = id;
  const code = `T${id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  const phoneDigits = id.replaceAll("-", "").replace(/[a-f]/g, (character) =>
    String(parseInt(character, 16) % 10),
  );
  const phone = `+669${phoneDigits.slice(0, 8)}`;
  const nickname = `Test${id.slice(0, 6)}`;
  const ipBase = parseInt(id.slice(0, 2), 16) % 254;
  const memberIps = [0, 1, 2].map((offset) =>
    `198.51.100.${((ipBase + offset * 71) % 254) + 1}`,
  );
  const cleanupLimitScopes = new Set<string>();
  cleanupLimitScopes.add(`member-login-account:${privateKey(memberId)}`);

  try {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into jaguar_members(id,member_code,display_name,phone_e164,nickname,is_demo,status)
         values($1,$2,'Synthetic member auth fixture',$3,$4,false,'active')`,
        [memberId, code, phone, nickname],
      );
      await client.query(
        `insert into jaguar_point_balances(member_id,balance,lifetime_earned,lifetime_redeemed,
          kratom_amount_remainder,cannabis_balance,cannabis_grams_remainder)
         values($1,7,12,5,42,3,17)`,
        [memberId],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const modes = [
      { method: "phone", identifier: `0${phone.slice(3)}`, target: phone },
      { method: "member_code", identifier: ` ${code.toLowerCase()} `, target: code.toLowerCase() },
      { method: "nickname", identifier: ` ${nickname.toLowerCase()} `, target: nickname.toLowerCase() },
    ] as const;

    for (const [index, mode] of modes.entries()) {
      const ip = memberIps[index]!;
      cleanupLimitScopes.add(`all:${privateKey(ip)}`);
      cleanupLimitScopes.add(`member-login:${privateKey(ip)}`);
      cleanupLimitScopes.add(`member-login-target:${privateKey(mode.target)}`);

      const login = await fetch(`${baseUrl}/api/loyalty/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ method: mode.method, identifier: mode.identifier }),
      });
      const loginBody: unknown = await login.json();
      assert.equal(
        login.status,
        200,
        `${mode.method} login failed (${login.status}): ${JSON.stringify(loginBody)}`,
      );
      assert.ok(
        login.headers.get("set-cookie")?.includes("jaguar_member="),
        `${mode.method} login must issue the member session cookie.`,
      );

      const loginCard = GetMemberCardResponse.safeParse(loginBody);
      assert.ok(
        loginCard.success,
        `${mode.method} login response no longer matches GetMemberCardResponse: ${
          loginCard.success ? "" : loginCard.error.message
        }`,
      );
      assert.deepEqual(
        Object.keys(loginBody as Record<string, unknown>).sort(),
        [
          "balance",
          "cannabis_balance",
          "cannabis_remainder_grams",
          "display_name",
          "id",
          "is_demo",
          "kratom_remainder_baht",
          "lifetime_earned",
          "lifetime_redeemed",
          "member_code",
          "nickname",
          "phone_masked",
          "status",
        ],
        `${mode.method} login card fields changed; review the member-card contract.`,
      );
      assert.equal(loginCard.data.id, memberId, `${mode.method} login selected the wrong member.`);
      assert.equal(loginCard.data.member_code, code);
      assert.equal(loginCard.data.balance, 7);
      assert.equal(loginCard.data.lifetime_earned, 12);
      assert.equal(loginCard.data.lifetime_redeemed, 5);
      assert.equal(loginCard.data.kratom_remainder_baht, 42);
      assert.equal(loginCard.data.cannabis_balance, 3);
      assert.equal(loginCard.data.cannabis_remainder_grams, 17);
      assert.equal(loginCard.data.phone_masked, `09x-xxx-${phone.slice(-4)}`);
      assert.equal(loginCard.data.is_demo, false);
      assert.equal(loginCard.data.status, "active");

      const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
      const card = await fetch(`${baseUrl}/api/loyalty/card`, {
        headers: { cookie, "x-forwarded-for": ip },
      });
      const cardBody: unknown = await card.json();
      assert.equal(
        card.status,
        200,
        `${mode.method} authenticated card read failed (${card.status}): ${JSON.stringify(cardBody)}`,
      );
      const cardResult = GetMemberCardResponse.safeParse(cardBody);
      assert.ok(
        cardResult.success,
        `Authenticated card response no longer matches GetMemberCardResponse: ${
          cardResult.success ? "" : cardResult.error.message
        }`,
      );
      assert.deepEqual(cardBody, loginBody, "Authenticated card read must match the login card.");
    }

  } finally {
    try {
      await pool.query("delete from jaguar_point_balances where member_id=$1", [memberId]);
      await pool.query("delete from jaguar_members where id=$1", [memberId]);
      const hashedLimitKeys = [...cleanupLimitScopes].map((scope) => privateKey(`limit:${scope}`));
      if (hashedLimitKeys.length) {
        await pool.query(
          "delete from jaguar_security_limits where key_hash = any($1::text[])",
          [hashedLimitKeys],
        );
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      await pool.end();
    }
  }
});
