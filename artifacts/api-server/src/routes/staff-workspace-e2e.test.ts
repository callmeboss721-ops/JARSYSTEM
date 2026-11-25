import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomInt, randomUUID, scrypt } from "node:crypto";
import { once } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import type { AddressInfo } from "node:net";
import { promisify } from "node:util";
import { chromium, type Page } from "playwright-core";
import test from "node:test";

const testDatabaseUrl = process.env.JAGUAR_TEST_DATABASE_URL;
const deriveKey = promisify(scrypt);
const workspaceRoot = resolve(import.meta.dirname, "../../../..");
const jaguarHouseRoot = join(workspaceRoot, "artifacts/jaguar-house");
const chromiumPath = process.env.CHROMIUM_PATH ?? "/repl/tools/bin/chromium";

function assertIsolatedTestDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  assert.ok(
    parsed.protocol === "postgres:" || parsed.protocol === "postgresql:",
    "JAGUAR_TEST_DATABASE_URL must be a PostgreSQL URL.",
  );
  assert.match(
    decodeURIComponent(parsed.pathname.slice(1)),
    /(?:^|[_-])test(?:$|[_-])/i,
    "The isolated test database name must include 'test'.",
  );
  assert.notEqual(
    databaseUrl,
    process.env.DATABASE_URL,
    "JAGUAR_TEST_DATABASE_URL must not be the application's DATABASE_URL.",
  );
  if (process.env.DATABASE_URL) {
    const applicationDatabase = new URL(process.env.DATABASE_URL);
    assert.ok(
      parsed.host !== applicationDatabase.host ||
        decodeURIComponent(parsed.pathname) !== decodeURIComponent(applicationDatabase.pathname),
      "JAGUAR_TEST_DATABASE_URL must identify a different database from DATABASE_URL.",
    );
  }
  assert.notEqual(
    process.env.NODE_ENV,
    "production",
    "Staff workspace browser tests must not run in production mode.",
  );
}

async function listen(server: ReturnType<typeof createHttpServer> | ReturnType<typeof createHttpsServer>) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return (server.address() as AddressInfo).port;
}

async function closeServer(server: ReturnType<typeof createHttpServer> | ReturnType<typeof createHttpsServer>) {
  if (!server.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose());
  });
}

async function stopProcess(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit").then(() => undefined);
  child.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise<void>((resolveStop) => setTimeout(resolveStop, 5000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

async function waitForApp(child: ChildProcess, appUrl: string, output: string[]) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Staff workspace server exited early:\n${output.join("")}`);
    }
    try {
      const response = await fetch(`${appUrl}/staff`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {
      // The Next.js development server can take several seconds to compile.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 400));
  }
  throw new Error(`Staff workspace server did not become ready:\n${output.join("")}`);
}

async function tabUntilFocused(page: Page, selector: string, maxTabs = 80) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate((targetSelector) => {
      const activeElement = (globalThis as unknown as {
        document: { activeElement?: { matches?: (value: string) => boolean } | null };
      }).document.activeElement;
      return activeElement?.matches?.(targetSelector) ?? false;
    }, selector);
    if (focused) return true;
  }
  return false;
}

test("staff can open every workspace screen on phone and desktop after PIN login", {
  skip: !testDatabaseUrl
    ? "Set JAGUAR_TEST_DATABASE_URL to an isolated test database; DATABASE_URL is never used as a fallback."
    : false,
}, async () => {
  if (!testDatabaseUrl) return;
  assertIsolatedTestDatabase(testDatabaseUrl);
  assert.ok(existsSync(chromiumPath), `Chromium executable was not found at ${chromiumPath}. Set CHROMIUM_PATH to an installed browser.`);

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SESSION_SECRET = randomBytes(48).toString("hex");

  const [{ default: app }, { pool }, { privateKey }] = await Promise.all([
    import("../app"),
    import("@workspace/db"),
    import("../lib/loyalty-security"),
  ]);

  const certificateDirectory = mkdtempSync(join(tmpdir(), "jaguar-staff-e2e-"));
  const certificatePath = join(certificateDirectory, "local-ca.pem");
  const privateKeyPath = join(certificateDirectory, "local-key.pem");
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-keyout", privateKeyPath,
    "-out", certificatePath,
    "-subj", "/CN=127.0.0.1",
    "-addext", "subjectAltName=IP:127.0.0.1",
    "-addext", "basicConstraints=critical,CA:TRUE",
    "-addext", "keyUsage=critical,digitalSignature,keyEncipherment,keyCertSign",
  ], { stdio: "ignore" });
  let clientIp = "";
  const apiHandler = (request: IncomingMessage, response: ServerResponse) => {
    // The test-only external rewrite stands in for the app's same-origin /api proxy.
    // Preserve the real browser Origin while making the local API see that origin's host.
    if (typeof request.headers.origin === "string") {
      try {
        request.headers.host = new URL(request.headers.origin).host;
      } catch {
        // The API's own origin validation rejects malformed values.
      }
    }
    if (clientIp) request.headers["x-forwarded-for"] = clientIp;
    app(request, response);
  };
  const apiServer = createHttpsServer({
    key: readFileSync(privateKeyPath),
    cert: readFileSync(certificatePath),
  }, apiHandler);
  let nextServer: ChildProcess | null = null;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let originalPinHash: string | undefined;
  let pinSettingChanged = false;
  let apiPort = 0;
  const testPin = String(randomInt(1000, 10_000));
  const pinSalt = randomBytes(16).toString("hex");
  const newPinHash = (await deriveKey(testPin, pinSalt, 64) as Buffer).toString("hex");
  const nextOutput: string[] = [];

  try {
    const previousPin = await pool.query<{ value: string }>(
      "select value from jaguar_settings where key='staff_pin_hash'",
    );
    originalPinHash = previousPin.rows[0]?.value;
    await pool.query(
      `insert into jaguar_settings(key,value) values('staff_pin_hash',$1)
       on conflict(key) do update set value=excluded.value`,
      [`${pinSalt}:${newPinHash}`],
    );
    pinSettingChanged = true;

    apiPort = await listen(apiServer);
    clientIp = `198.51.100.${randomInt(1, 255)}`;

    const appPortProbe = createHttpServer();
    appPortProbe.listen(0, "127.0.0.1");
    await once(appPortProbe, "listening");
    const appPort = (appPortProbe.address() as AddressInfo).port;
    await closeServer(appPortProbe);
    const appUrl = `http://localhost:${appPort}`;
    const nextExecutable = join(jaguarHouseRoot, "node_modules/next/dist/bin/next");
    nextServer = spawn(process.execPath, [nextExecutable, "dev", "--hostname", "127.0.0.1", "--port", String(appPort)], {
      cwd: jaguarHouseRoot,
      env: {
        ...process.env,
        JAGUAR_API_ORIGIN: `https://127.0.0.1:${apiPort}`,
        NODE_EXTRA_CA_CERTS: [
          process.env.NODE_EXTRA_CA_CERTS,
          certificatePath,
        ].filter(Boolean).join(":"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    nextServer.stdout?.on("data", (chunk: Buffer) => nextOutput.push(chunk.toString()));
    nextServer.stderr?.on("data", (chunk: Buffer) => nextOutput.push(chunk.toString()));
    await waitForApp(nextServer, appUrl, nextOutput);

    browser = await chromium.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ["--no-sandbox", "--ignore-certificate-errors"],
    });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 390, height: 844 },
      extraHTTPHeaders: { "x-forwarded-for": clientIp },
    });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const screens = [
      { id: "counter", title: "เคาน์เตอร์ร้าน", action: "counter" },
      { id: "product-sales", title: "ขายสินค้า", action: "product-sales" },
      { id: "members", title: "สมาชิกทั้งหมด", action: "secondary" },
      { id: "open", title: "เปิดบัญชีสมาชิก", action: "secondary" },
      { id: "banking", title: "บัญชีรับเงินวันนี้", action: "secondary" },
      { id: "settings", title: "เปลี่ยน PIN พนักงาน", action: "secondary" },
    ] as const;

    for (const viewport of [
      { name: "phone", width: 390, height: 844 },
      { name: "desktop", width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      if (viewport.name === "phone") {
        await page.goto(`${appUrl}/staff`, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { name: "เข้าสู่ระบบพนักงาน" }).waitFor();
        await page.getByLabel("PIN พนักงาน").fill(testPin);
        await page.getByRole("button", { name: "เข้าสู่พื้นที่ทำงาน" }).click();
        await page.getByRole("navigation", { name: "เมนูหลักพนักงาน" }).waitFor();
      }
      await page.goto(`${appUrl}/staff`, { waitUntil: "domcontentloaded" });
      await page.getByRole("navigation", { name: "เมนูหลักพนักงาน" }).waitFor();
      await page.getByRole("heading", { name: "เคาน์เตอร์ร้าน" }).waitFor();

      const mainNav = page.getByRole("navigation", { name: "เมนูหลักพนักงาน" });
      const mainTabs = mainNav.getByRole("button");
      assert.equal(await mainTabs.count(), 3);
      for (let index = 0; index < await mainTabs.count(); index += 1) {
        const box = await mainTabs.nth(index).boundingBox();
        assert.ok(box && box.height >= 44, `${viewport.name}: main menu button ${index + 1} must remain touch reachable`);
      }

      for (const screen of screens) {
        if (screen.action === "counter") {
          await mainTabs.nth(0).click();
        } else if (screen.action === "product-sales") {
          await mainTabs.nth(1).click();
        } else {
          const moreButton = mainTabs.nth(2);
          if (await page.locator("#staff-secondary-tabs").count() === 0) await moreButton.click();
          const secondary = page.getByRole("navigation", { name: "เครื่องมือพนักงานอื่น" });
          await secondary.getByRole("button", { name: screen.title === "บัญชีรับเงินวันนี้" ? "บัญชี / โอน" :
            screen.title === "เปิดบัญชีสมาชิก" ? "เปิดบัญชี" :
              screen.title === "เปลี่ยน PIN พนักงาน" ? "ตั้งค่า PIN" : "สมาชิก", exact: true }).click();
        }

        if (screen.id === "product-sales") {
          await page.getByTestId("staff-product-sales").waitFor();
        } else {
          await page.getByRole("heading", { name: screen.title }).waitFor();
        }

        const dimensions = await page.evaluate(() => {
          const doc = (globalThis as unknown as {
            document: {
              documentElement: { clientWidth: number; scrollWidth: number };
              body: { scrollWidth: number };
            };
          }).document;
          return {
            viewportWidth: doc.documentElement.clientWidth,
            documentWidth: doc.documentElement.scrollWidth,
            bodyWidth: doc.body.scrollWidth,
          };
        });
        assert.ok(
          dimensions.documentWidth <= dimensions.viewportWidth &&
            dimensions.bodyWidth <= dimensions.viewportWidth,
          `${viewport.name} ${screen.id} has horizontal overflow: ${JSON.stringify(dimensions)}`,
        );

        const primaryButtons = page.locator("main button.btn-neon:visible");
        for (let index = 0; index < await primaryButtons.count(); index += 1) {
          const box = await primaryButtons.nth(index).boundingBox();
          assert.ok(box && box.width >= 44 && box.height >= 44,
            `${viewport.name} ${screen.id}: primary action ${index + 1} must be touch reachable`);
        }
      }

      // Open each menu using only native Tab and Enter navigation.
      const keyboardDestinations = [
        { selector: 'button[data-testid="staff-tab-product-sales"]', title: "ขายสินค้า" },
        { selector: "#staff-secondary-tabs button", title: "สมาชิกทั้งหมด", secondaryIndex: 0 },
        { selector: "#staff-secondary-tabs button", title: "เปิดบัญชีสมาชิก", secondaryIndex: 1 },
        { selector: "#staff-secondary-tabs button", title: "บัญชีรับเงินวันนี้", secondaryIndex: 2 },
        { selector: "#staff-secondary-tabs button", title: "เปลี่ยน PIN พนักงาน", secondaryIndex: 3 },
      ] as const;
      for (const destination of keyboardDestinations) {
        await page.goto(`${appUrl}/staff`, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { name: "เคาน์เตอร์ร้าน" }).waitFor();
        await page.evaluate(() => {
          const activeElement = (globalThis as unknown as {
            document: { activeElement?: { blur?: () => void } | null };
          }).document.activeElement;
          activeElement?.blur?.();
        });
        if ("secondaryIndex" in destination) {
          const reachedMore = await tabUntilFocused(page, 'button[aria-controls="staff-secondary-tabs"]');
          assert.ok(reachedMore, `${viewport.name}: keyboard navigation must reach the secondary staff menu`);
          await page.keyboard.press("Enter");
          for (let index = 0; index <= destination.secondaryIndex; index += 1) {
            await page.keyboard.press("Tab");
          }
        } else {
          const reachedTab = await tabUntilFocused(page, destination.selector);
          assert.ok(reachedTab, `${viewport.name}: keyboard navigation must reach ${destination.title}`);
        }
        await page.keyboard.press("Enter");
        if (destination.title === "ขายสินค้า") {
          await page.getByTestId("staff-product-sales").waitFor();
        } else {
          await page.getByRole("heading", { name: destination.title }).waitFor();
        }
      }
    }

    assert.deepEqual(pageErrors, [], "staff screens must not produce uncaught browser errors");
    await context.close();
  } finally {
    if (browser) await browser.close();
    if (nextServer) await stopProcess(nextServer);
    await closeServer(apiServer);

    if (pinSettingChanged) {
      if (originalPinHash === undefined) {
        await pool.query("delete from jaguar_settings where key='staff_pin_hash'");
      } else {
        await pool.query(
          `insert into jaguar_settings(key,value) values('staff_pin_hash',$1)
           on conflict(key) do update set value=excluded.value`,
          [originalPinHash],
        );
      }
    }

    if (clientIp) {
      const scopes = [
        `all:${privateKey(clientIp)}`,
        `staff-login:${privateKey(clientIp)}`,
        `staff-sale-products-read:${privateKey(clientIp)}`,
        `staff-product-sales-read:${privateKey(clientIp)}`,
        `staff-redemptions-recent-read:${privateKey(clientIp)}`,
        `staff-rewards-read:${privateKey(clientIp)}`,
      ];
      const hashes = scopes.map((key) => privateKey(`limit:${key}`));
      await pool.query("delete from jaguar_security_limits where key_hash = any($1::text[])", [hashes]);
    }
    await pool.end();
    rmSync(certificateDirectory, { recursive: true, force: true });
  }
});
