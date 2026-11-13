import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// dt-notify: ส่งออเดอร์ที่ยังไม่ได้ส่งเข้ากลุ่ม Telegram (batch ทุก 20 นาที ผ่าน pg_cron)
// Env secrets (ตั้งผ่าน Supabase Dashboard > Edge Functions > Secrets หรือ CLI):
//   TELEGRAM_BOT_TOKEN - token จาก @BotFather
//   TELEGRAM_CHAT_ID   - chat id ของกลุ่ม (เชิญบอทเข้ากลุ่มก่อน)

const STATUS_TH = {
  new: 'รอยืนยันชำระเงิน',
  confirmed: 'ยืนยันชำระเงินแล้ว',
  pickup: 'ไรเดอร์รับแล้ว',
  delivering: 'กำลังจัดส่ง',
  done: 'ส่งสำเร็จ',
  cancelled: 'ยกเลิก'
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const admin = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    const headers = { Authorization: `Bearer ${admin}`, apikey: admin, 'Content-Type': 'application/json' };

    // 1) ดึงออเดอร์ที่ยังไม่ส่ง (ทุกสถานะที่ไม่ใช่ cancelled)
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

    // 2) ถ้ายังไม่ตั้งค่า Telegram ให้รายงานแบบ honest และไม่ mark ว่าส่งแล้ว
    if (!token || !chatId) {
      return new Response(JSON.stringify({
        status: 'skipped_no_telegram_config',
        pending: orders.length,
        hint: 'ตั้งค่า secrets TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID แล้วรอบถัดไปจะส่งอัตโนมัติ'
      }), { headers: cors });
    }

    // 3) ส่งทีละออเดอร์
    let sent = 0;
    const failed = [];
    for (const o of orders) {
      const items = (o.items || []).map((it: any) => `• ${it.name} × ${it.qty} = ${Number(it.price * it.qty).toFixed(0)} บาท`).join('\n');
      const mapLink = o.lat && o.lng ? `https://www.google.com/maps?q=${o.lat},${o.lng}` : 'ไม่มีพิกัด';
      const pay = o.payment_method === 'bank' ? 'โอนเข้าบัญชี' : 'PromptPay';
      const text =
        `🛵 ออเดอร์ใหม่ ${esc(o.order_code)}\n` +
        `👤 ${esc(o.customer_name)} (${esc(o.customer_phone)})\n` +
        `📍 ${esc(o.address)}\n` +
        `🗺 แผนที่: ${mapLink}\n` +
        `────────────\n${items}\n` +
        `ค่าสินค้า ${Number(o.items_total).toFixed(2)} + ส่ง ${Number(o.delivery_fee ?? 0).toFixed(2)}\n` +
        `💰 ยอดรวม ${Number(o.total).toFixed(2)} บาท (${pay})\n` +
        `สถานะ: ${STATUS_TH[o.order_status] || o.order_status}`;

      const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
      });
      if (tg.ok) {
        sent++;
        await fetch(`${supabaseUrl}/rest/v1/dt_orders?id=eq.${o.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ sent_to_telegram: true, sent_at: new Date().toISOString() })
        });
      } else {
        failed.push({ code: o.order_code, detail: (await tg.text()).slice(0, 200) });
      }
    }

    return new Response(JSON.stringify({ status: 'ok', pending: orders.length, sent, failed }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
