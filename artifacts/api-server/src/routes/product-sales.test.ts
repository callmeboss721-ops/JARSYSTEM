import assert from "node:assert/strict";
import { randomBytes, randomInt, randomUUID, scrypt } from "node:crypto";
import { once } from "node:events";
import { promisify } from "node:util";
import test from "node:test";
import type { AddressInfo } from "node:net";

const testDatabaseUrl = process.env.JAGUAR_TEST_DATABASE_URL;
const deriveKey = promisify(scrypt);

test("signed-in staff can record, review, and void isolated product sales", {
  skip: !testDatabaseUrl
    ? "Set JAGUAR_TEST_DATABASE_URL to an isolated test database; DATABASE_URL is never used as a fallback."
    : false,
}, async () => {
  if (!testDatabaseUrl) return;

  const testDatabase = new URL(testDatabaseUrl);
  assert.ok(
    testDatabase.protocol === "postgres:" || testDatabase.protocol === "postgresql:",
    "JAGUAR_TEST_DATABASE_URL must be a PostgreSQL URL.",
  );
  assert.match(
    decodeURIComponent(testDatabase.pathname.slice(1)),
    /(?:^|[_-])test(?:$|[_-])/i,
    "The isolated test database name must include 'test'.",
  );
  assert.notEqual(
    testDatabaseUrl,
    process.env.DATABASE_URL,
    "JAGUAR_TEST_DATABASE_URL must not be the application's DATABASE_URL.",
  );

  // The server's shared pool is initialized only after opting into this URL.
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SESSION_SECRET = randomBytes(48).toString("hex");

  const [{ default: app }, { pool }, { privateKey }] = await Promise.all([
    import("../app"),
    import("@workspace/db"),
    import("../lib/loyalty-security"),
  ]);

  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const runId = randomUUID();
  const products = [
    { id: randomUUID(), name: `Test stock ${runId.slice(0, 8)}`, price: 125, stock: 5, unit: "ชิ้น" },
    { id: randomUUID(), name: `Test shortage ${runId.slice(0, 8)}`, price: 80, stock: 1, unit: "ถุง" },
    { id: randomUUID(), name: `Test untracked ${runId.slice(0, 8)}`, price: 50, stock: null, unit: null },
  ] as const;
  const requestIds = [randomUUID(), randomUUID()];
  const slipPath = `/objects/uploads/${randomUUID()}`;
  const slipBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUksAAAAASUVORK5CYII=",
    "base64",
  );
  const originalFetch = globalThis.fetch;
  const storageUrl = "https://storage.googleapis.com/jaguar-test-bucket/test-slip";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url === "http://127.0.0.1:1106/object-storage/signed-object-url") {
      return Response.json({ signed_url: storageUrl });
    }
    if (url === storageUrl) {
      const headers = { "content-type": "image/png", "content-length": String(slipBytes.length) };
      return init?.method === "HEAD"
        ? new Response(null, { status: 200, headers })
        : new Response(slipBytes, { status: 200, headers });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  const clientIp = `198.51.100.${randomInt(1, 255)}`;
  const limitScopes = [
    `all:${privateKey(clientIp)}`,
    `staff-login:${privateKey(clientIp)}`,
    `staff-sale-products-read:${privateKey(clientIp)}`,
    `staff-product-sale-create:${privateKey(clientIp)}`,
    `staff-product-sales-read:${privateKey(clientIp)}`,
    `staff-product-sale-slip-read:${privateKey(clientIp)}`,
    `staff-product-sale-void:${privateKey(clientIp)}`,
  ];
  const pin = String(randomInt(1000, 9999));
  const testSalt = randomBytes(16).toString("hex");
  let previousPinHash: string | undefined;
  let pinSettingWritten = false;
  let initialLimitCount: number | undefined;

  let cookie: string | null = null;

  const api = async (path: string, init: RequestInit = {}) => fetch(`${baseUrl}/api/loyalty${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      "x-forwarded-for": clientIp,
      ...init.headers,
    },
  });

  try {
    const initialLimits = await pool.query<{ count: number }>(
      "select count(*)::int as count from jaguar_security_limits",
    );
    initialLimitCount = initialLimits.rows[0]?.count ?? 0;
    const previousPinSetting = await pool.query<{ value: string }>(
      "select value from jaguar_settings where key='staff_pin_hash'",
    );
    previousPinHash = previousPinSetting.rows[0]?.value;
    const testPinHash = (await deriveKey(pin, testSalt, 64) as Buffer).toString("hex");
    await pool.query(
      `insert into jaguar_settings(key,value) values('staff_pin_hash',$1)
       on conflict(key) do update set value=excluded.value`,
      [`${testSalt}:${testPinHash}`],
    );
    pinSettingWritten = true;
    for (const product of products) {
      await pool.query(
        `insert into jaguar_products(id,name,category,description,price_baht,stock_quantity,stock_unit,is_active)
         values($1,$2,'Test fixture','Isolated product sale test',$3,$4,$5,true)`,
        [product.id, product.name, product.price, product.stock, product.unit],
      );
    }

    const login = await api("/staff/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    assert.equal(login.status, 200, "test staff member must be able to sign in");
    const setCookie = login.headers.get("set-cookie");
    assert.ok(setCookie?.includes("jaguar_staff="), "staff login must issue the staff session cookie");
    cookie = setCookie!.split(";")[0]!;

    const catalogResponse = await api("/staff/products");
    assert.equal(catalogResponse.status, 200, "signed-in staff must be able to load the product catalog");
    const catalog = await catalogResponse.json() as Array<{
      id: string;
      name: string;
      price_baht: number;
      stock_quantity: number | null;
      stock_unit: string | null;
    }>;
    for (const product of products) {
      assert.ok(catalog.some((item) =>
        item.id === product.id &&
        item.name === product.name &&
        item.price_baht === product.price &&
        item.stock_quantity === product.stock &&
        item.stock_unit === product.unit
      ), `catalog must expose the correct selection and stock for ${product.name}`);
    }

    const createResponse = await api("/staff/product-sales", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestIds[0],
        payment_method: "transfer",
        items: [
          { product_id: products[0].id, quantity: 2 },
          { product_id: products[1].id, quantity: 3 },
          { product_id: products[2].id, quantity: 4 },
        ],
        slip_path: slipPath,
      }),
    });
    assert.equal(createResponse.status, 200, "staff sale must be recorded");
    const sale = await createResponse.json() as {
      id: string;
      request_id: string;
      payment_method: string;
      amount_baht: number;
      status: string;
      created_at: string;
      recorded_by: string;
      has_slip: boolean;
      items: Array<{
        product_id: string;
        name: string;
        quantity: number;
        line_total_baht: number;
        stock_tracked: boolean;
        stock_deducted_quantity: number;
        stock_shortage_quantity: number;
        stock_reversed_quantity: number;
      }>;
    };
    assert.equal(sale.request_id, requestIds[0]);
    assert.equal(sale.payment_method, "transfer");
    assert.equal(sale.amount_baht, 690);
    assert.equal(sale.status, "completed");
    assert.equal(sale.recorded_by, "staff");
    assert.equal(sale.has_slip, true, "an uploaded slip must be recorded as attached");
    assert.ok(Number.isFinite(Date.parse(sale.created_at)), "sale timestamp must be a valid date");
    assert.deepEqual(
      sale.items.map((item) => [
        item.product_id,
        item.name,
        item.quantity,
        item.line_total_baht,
        item.stock_tracked,
        item.stock_deducted_quantity,
        item.stock_shortage_quantity,
      ]),
      [
        [products[1].id, products[1].name, 3, 240, true, 1, 2],
        [products[0].id, products[0].name, 2, 250, true, 2, 0],
        [products[2].id, products[2].name, 4, 200, false, 0, 0],
      ],
      "sale details must preserve selected quantities, prices, and stock shortages",
    );

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
    const historyResponse = await api(`/staff/product-sales?date=${today}`);
    assert.equal(historyResponse.status, 200, "signed-in staff must be able to load sale history");
    const history = await historyResponse.json() as {
      business_date: string;
      total_amount_baht: number;
      completed_count: number;
      voided_count: number;
      sales: typeof sale[];
    };
    const historySale = history.sales.find((item) => item.id === sale.id);
    assert.ok(historySale, "sale must appear in the selected business date's history");
    assert.equal(historySale.created_at, sale.created_at, "history must retain the sale timestamp");
    const shortageItem = historySale.items.find((item) => item.product_id === products[1].id);
    assert.equal(shortageItem?.name, products[1].name);
    assert.equal(shortageItem?.stock_shortage_quantity, 2);
    const slipResponse = await api(`/staff/product-sales/${sale.id}/slip`);
    assert.equal(slipResponse.status, 200, "staff must be able to view the attached private slip");
    assert.equal(slipResponse.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await slipResponse.arrayBuffer()), slipBytes);

    const secondSaleResponse = await api("/staff/product-sales", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestIds[1],
        payment_method: "cash",
        items: [{ product_id: products[0].id, quantity: 1 }],
        slip_path: null,
      }),
    });
    assert.equal(secondSaleResponse.status, 200, "a separate sale must be recorded before voiding the first");
    const secondSale = await secondSaleResponse.json() as { has_slip: boolean };
    assert.equal(secondSale.has_slip, false, "a sale without an attachment must remain marked as having no slip");

    const voidResponse = await api(`/staff/product-sales/${sale.id}/void`, {
      method: "POST",
      body: JSON.stringify({ reason: "Test correction" }),
    });
    assert.equal(voidResponse.status, 200, "staff must be able to void the test sale");
    const voidedSale = await voidResponse.json() as typeof sale & {
      voided_at: string | null;
      void_reason: string | null;
    };
    assert.equal(voidedSale.status, "voided");
    assert.ok(voidedSale.voided_at && Number.isFinite(Date.parse(voidedSale.voided_at)));
    assert.equal(voidedSale.void_reason, "Test correction");
    assert.deepEqual(
      voidedSale.items.map((item) => [
        item.product_id,
        item.stock_deducted_quantity,
        item.stock_reversed_quantity,
      ]),
      [
        [products[1].id, 1, 1],
        [products[0].id, 2, 2],
        [products[2].id, 0, 0],
      ],
      "voiding must reverse only stock actually deducted by that sale",
    );

    const stockResult = await pool.query<{ id: string; stock_quantity: number | null }>(
      "select id::text as id,stock_quantity from jaguar_products where id=any($1::uuid[])",
      [products.map((product) => product.id)],
    );
    const stockById = new Map(stockResult.rows.map((row) => [row.id, row.stock_quantity]));
    assert.equal(stockById.get(products[0].id), 4, "voiding the first sale must preserve the later sale's deduction");
    assert.equal(stockById.get(products[1].id), 1, "shortage sale void must restore only the one unit deducted");
    assert.equal(stockById.get(products[2].id), null, "untracked stock must remain untracked");
    assert.ok(
      stockResult.rows.every((row) => row.stock_quantity === null || row.stock_quantity >= 0),
      "tracked stock must never become negative",
    );

    const finalHistoryResponse = await api(`/staff/product-sales?date=${today}`);
    assert.equal(finalHistoryResponse.status, 200);
    const finalHistory = await finalHistoryResponse.json() as typeof history;
    const finalSale = finalHistory.sales.find((item) => item.id === sale.id);
    assert.equal(finalSale?.status, "voided", "history must show the voided state");
    assert.equal(finalHistory.completed_count, 1);
    assert.equal(finalHistory.voided_count, 1);
    assert.equal(finalHistory.total_amount_baht, 125);
  } finally {
    try {
      const cleanupClient = await pool.connect();
      try {
        await cleanupClient.query("begin");
        await cleanupClient.query(
          `delete from jaguar_product_sale_items
           where sale_id in (select id from jaguar_product_sales where request_id=any($1::uuid[]))`,
          [requestIds],
        );
        await cleanupClient.query("delete from jaguar_product_sales where request_id=any($1::uuid[])", [requestIds]);
        await cleanupClient.query(
          "delete from jaguar_product_stock_events where product_id=any($1::uuid[])",
          [products.map((product) => product.id)],
        );
        await cleanupClient.query("delete from jaguar_products where id=any($1::uuid[])", [products.map((product) => product.id)]);
        if (pinSettingWritten) {
          if (previousPinHash === undefined) {
            await cleanupClient.query("delete from jaguar_settings where key='staff_pin_hash'");
          } else {
            await cleanupClient.query(
              `insert into jaguar_settings(key,value) values('staff_pin_hash',$1)
               on conflict(key) do update set value=excluded.value`,
              [previousPinHash],
            );
          }
        }
        const hashedLimitKeys = limitScopes.map((scope) => privateKey(`limit:${scope}`));
        await cleanupClient.query("delete from jaguar_security_limits where key_hash=any($1::text[])", [hashedLimitKeys]);
        await cleanupClient.query("commit");
        const remainingLimits = await cleanupClient.query<{ count: number }>(
          "select count(*)::int as count from jaguar_security_limits",
        );
        assert.equal(
          remainingLimits.rows[0]?.count,
          initialLimitCount,
          "the test must remove only its own rate-limit fixtures",
        );
      } catch (error) {
        await cleanupClient.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        cleanupClient.release();
      }
    } finally {
      globalThis.fetch = originalFetch;
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      await pool.end();
    }
  }
});
