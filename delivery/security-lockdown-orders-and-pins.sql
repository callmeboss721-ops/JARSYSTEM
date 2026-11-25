-- ============================================================================
-- JAGUAR SPK Delivery — Full RLS Lockdown for dt_orders & dt_settings (DRAFT)
-- Project: sfoenreulwqulfofotcp
-- STATUS: รอเจ้าของ (Tony) อนุมัติ และต้องอัปเดต delivery/{index,rider,dashboard}.html
--         ให้เรียก RPC ชุดนี้ก่อนรันส่วนที่ 3 (DROP public SELECT/UPDATE บน dt_orders)
--         ส่วนเว็บ project28987.websitepublisher.ai ใช้เฉพาะ INSERT (Prefer: return=minimal)
--         จึงไม่ได้รับผลกระทบจากการปิด public SELECT บน dt_orders
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- ส่วนที่ 1: ซ่อน rider_pin / admin_pin ใน dt_settings + ตรวจรหัสผ่าน RPC
-- (ปลอดภัยต่อ project28987 ทันที และ delivery/rider.html + dashboard.html รองรับ verify_dt_pin อยู่แล้ว)
-- ============================================================================

create or replace function public.verify_dt_pin(p_role text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
  v_stored text;
begin
  if p_pin is null or length(trim(p_pin)) < 4 or length(trim(p_pin)) > 32 then
    return false;
  end if;

  if p_role = 'rider' then
    v_key := 'rider_pin';
  elsif p_role = 'admin' then
    v_key := 'admin_pin';
  else
    return false;
  end if;

  select value into v_stored
  from public.dt_settings
  where key = v_key
  limit 1;

  if v_stored is null or length(v_stored) = 0 then
    return false;
  end if;

  if v_stored ~ '^\$2[aby]\$' then
    return extensions.crypt(trim(p_pin), v_stored) = v_stored;
  end if;

  return extensions.digest(trim(p_pin), 'sha256') = extensions.digest(v_stored, 'sha256');
end;
$$;

revoke all on function public.verify_dt_pin(text, text) from public;
grant execute on function public.verify_dt_pin(text, text) to anon, authenticated;

-- ซ่อนแถว rider_pin และ admin_pin ไม่ให้ anon อ่านได้จาก dt_settings
-- หมายเหตุ: ตรวจชื่อ policy SELECT เดิมใน pg_policies ก่อนลบ แล้วเปิดเฉพาะ policy กรองคีย์ด้านล่าง
-- drop policy if exists "<ชื่อ policy เดิมที่เปิด using (true)>" on public.dt_settings;
drop policy if exists "dt_settings_public_read_non_secret" on public.dt_settings;
create policy "dt_settings_public_read_non_secret"
  on public.dt_settings
  for select
  to anon, authenticated
  using (key not in ('rider_pin', 'admin_pin'));

-- ============================================================================
-- ส่วนที่ 2: RPC สำหรับอ่าน/อัปเดต dt_orders โดยไม่ต้องเปิด public SELECT ทั้งตาราง
-- ============================================================================

-- 2.1 สำหรับลูกค้าหน้าติดตามสถานะ (delivery/index.html): คืนเฉพาะสถานะและยอด ไม่คืนเบอร์โทร/ที่อยู่เต็ม
create or replace function public.track_dt_order(p_order_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  if p_order_code is null or length(trim(p_order_code)) < 4 then
    return null;
  end if;

  select jsonb_build_object(
    'order_code', o.order_code,
    'order_status', o.order_status,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'items', o.items,
    'items_total', o.items_total,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'lat', o.lat,
    'lng', o.lng,
    'created_at', o.created_at,
    'confirmed_at', o.confirmed_at,
    'pickup_at', o.pickup_at,
    'delivering_at', o.delivering_at,
    'done_at', o.done_at
  )
  into v_res
  from public.dt_orders o
  where upper(o.order_code) = upper(trim(p_order_code))
  limit 1;

  return v_res;
end;
$$;

revoke all on function public.track_dt_order(text) from public;
grant execute on function public.track_dt_order(text) to anon, authenticated;

-- 2.2 สำหรับไรเดอร์และแอดมิน (rider.html / dashboard.html): ต้องส่ง PIN ที่ผ่าน verify_dt_pin ทุกครั้ง
create or replace function public.list_dt_orders_for_staff(
  p_role text,
  p_pin text,
  p_since timestamptz default null,
  p_limit integer default 200
)
returns setof public.dt_orders
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_dt_pin(p_role, p_pin) then
    raise exception 'UNAUTHORIZED_PIN' using errcode = '42501';
  end if;

  return query
  select *
  from public.dt_orders o
  where (p_since is null or o.created_at >= p_since)
  order by o.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;

revoke all on function public.list_dt_orders_for_staff(text, text, timestamptz, integer) from public;
grant execute on function public.list_dt_orders_for_staff(text, text, timestamptz, integer) to anon, authenticated;

-- 2.3 สำหรับไรเดอร์/แอดมินอัปเดตสถานะออเดอร์โดยตรวจ PIN ฝั่งเซิร์ฟเวอร์
create or replace function public.update_dt_order_status_for_staff(
  p_role text,
  p_pin text,
  p_order_code text,
  p_action text
)
returns public.dt_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.dt_orders;
begin
  if not public.verify_dt_pin(p_role, p_pin) then
    raise exception 'UNAUTHORIZED_PIN' using errcode = '42501';
  end if;

  update public.dt_orders o
  set
    order_status = case p_action
      when 'confirm_paid' then 'confirmed'
      when 'pickup' then 'pickup'
      when 'delivering' then 'delivering'
      when 'done' then 'done'
      when 'cancelled' then 'cancelled'
      else o.order_status
    end,
    payment_status = case
      when p_action in ('confirm_paid', 'pickup') then 'confirmed'
      else o.payment_status
    end,
    confirmed_at = case when p_action = 'confirm_paid' then v_now else o.confirmed_at end,
    pickup_at = case when p_action = 'pickup' then v_now else o.pickup_at end,
    delivering_at = case when p_action = 'delivering' then v_now else o.delivering_at end,
    done_at = case when p_action = 'done' then v_now else o.done_at end,
    cancelled_at = case when p_action = 'cancelled' then v_now else o.cancelled_at end
  where o.order_code = p_order_code
  returning * into v_row;

  if v_row.id is null then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke all on function public.update_dt_order_status_for_staff(text, text, text, text) from public;
grant execute on function public.update_dt_order_status_for_staff(text, text, text, text) to anon, authenticated;

-- ============================================================================
-- ส่วนที่ 3: ปิด Public SELECT / UPDATE บน dt_orders (รันหลังอัปเดต delivery/*.html เท่านั้น!)
-- คงไว้เฉพาะ INSERT สำหรับ anon เพื่อให้หน้าสั่งซื้อส่งออเดอร์ใหม่ได้ตามปกติ
-- ============================================================================
-- DO $$
-- DECLARE pol record;
-- BEGIN
--   FOR pol IN
--     SELECT policyname FROM pg_policies
--     WHERE schemaname = 'public' AND tablename = 'dt_orders' AND cmd IN ('SELECT', 'UPDATE', 'DELETE', 'ALL')
--   LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON public.dt_orders', pol.policyname);
--   END LOOP;
-- END $$;
