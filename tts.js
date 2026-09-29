const { callModel, friendly, parseBody } = require('./_lib');

// Giọng đọc của Gemini (hỗ trợ tiếng Việt). Trả về PCM 16-bit, 24kHz, mono dạng base64.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ nhận POST' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Chưa có GEMINI_API_KEY' });
  const text = String(parseBody(req).text || '').slice(0, 420).trim();
  if (!text) return res.status(400).json({ error: 'Thiếu văn bản' });

  const r = await callModel(process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts', {
    contents: [{ parts: [{ text: `Đọc bằng giọng nam trầm, chậm rãi, uể oải, chán đời nhưng rõ ràng: ${text}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env.GEMINI_VOICE || 'Charon' } } },
    },
  });
  const audio = r.d.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  if (!r.ok || !audio) return res.status(r.ok ? 502 : r.status).json({ error: friendly(r.status, r.msg) });
  res.status(200).json({ audio, rate: 24000 });
};
