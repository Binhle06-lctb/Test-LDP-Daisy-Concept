// Vercel Serverless — Booking Slots (Google Sheets as persistent storage)
// GET  /api/slots        → lấy danh sách slot đã booked từ Google Sheet
// POST /api/slots        → đánh dấu slot đã booked, lưu vào Google Sheet

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxIdmFwATxd_Awx10eQUWwD7g2cUa3Wu4QSSuDhXrplhZo_0vUqSQ0JKo391UltU0gi/exec';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: đọc tất cả slot từ Sheet ─────────────────────────
  if (req.method === 'GET') {
    try {
      const r = await fetch(
        `${SHEET_URL}?action=getSlots&_=${Date.now()}`,
        { redirect: 'follow' }
      );
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { slots: [] }; }

      // Apps Script trả về { slots: { "key": { name, phone, time } } }
      const booked = data.slots || {};
      console.log('[slots GET] loaded:', Object.keys(booked).length, 'slots');
      return res.json({ booked });
    } catch (err) {
      console.error('[slots GET error]', err.message);
      return res.json({ booked: {} });
    }
  }

  // ── POST: lưu slot mới vào Sheet ──────────────────────────
  if (req.method === 'POST') {
    const { slot, name = '', phone = '', concept = '' } = req.body || {};
    if (!slot) return res.status(400).json({ error: 'Missing slot' });

    try {
      const url = `${SHEET_URL}?action=addSlot&slot=${encodeURIComponent(slot)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&concept=${encodeURIComponent(concept)}`;
      const r    = await fetch(url, { redirect: 'follow' });
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (data.duplicate) {
        return res.status(409).json({ error: 'Slot already booked' });
      }
      console.log('[slots POST] saved:', slot, name);
      return res.json({ success: true, slot });
    } catch (err) {
      console.error('[slots POST error]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}
