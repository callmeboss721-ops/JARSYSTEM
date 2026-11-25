-- ============================================================================
-- JAGUAR SPK — Autopilot Realtime Trigger: dt_orders INSERT -> Composio -> Telegram
-- Project: sfoenreulwqulfofotcp
-- ทำงานอัตโนมัติ 24 ชม. ทันทีที่มีแถวใหม่เข้า public.dt_orders โดยใช้ pg_net ยิงเข้า
-- Composio Webhook Trigger (ซึ่งผูก Action TELEGRAM_SEND_MESSAGE ไปยังกลุ่มร้าน)
-- ============================================================================

create extension if not exists pg_net;

-- 1. ตั้งค่า URL ของ Composio Webhook ใน dt_settings (ซ่อนจาก anon ด้วย RLS)
-- แทนที่ <COMPOSIO_WEBHOOK_URL> ด้วย Webhook URL จริงจาก Composio Trigger/Workflow:
-- insert into public.dt_settings(key, value)
-- values ('composio_webhook_url', 'https://backend.composio.dev/api/v1/triggers/webhook/<YOUR_TRIGGER_ID>')
-- on conflict (key) do update set value = excluded.value;

-- 2. Trigger Function สร้างข้อความภาษาไทยพร้อมส่งเข้า Telegram และยิง HTTP POST แบบ async
create or replace function public.trg_dt_orders_notify_composio()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_webhook text;
  v_pay_label text;
  v_map_link text;
  v_items_text text := '';
  v_elem jsonb;
  v_msg text;
begin
  select value into v_webhook
  from public.dt_settings
  where key = 'composio_webhook_url'
  limit 1;

  if v_webhook is null or length(trim(v_webhook)) = 0 then
    return new;
  end if;

  v_pay_label := case new.payment_method
    when 'cod' then 'เก็บเงินปลายทาง (COD)'
    when 'transfer' then 'โอนเงิน/พร้อมเพย์'
    when 'bank' then 'โอนเข้าบัญชี'
    when 'promptpay' then 'PromptPay QR'
    else coalesce(new.payment_method, '-')
  end;

  v_map_link := case
    when new.lat is not null and new.lng is not null
      then 'https://www.google.com/maps?q=' || new.lat::text || ',' || new.lng::text
    else 'ไม่ได้ปักหมุด'
  end;

  if jsonb_typeof(to_jsonb(new.items)) = 'array' then
    for v_elem in select * from jsonb_array_elements(to_jsonb(new.items))
    loop
      if jsonb_typeof(v_elem) = 'string' then
        v_items_text := v_items_text || '• ' || trim(both '"' from v_elem::text) || E'\n';
      else
        v_items_text := v_items_text || '• ' || coalesce(v_elem->>'name', '-') ||
          ' × ' || coalesce(v_elem->>'qty', '1') || E'\n';
      end if;
    end loop;
  end if;

  v_msg :=
    '🛵 ออเดอร์ใหม่ ' || coalesce(new.order_code, '-') || E'\n' ||
    '👤 ' || coalesce(new.customer_name, '-') || ' (' || coalesce(new.customer_phone, '-') || ')' || E'\n' ||
    '📍 ' || coalesce(new.address, '-') || E'\n' ||
    '🗺 แผนที่: ' || v_map_link || E'\n' ||
    '────────────' || E'\n' ||
    v_items_text ||
    '💰 ยอดสินค้า ' || coalesce(new.total, 0)::numeric(10,2)::text || ' บาท (' || v_pay_label || ')';

  perform net.http_post(
    url := trim(v_webhook),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'event', 'dt_orders.insert',
      'text', v_msg,
      'order_code', new.order_code,
      'customer_name', new.customer_name,
      'customer_phone', new.customer_phone,
      'address', new.address,
      'map_url', v_map_link,
      'items', new.items,
      'total', new.total,
      'payment_method', new.payment_method,
      'payment_label', v_pay_label,
      'order_status', new.order_status,
      'created_at', new.created_at
    )
  );

  return new;
exception
  when others then
    -- ห้ามให้ความผิดพลาดของ webhook ทำให้ออเดอร์ของลูกค้าบันทึกไม่สำเร็จ
    return new;
end;
$$;

drop trigger if exists dt_orders_after_insert_composio on public.dt_orders;
create trigger dt_orders_after_insert_composio
  after insert on public.dt_orders
  for each row
  execute function public.trg_dt_orders_notify_composio();
