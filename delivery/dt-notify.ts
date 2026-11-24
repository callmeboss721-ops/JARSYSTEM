import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// dt-notify: ส่งออเดอร์ใหม่เข้ากลุ่ม LINE Messaging API และ/หรือ Telegram อัตโนมัติ
// Env secrets (ตั้งผ่าน Supabase Dashboard > Edge Functions > Secrets):
//   LINE_CHANNEL_ACCESS_TOKEN - Channel Access Token จาก LINE Developers (Messaging API)
//   LINE_TARGET_ID            - User ID หรือ Group ID ของร้าน/กลุ่มไรเดอร์ใน LINE
//   TELEGRAM_BOT_TOKEN        - (ไม่บังคับ) token จาก @BotFather
//   TELEGRAM_CHAT_ID          - (ไม่บังคับ) chat id ของกลุ่ม Telegram

const STATUS_TH: Record<string, string> = {
  new: 'รอยืนยันชำระเงิน',
  confirmed: 'ยืนยันชำระเงินแล้ว',
  pickup: 'ไรเดอร์รับแล้ว',
  delivering: 'กำลังจัดส่ง',
  done: 'ส่งสำเร็จ',
  cancelled: 'ยกเลิก'
};

function clean(s: unknown) {
  return String(s ?? '').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const admin = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const tgChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const lineToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    const lineTargetId = Deno.env.get('LINE_TARGET_ID');

    const hasTelegram = Boolean(tgToken && tgChatId);
    const hasLine = Boolean(lineToken && lineTargetId);
    const headers = { Authorization: `Bearer ${admin}`, apikey: admin, 'Content-Type': 'application/json' };

    const q = await fetch(
      `${supabaseUrl}/rest/v1/dt_orders?sent_to_telegram=eq.false&order_status=neq.cancelled&order=created_at.asc&select=*`,
      { headers }
    );
    if (!q.ok) {
      return new Response(JSON.stringify({ error: 'db_read_failed', detail: await q.text() }), { status: 500, headers: cors });
    }
    const orders = await q.json();

    if (!orders.length) {
      return new Response(JSON.stringify({ status: 'nothing_to_send', sent: 0 }), { headers: cors });
    }

    if (!hasTelegram && !hasLine) {
      return new Response(JSON.stringify({
        status: 'skipped_no_notification_config',
        pending: orders.length,
        hint: 'ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN + LINE_TARGET_ID หรือ TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID ใน Supabase Secrets'
      }), { headers: cors });
    }

    let sent = 0;
    const failed: Array<{ code: string; channel: string; detail: string }> = [];

    for (const o of orders) {
      const items = (o.items || []).map((it: { name: string; qty: number; price: number }) =>
        `• ${it.name} × ${it.qty} = ${Number(it.price * it.qty).toFixed(0)} บาท`
      ).join('\n');
      const mapLink = o.lat && o.lng ? `https://www.google.com/maps?q=${o.lat},${o.lng}` : 'ไม่มีพิกัด';
      const pay = o.payment_method === 'bank' ? 'โอนเข้าบัญชี' : 'PromptPay QR';
      const text =
        `🛵 ออเดอร์ใหม่ ${clean(o.order_code)}\n` +
        `👤 ${clean(o.customer_name)} (${clean(o.customer_phone)})\n` +
        `📍 ${clean(o.address)}\n` +
        `🗺 แผนที่: ${mapLink}\n` +
        `────────────\n${items}\n` +
        `ค่าสินค้า ${Number(o.items_total).toFixed(2)} + ส่ง ${Number(o.delivery_fee ?? 0).toFixed(2)}\n` +
        `💰 ยอดรวม ${Number(o.total).toFixed(2)} บาท (${pay})\n` +
        `สถานะ: ${STATUS_TH[o.order_status] || o.order_status}`;

      let deliveredAny = false;

      if (hasLine) {
        const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${lineToken}`,
          },
          body: JSON.stringify({
            to: lineTargetId,
            messages: [{ type: 'text', text }],
          }),
        });
        if (lineRes.ok) deliveredAny = true;
        else failed.push({ code: o.order_code, channel: 'line', detail: (await lineRes.text()).slice(0, 200) });
      }

      if (hasTelegram) {
        const tg = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text, disable_web_page_preview: true }),
        });
        if (tg.ok) deliveredAny = true;
        else failed.push({ code: o.order_code, channel: 'telegram', detail: (await tg.text()).slice(0, 200) });
      }

      if (deliveredAny) {
        sent++;
        await fetch(`${supabaseUrl}/rest/v1/dt_orders?id=eq.${o.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ sent_to_telegram: true, sent_at: new Date().toISOString() }),
        });
      }
    }

    return new Response(JSON.stringify({ status: 'ok', pending: orders.length, sent, failed }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
