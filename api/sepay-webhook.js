// Vercel Serverless — SePay Webhook + Telegram Notification
// POST /api/sepay-webhook

const TG_TOKEN  = process.env.TG_TOKEN || '8291549472:AAHEH4vRW1P_OdHaBWgY97jkOBY99OHpMzk';
const TG_CHAT   = process.env.TG_CHAT  || '-1003727920075';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxIdmFwATxd_Awx10eQUWwD7g2cUa3Wu4QSSuDhXrplhZo_0vUqSQ0JKo391UltU0gi/exec';

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, message_thread_id: 4, text, parse_mode: 'HTML' })
  });
}

function formatMoney(n) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

function formatDate(str) {
  // SePay trả về "2026-05-22 10:49:39" → "22-05-2026 | 10:49:39"
  if (!str) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2,'0');
    const m = String(now.getMonth()+1).padStart(2,'0');
    const y = now.getFullYear();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    return `${d}-${m}-${y} | ${hh}:${mm}:${ss}`;
  }
  const [datePart, timePart] = str.split(' ');
  const [y, m, d] = datePart.split('-');
  return `${d}-${m}-${y} | ${timePart}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = req.body;
    console.log('[SePay Webhook]', JSON.stringify(body));

    // Chỉ xử lý tiền VÀO
    if (!body || body.transferType !== 'in') {
      return res.status(200).json({ success: true, note: 'ignored' });
    }

    const {
      content        = '',
      transferAmount = 0,
      referenceCode  = '',
      bankAccountNumber = '',
      transactionDate   = '',
      accumulated       = 0,
    } = body;

    const isDaisy  = content.toUpperCase().includes('DAISY DAT LICH');
    const isCoc    = Number(transferAmount) >= 5000;

    if (isDaisy && isCoc) {
      // Trích tên khách từ nội dung chuyển khoản (dùng làm key tra cứu)
      const nameKey  = content.toUpperCase().replace('DAISY DAT LICH', '').trim() || 'KHÁCH';

      // Tra cứu tên đúng format + concept từ Google Sheet
      let properName = nameKey;
      let concept    = '';
      try {
        const r = await fetch(
          `${SHEET_URL}?action=getLead&nameKey=${encodeURIComponent(nameKey)}`,
          { redirect: 'follow' }
        );
        const d = await r.json();
        if (d.lead) {
          properName = d.lead.properName || nameKey;
          concept    = d.lead.concept    || '';
        }
        console.log('[Lead Lookup]', nameKey, '→', properName, concept);
      } catch (e) {
        console.error('[Lead Lookup Error]', e.message);
      }

      const msg = [
        '🎉 <b>ĐẶT CỌC MỚI — DAISY CONCEPT</b>',
        '',
        `👤 Khách hàng: ${properName}`,
        `💰 Tiền cọc: ${formatMoney(transferAmount)}`,
        `🏦 Bank: TP Bank · 00000542290`,
        `🔖 Mã GD: ${referenceCode}`,
        `📅 Thời gian cọc: ${formatDate(transactionDate)}`,
        `🎨 Concept: ${concept || 'Chưa rõ'}`,
        '',
        '✅ Ekip liên hệ khách xác nhận lịch ngay nhé!',
      ].join('\n');

      await sendTelegram(msg);
      console.log('[DAISY] Thanh toán OK →', properName, formatMoney(transferAmount));
    } else {
      // Giao dịch khác vào tài khoản — thông báo ngắn
      const msg = [
        '💳 <b>Giao dịch mới (không phải đặt cọc)</b>',
        `Nội dung: ${content}`,
        `Số tiền: ${formatMoney(transferAmount)}`,
        `Mã GD: ${referenceCode}`,
      ].join('\n');
      await sendTelegram(msg);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Webhook Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
