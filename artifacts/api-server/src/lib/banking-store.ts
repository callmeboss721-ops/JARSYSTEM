import { pool, type PoolClient } from "@workspace/db";
import { LoyaltyError } from "./loyalty-errors";
import { logger } from "./logger";

const MAX_MONEY_SATANG = 10_000_000_000;
const ACCOUNT_NUMBER_PATTERN = /^\d{6,20}$/;

type Role = "staff" | "owner";
type Direction = "in" | "out";
type AccountInput = {
  bank_name: string;
  account_number: string;
  account_holder: string;
  daily_limit: string;
};
type AccountUpdateInput = AccountInput & { is_active: boolean };

type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
};
type BankTransfer = {
  id: string;
  direction: Direction;
  amount: number;
  note: string;
  recorded_by: Role;
  created_at: string;
  corrected: boolean;
};
type BankToday = {
  business_date: string;
  account: BankAccount | null;
  received_total: number;
  sent_total: number;
  daily_limit: number | null;
  remaining_limit: number | null;
  over_limit: boolean;
  transfers: BankTransfer[];
};

function fail(status: number, message: string): never {
  throw new LoyaltyError(status, message);
}

function satang(value: string): number {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(value)) {
    return fail(400, "กรอกจำนวนเงินเป็นตัวเลข และทศนิยมไม่เกิน 2 ตำแหน่ง");
  }
  const [bahtPart, fractionPart = ""] = value.split(".");
  const amount = BigInt(bahtPart) * 100n + BigInt((fractionPart + "00").slice(0, 2));
  if (amount <= 0n || amount > BigInt(MAX_MONEY_SATANG)) {
    return fail(400, "จำนวนเงินต้องมากกว่า 0 และไม่เกิน 100 ล้านบาท");
  }
  return Number(amount);
}

function baht(value: string | number): number {
  return Number((Number(value) / 100).toFixed(2));
}

function normalizeAccount(input: AccountInput) {
  const accountNumber = input.account_number.replace(/[ -]/g, "");
  if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
    fail(400, "เลขบัญชีต้องมีตัวเลข 6–20 หลัก");
  }
  const bankName = input.bank_name.trim();
  const accountHolder = input.account_holder.trim();
  if (!bankName || !accountHolder) {
    fail(400, "กรุณาระบุธนาคารและชื่อบัญชี");
  }
  return {
    bankName,
    accountNumber,
    accountHolder,
    dailyLimitSatang: satang(input.daily_limit),
  };
}

async function startTransaction(client: PoolClient) {
  await client.query("begin");
  await client.query("set local statement_timeout = '8s'");
  await client.query("set local lock_timeout = '5s'");
}

async function todayDate(client: PoolClient): Promise<string> {
  const result = await client.query<{ business_date: string }>(
    "select (now() at time zone 'Asia/Bangkok')::date::text as business_date",
  );
  return result.rows[0].business_date;
}

async function lockBusinessDate(client: PoolClient, date: string) {
  await client.query("select pg_advisory_xact_lock(hashtext($1)::bigint)", [`jaguar-bank-day:${date}`]);
}

async function accountById(client: PoolClient, id: string, lock = false): Promise<BankAccount | null> {
  const row = (await client.query<{
    id: string;
    bank_name: string;
    account_number: string;
    account_holder: string;
    daily_limit_satang: string;
    is_active: boolean;
    created_at: string;
  }>(`select id,bank_name,account_number,account_holder,daily_limit_satang::text,
        is_active,created_at
      from jaguar_bank_accounts where id=$1${lock ? " for update" : ""}`, [id])).rows[0];
  return row ? {
    id: row.id,
    bank_name: row.bank_name,
    account_number: row.account_number,
    account_holder: row.account_holder,
    daily_limit: baht(row.daily_limit_satang),
    is_active: row.is_active,
    created_at: new Date(row.created_at).toISOString(),
  } : null;
}

async function loadToday(client: PoolClient, maxTransfers = 50): Promise<BankToday> {
  const businessDate = await todayDate(client);
  const selected = (await client.query<{
    id: string;
    bank_name: string;
    account_number: string;
    account_holder: string;
    daily_limit_satang: string;
    is_active: boolean;
    created_at: string;
  }>(`select a.id,a.bank_name,a.account_number,a.account_holder,a.daily_limit_satang::text,
        a.is_active,a.created_at
      from jaguar_daily_receiving_accounts d
      join jaguar_bank_accounts a on a.id=d.account_id
      where d.business_date=$1 and a.is_active=true`, [businessDate])).rows[0];
  const account: BankAccount | null = selected ? {
    id: selected.id,
    bank_name: selected.bank_name,
    account_number: selected.account_number,
    account_holder: selected.account_holder,
    daily_limit: baht(selected.daily_limit_satang),
    is_active: selected.is_active,
    created_at: new Date(selected.created_at).toISOString(),
  } : null;

  const totals = (await client.query<{
    received_satang: string;
    sent_satang: string;
  }>(`select
        coalesce(sum(amount_satang) filter (where direction='in'),0)::text as received_satang,
        coalesce(sum(amount_satang) filter (where direction='out'),0)::text as sent_satang
      from jaguar_bank_transfers
      where business_date=$1 and ($2::uuid is null or account_id=$2)`,
  [businessDate, account?.id ?? null])).rows[0];
  const receivedTotal = baht(totals.received_satang);
  const sentTotal = baht(totals.sent_satang);
  const transfers = (await client.query<{
    id: string;
    direction: Direction;
    amount_satang: string;
    note: string;
    recorded_by: Role;
    created_at: string;
    corrected: boolean;
  }>(`select t.id,t.direction,t.amount_satang::text,t.note,t.recorded_by,t.created_at,
        exists(select 1 from jaguar_transaction_corrections c
          where c.entity_type='bank_transfer' and c.entity_id=t.id) as corrected
      from jaguar_bank_transfers t
      where t.business_date=$1 and ($2::uuid is null or t.account_id=$2)
      order by t.created_at desc,t.id desc limit $3`,
  [businessDate, account?.id ?? null, maxTransfers])).rows.map((row) => ({
    id: row.id,
    direction: row.direction,
    amount: baht(row.amount_satang),
    note: row.note,
    recorded_by: row.recorded_by,
    created_at: new Date(row.created_at).toISOString(),
    corrected: row.corrected,
  }));
  const dailyLimit = account?.daily_limit ?? null;
  const remainingLimit = dailyLimit === null ? null : Number((dailyLimit - receivedTotal).toFixed(2));
  return {
    business_date: businessDate,
    account,
    received_total: receivedTotal,
    sent_total: sentTotal,
    daily_limit: dailyLimit,
    remaining_limit: remainingLimit,
    over_limit: dailyLimit !== null && receivedTotal > dailyLimit,
    transfers,
  };
}

function logStoreFailure(operation: string, error: unknown): never {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  logger.error({ operation, databaseCode: /^[A-Z0-9]{5}$/.test(code) ? code : undefined }, "Banking operation failed");
  if (code === "23503") fail(409, "ไม่พบบัญชีธนาคารที่เลือก");
  throw new LoyaltyError(503, "ข้อมูลบัญชีหรือรายการโอนไม่พร้อมใช้งาน กรุณาลองใหม่");
}

export async function getStaffBanking() {
  const client = await pool.connect();
  try {
    await client.query("begin isolation level repeatable read read only");
    await client.query("set local statement_timeout = '8s'");
    const today = await loadToday(client, 30);
    await client.query("commit");
    return { today };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("staff_banking_read", error);
  } finally {
    client.release();
  }
}

export async function getOwnerBanking() {
  const client = await pool.connect();
  try {
    await client.query("begin isolation level repeatable read read only");
    await client.query("set local statement_timeout = '8s'");
    const today = await loadToday(client, 50);
    const accounts = (await client.query<{
      id: string;
      bank_name: string;
      account_number: string;
      account_holder: string;
      daily_limit_satang: string;
      is_active: boolean;
      created_at: string;
    }>(`select id,bank_name,account_number,account_holder,daily_limit_satang::text,
          is_active,created_at
        from jaguar_bank_accounts order by is_active desc,created_at desc,id limit 100`)).rows.map((row) => ({
      id: row.id,
      bank_name: row.bank_name,
      account_number: row.account_number,
      account_holder: row.account_holder,
      daily_limit: baht(row.daily_limit_satang),
      is_active: row.is_active,
      created_at: new Date(row.created_at).toISOString(),
    }));
    await client.query("commit");
    return { accounts, today };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("owner_banking_read", error);
  } finally {
    client.release();
  }
}

export async function createBankAccount(input: AccountInput): Promise<BankAccount> {
  const account = normalizeAccount(input);
  const client = await pool.connect();
  try {
    await startTransaction(client);
    const row = (await client.query<{ id: string }>(`insert into jaguar_bank_accounts
      (bank_name,account_number,account_holder,daily_limit_satang)
      values($1,$2,$3,$4) returning id`,
    [account.bankName, account.accountNumber, account.accountHolder, String(account.dailyLimitSatang)])).rows[0];
    const created = await accountById(client, row.id);
    await client.query("commit");
    logger.info({ operation: "owner_bank_account_created", accountId: row.id }, "Bank account saved");
    if (!created) fail(503, "บันทึกบัญชีธนาคารไม่สำเร็จ");
    return created;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("owner_bank_account_create", error);
  } finally {
    client.release();
  }
}

export async function updateBankAccount(id: string, input: AccountUpdateInput): Promise<BankAccount> {
  const account = normalizeAccount(input);
  const client = await pool.connect();
  try {
    await startTransaction(client);
    const current = await accountById(client, id, true);
    if (!current) fail(404, "ไม่พบบัญชีธนาคาร");
    if (!input.is_active) {
      const date = await todayDate(client);
      const selected = (await client.query<{ account_id: string }>(
        "select account_id from jaguar_daily_receiving_accounts where business_date=$1 for update",
        [date],
      )).rows[0];
      if (selected?.account_id === id) fail(409, "บัญชีที่กำลังใช้รับเงินวันนี้ยังปิดไม่ได้");
    }
    await client.query(`update jaguar_bank_accounts set bank_name=$2,account_number=$3,
      account_holder=$4,daily_limit_satang=$5,is_active=$6,updated_at=now() where id=$1`,
    [id, account.bankName, account.accountNumber, account.accountHolder, String(account.dailyLimitSatang), input.is_active]);
    const updated = await accountById(client, id);
    await client.query("commit");
    logger.info({ operation: "owner_bank_account_updated", accountId: id }, "Bank account updated");
    if (!updated) fail(503, "ปรับปรุงบัญชีธนาคารไม่สำเร็จ");
    return updated;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("owner_bank_account_update", error);
  } finally {
    client.release();
  }
}

export async function selectBankAccountForToday(id: string) {
  const client = await pool.connect();
  try {
    await startTransaction(client);
    const date = await todayDate(client);
    await lockBusinessDate(client, date);
    const account = await accountById(client, id, true);
    if (!account) fail(404, "ไม่พบบัญชีธนาคาร");
    if (!account.is_active) fail(409, "เปิดบัญชีใช้งานก่อนเลือกบัญชีรับเงินวันนี้");
    const current = (await client.query<{ account_id: string }>(
      "select account_id from jaguar_daily_receiving_accounts where business_date=$1 for update",
      [date],
    )).rows[0];
    if (current?.account_id !== id) {
      const used = (await client.query(
        "select 1 from jaguar_bank_transfers where business_date=$1 limit 1",
        [date],
      )).rowCount;
      if (used) fail(409, "วันนี้มีรายการบันทึกแล้ว จึงเปลี่ยนบัญชีรับเงินไม่ได้");
    }
    await client.query(`insert into jaguar_daily_receiving_accounts(business_date,account_id,selected_by,selected_at)
      values($1,$2,'owner',now())
      on conflict(business_date) do update set account_id=excluded.account_id,
        selected_by=excluded.selected_by,selected_at=excluded.selected_at`,
    [date, id]);
    await client.query("commit");
    logger.info({ operation: "owner_bank_account_selected", accountId: id, businessDate: date }, "Today's receiving account selected");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("owner_bank_account_select", error);
  } finally {
    client.release();
  }
  return getOwnerBanking();
}

export async function recordBankTransfer(input: {
  direction: Direction;
  amount: string;
  note?: string;
  request_id: string;
}, role: Role) {
  const amountSatang = satang(input.amount);
  const note = (input.note ?? "").trim();
  if (note.length > 160) fail(400, "หมายเหตุยาวเกินไป");
  const client = await pool.connect();
  try {
    await startTransaction(client);
    const date = await todayDate(client);
    await lockBusinessDate(client, date);
    const assignment = (await client.query<{ account_id: string }>(`select d.account_id
      from jaguar_daily_receiving_accounts d
      join jaguar_bank_accounts a on a.id=d.account_id and a.is_active=true
      where d.business_date=$1 for share of d,a`, [date])).rows[0];
    if (!assignment) fail(409, "เจ้าของร้านยังไม่ได้เลือกบัญชีรับเงินของวันนี้");
    const prior = (await client.query<{
      id: string;
      account_id: string;
      direction: Direction;
      amount_satang: string;
    }>("select id,account_id,direction,amount_satang::text from jaguar_bank_transfers where request_id=$1", [input.request_id])).rows[0];
    if (prior) {
      if (prior.account_id !== assignment.account_id || prior.direction !== input.direction ||
          Number(prior.amount_satang) !== amountSatang) {
        fail(409, "รหัสรายการนี้ถูกใช้กับข้อมูลอื่นแล้ว");
      }
    } else {
      await client.query(`insert into jaguar_bank_transfers
        (request_id,account_id,business_date,direction,amount_satang,note,recorded_by)
        values($1,$2,$3,$4,$5,$6,$7)`,
      [input.request_id, assignment.account_id, date, input.direction, String(amountSatang), note, role]);
    }
    const today = await loadToday(client, 30);
    await client.query("commit");
    if (!prior) logger.info({ operation: "bank_transfer_recorded", direction: input.direction, role }, "Bank transfer recorded");
    return { today };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    logStoreFailure("bank_transfer_record", error);
  } finally {
    client.release();
  }
}

export async function correctStaffBankTransfer(
  id: string,
  input: { direction: Direction; amount: string; note?: string; reason: string },
) {
  const amountSatang = satang(input.amount);
  const note = (input.note ?? "").trim();
  const reason = input.reason.normalize("NFC").trim();
  if (note.length > 160) fail(400, "หมายเหตุยาวเกินไป");
  if (Array.from(reason).length < 3 || Array.from(reason).length > 200 || /[\u0000-\u001f\u007f]/.test(reason)) {
    fail(400, "ระบุเหตุผลการแก้ไข 3–200 ตัวอักษร");
  }

  const client = await pool.connect();
  try {
    await startTransaction(client);
    const date = await todayDate(client);
    await lockBusinessDate(client, date);
    const transfer = (await client.query<{
      id: string;
      account_id: string;
      business_date: string;
      direction: Direction;
      amount_satang: string;
      note: string;
      is_today: boolean;
    }>(
      `select id,account_id,business_date,direction,amount_satang::text,note,
        (business_date=$2) as is_today
       from jaguar_bank_transfers where id=$1 for update`,
      [id, date],
    )).rows[0];
    if (!transfer) fail(404, "ไม่พบรายการโอนที่ต้องการแก้ไข");
    if (!transfer.is_today) fail(409, "แก้ไขได้เฉพาะรายการโอนของวันนี้");

    const before = {
      direction: transfer.direction,
      amount: baht(transfer.amount_satang),
      note: transfer.note,
    };
    const after = {
      direction: input.direction,
      amount: baht(amountSatang),
      note,
    };
    await client.query(
      `update jaguar_bank_transfers set direction=$2,amount_satang=$3,note=$4
       where id=$1`,
      [id, input.direction, String(amountSatang), note],
    );
    await client.query(
      `insert into jaguar_transaction_corrections
        (entity_type,entity_id,reason,before_data,after_data,corrected_by)
       values('bank_transfer',$1,$2,$3::jsonb,$4::jsonb,'staff')`,
      [id, reason, JSON.stringify(before), JSON.stringify(after)],
    );
    const today = await loadToday(client, 30);
    await client.query("commit");
    logger.info({ operation: "staff_bank_transfer_corrected", transferId: id }, "Bank transfer corrected");
    return { today };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    if (error instanceof LoyaltyError) throw error;
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    logger.error({ operation: "staff_bank_transfer_correction", databaseCode: /^[A-Z0-9]{5}$/.test(code) ? code : undefined }, "Bank transfer correction failed");
    throw new LoyaltyError(503, "บันทึกการแก้ไขรายการโอนไม่ได้ กรุณาลองใหม่");
  } finally {
    client.release();
  }
}
