// Vercel Serverless — Form Submission Telegram Notification
// POST /api/notify  { name, phone, email, concept, note }

const TG_TOKEN   = process.env.TG_TOKEN || '8291549472:AAHEH4vRW1P_OdHaBWgY97jkOBY99OHpMzk';
const TG_CHAT    = process.env.TG_CHAT  || '-1003727920075';
const SHEET_URL  = 'https://script.google.com/macros/s/AKfycbxIdmFwATxd_Awx10eQUWwD7g2cUa3Wu4QSSuDhXrplhZo_0vUqSQ0JKo391UltU0gi/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { name = '', phone = '', email = '', concept = '', note = '', slotLabel = '' } = req.body || {};

    const msg = [
      '🌸 <b>LEAD MỚI — DAISY CONCEPT</b>',
      '',
      `👤 Khách hàng: ${name}`,
      `📞 SĐT: ${phone}`,
      `📧 Email: ${email}`,
      `🎨 Concept: ${concept || 'Chưa chọn'}`,
      slotLabel ? `📅 Slot mong muốn: ${slotLabel}` : null,
      `⏳ Đang chờ thanh toán cọc...`,
      `🔍 Nội dung CK: <code>DAISY DAT LICH ${name.toUpperCase()}</code>`,
    ].filter(Boolean).join('\n');

    const tgRes  = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, message_thread_id: 29, text: msg, parse_mode: 'HTML' }),
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('[Telegram Error]', JSON.stringify(tgData));
    } else {
      console.log('[Telegram OK] Đã gửi tin cho chat_id:', TG_CHAT);
    }

    // Lưu lead vào Google Sheet để webhook SePay tra cứu tên + concept
    try {
      const nameKey = name.toUpperCase().trim();
      const params  = new URLSearchParams({
        action:     'saveLead',
        nameKey,
        properName: name,
        concept:    concept || '',
        phone:      phone   || '',
        email:      email   || '',
        slotLabel:  slotLabel || '',
      });
      await fetch(`${SHEET_URL}?${params.toString()}`, { redirect: 'follow' });
      console.log('[Lead Saved]', nameKey);
    } catch (sheetErr) {
      console.error('[Sheet Error]', sheetErr.message);
    }

    return res.status(200).json({ success: true, telegram: tgData.ok });
  } catch (err) {
    console.error('[Notify Error]', err);
    return res.status(500).json({ success: false });
  }
}
