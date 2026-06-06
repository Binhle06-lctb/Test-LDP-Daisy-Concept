// Vercel Serverless — Check SePay payment status
// GET /api/check-payment?snapshot=1              → lấy danh sách ref hiện tại
// GET /api/check-payment?desc=...&exclude=r1,r2  → kiểm tra GD mới (không thuộc exclude list)

const SEPAY_TOKEN = process.env.SEPAY_TOKEN || 'L9DBXRUYNRE6LDWJBPTCW1VHUKG7JAGHDH0WIQNPRQPFUVHIM1S8BC42EJXTBMTZ';
const MIN_AMOUNT  = 5000;
const WEBHOOK_BUFFER_MS = 12000; // đảm bảo webhook Telegram đã gửi trước

function norm(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, c => c === 'đ' ? 'd' : 'D')
    .toUpperCase()
    .trim();
}

function parseSepayDate(str) {
  if (!str) return 0;
  // SePay trả về giờ Việt Nam không có TZ → thêm +07:00
  return new Date(str.replace(' ', 'T') + '+07:00').getTime();
}

async function fetchTransactions() {
  const r = await fetch(
    'https://my.sepay.vn/userapi/transactions/list?limit=50',
    { headers: { Authorization: `Bearer ${SEPAY_TOKEN}` } }
  );
  const d = await r.json();
  return Array.isArray(d.transactions) ? d.transactions : [];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const txs = await fetchTransactions();

    // ── SNAPSHOT MODE: trả về tất cả ref hiện tại ──
    if (req.query.snapshot) {
      const refs = txs.map(t => t.reference_number).filter(Boolean);
      console.log('[snapshot] refs:', refs.length);
      return res.json({ refs });
    }

    // ── CHECK MODE ──
    const { desc, exclude = '' } = req.query;
    if (!desc) return res.status(400).json({ error: 'Missing desc' });

    const keyword    = norm(desc);
    const oldRefs    = new Set(exclude.split(',').filter(Boolean));
    const now        = Date.now();

    console.log('[check] keyword:', keyword, '| excluding:', oldRefs.size, 'old refs');

    const match = txs.find(t => {
      const ref     = t.reference_number || '';
      const content = norm(t.transaction_content);
      const amount  = Number(t.amount_in || 0);
      const txTime  = parseSepayDate(t.transaction_date);

      // ① Không phải giao dịch cũ (không trong snapshot)
      if (oldRefs.has(ref)) return false;

      // ② Đủ số tiền
      if (amount < MIN_AMOUNT) return false;

      // ③ Nội dung khớp
      if (!content.includes(keyword)) return false;

      // ④ Đã đủ thời gian để webhook Telegram gửi xong
      const age = now - txTime;
      if (age < WEBHOOK_BUFFER_MS) {
        console.log('[check] GD quá mới, đợi webhook:', ref, 'age:', age, 'ms');
        return false;
      }

      console.log('[check] MATCH:', ref, content, amount);
      return true;
    });

    if (match) {
      return res.json({
        paid:    true,
        amount:  match.amount_in,
        ref:     match.reference_number,
        content: match.transaction_content,
        time:    match.transaction_date,
      });
    }

    return res.json({ paid: false });

  } catch (err) {
    console.error('[check-payment error]', err.message);
    return res.status(500).json({ paid: false, error: err.message });
  }
}
