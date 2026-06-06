// Vercel Serverless — Gửi email xác nhận đặt lịch cho khách
// POST /api/send-confirmation { name, email, phone, concept, note }

const RESEND_KEY    = process.env.RESEND_KEY    || 're_9wadQVF1_EdfuXvstupWcbNWLe1MZGLek';
const FROM_EMAIL    = 'Daisy Concept <onboarding@resend.dev>';
const TG_TOKEN      = process.env.TG_TOKEN      || '8291549472:AAHEH4vRW1P_OdHaBWgY97jkOBY99OHpMzk';
const TG_CHAT       = process.env.TG_CHAT       || '-1003727920075';
// Dùng cùng URL với notify.js — nhanh, đã chứng minh hoạt động
const SHEET_WEBHOOK = process.env.SHEET_WEBHOOK || 'https://script.google.com/macros/s/AKfycbxIdmFwATxd_Awx10eQUWwD7g2cUa3Wu4QSSuDhXrplhZo_0vUqSQ0JKo391UltU0gi/exec';

function emailHtml(name, phone, concept) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Xác nhận đặt lịch — Daisy Concept</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:28px 32px;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:.06em;color:#ffffff;margin:0;text-transform:uppercase;">DAISY CONCEPT</p>
          <p style="font-size:13px;color:rgba(255,255,255,.5);margin:4px 0 0;">Gạo Nâu Chụp Ảnh · Studio kể chuyện bằng ánh sáng</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:#141414;padding:28px 32px;border-bottom:1px solid #222;">
          <p style="font-size:28px;margin:0 0 8px;">✅</p>
          <p style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 6px;">Đặt cọc thành công!</p>
          <p style="font-size:14px;color:rgba(255,255,255,.6);margin:0;line-height:1.6;">
            Xin chào <strong style="color:#fff;">${name}</strong>, ekip Gạo Nâu đã nhận được cọc của bạn và sẽ liên hệ xác nhận lịch trong <strong style="color:#fff;">2 tiếng</strong>.
          </p>
        </td></tr>

        <!-- Booking info -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;">
          <p style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#999;margin:0 0 16px;">Thông tin đặt lịch</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-size:13px;color:#999;">Họ tên</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-size:13px;color:#999;">Số điện thoại</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${phone}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="font-size:13px;color:#999;">Concept</span>
              </td>
              <td style="padding:8px 0;text-align:right;">
                <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${concept || 'Chưa chọn — sẽ tư vấn thêm'}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Prepare -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;">
          <p style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#999;margin:0 0 16px;">Chuẩn bị trước buổi chụp</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;">
              <p style="font-size:13px;color:#333;margin:0;">💆 <strong>Thư giãn</strong> — Ekip sẽ đắp mặt nạ &amp; massage chân trước khi chụp</p>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <p style="font-size:13px;color:#333;margin:0;">👗 <strong>Trang phục</strong> — Mang 1-2 bộ trang phục cá nhân nếu muốn (không bắt buộc)</p>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <p style="font-size:13px;color:#333;margin:0;">⏰ <strong>Đúng giờ</strong> — Đến sớm 10 phút để chuẩn bị thoải mái</p>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <p style="font-size:13px;color:#333;margin:0;">📺 <strong>Tour trước</strong> — Xem studio qua <a href="https://gaonauchupanh.vn/tour-360" style="color:#0a0a0a;">Tour 360°</a> nếu chưa ghé</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Locations -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #eee;">
          <p style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#999;margin:0 0 16px;">Địa chỉ studio</p>
          <p style="font-size:13px;color:#333;margin:0 0 10px;">🌸 <strong>Hà Nội:</strong> Sảnh TM, Tầng 3, Tòa HH01 Meco Complex, Ngõ 102 Trường Chinh</p>
          <p style="font-size:13px;color:#333;margin:0;">☀️ <strong>TP HCM:</strong> 351/45 Lê Văn Sỹ, Phường Nhiêu Lộc</p>
          <p style="font-size:12px;color:#999;margin:10px 0 0;">Mở cửa: 8:00 – 20:00 · Thứ 2 – Chủ nhật</p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 32px;text-align:center;">
          <a href="tel:+84329160517" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;margin:0 6px 8px;">📞 Gọi 0329 160 517</a>
          <a href="https://zalo.me/2780520369440427485" style="display:inline-block;background:#f5f5f5;color:#0a0a0a;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;margin:0 6px 8px;">💬 Nhắn Zalo</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#aaa;margin:0;line-height:1.6;">
            © 2025 DAISY CONCEPT · Gạo Nâu Chụp Ảnh<br>
            <a href="https://daisy-concept.vercel.app" style="color:#aaa;">daisy-concept.vercel.app</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { name = '', email = '', phone = '', concept = '', note = '' } = req.body || {};

    if (!email) return res.status(400).json({ error: 'Missing email' });

    const bodyData  = req.body || {};
    const slotLabel = bodyData.slotLabel || '';

    // Chuẩn bị TG message
    const tgMsg = [
      '✅ <b>XÁC NHẬN THANH TOÁN — DAISY CONCEPT</b>',
      '',
      `👤 <b>${name}</b>`,
      `📞 ${phone}`,
      `📧 ${email}`,
      `🎨 ${concept || 'Chưa chọn'}`,
      note ? `📝 ${note}` : null,
      '',
      '📨 Email xác nhận đã gửi cho khách!',
    ].filter(Boolean).join('\n');

    // Chuẩn bị sheet URL (dùng ngay từ req.body — không cần đợi gì)
    const sheetParams = new URLSearchParams({
      name,
      phone,
      email,
      concept:   concept || '',
      coc:       '5.000đ',
      slotLabel: slotLabel,
    });
    const sheetUrl = `${SHEET_WEBHOOK}?${sheetParams.toString()}`;
    console.log('[Sheet] →', name, '|', slotLabel);

    // Chạy CẢ 3 song song: email + Telegram + sheet
    // Tổng thời gian = max(3 cái) ≈ 3-6s — tránh timeout 10s của Vercel Hobby
    const [emailRes, , sheetText] = await Promise.all([
      fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [email],
          subject: `✅ Gạo Nâu — Xác nhận đặt lịch của ${name}`,
          html:    emailHtml(name, phone, concept),
        }),
      }),
      fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, message_thread_id: 4, text: tgMsg, parse_mode: 'HTML' }),
      }),
      Promise.race([
        fetch(sheetUrl, { redirect: 'follow' }).then(r => r.text()),
        new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 8000)),
      ]).catch(e => { console.error('[Sheet Error]', e.message); return 'ERROR'; }),
    ]);

    const emailData = await emailRes.json();
    if (emailData.error) { console.error('[Resend Error]', emailData.error); }
    else { console.log('[Email Sent]', email, emailData.id); }
    console.log('[Sheet result]', String(sheetText).slice(0, 300));

    return res.status(200).json({ success: true, emailSent: !emailData.error });
  } catch (err) {
    console.error('[Send Confirmation Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
