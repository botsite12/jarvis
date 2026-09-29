// Dùng chung cho chat & tts
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

async function callModel(model, body) {
  const r = await fetch(`${BASE}${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, d, msg: d.error?.message || '' };
}

function friendly(status, msg) {
  if (/API key/i.test(msg) || status === 401 || status === 403) return 'GEMINI_API_KEY không hợp lệ hoặc chưa được cấp quyền. Kiểm tra lại key trong Vercel → Settings → Environment Variables, rồi Redeploy.';
  if (status === 429) return 'Đã hết hạn mức miễn phí của Gemini trong phút/ngày này. Đợi một lát rồi thử lại.';
  return msg || `Gemini lỗi (${status})`;
}

function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  return b || {};
}

module.exports = { callModel, friendly, parseBody };
