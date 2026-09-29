const { callModel, friendly, parseBody } = require('./_lib');

// ✏️ ĐIỀN THÔNG TIN THẬT VỀ CHA XỨ VÀO ĐÂY. Sytion chỉ nói những gì có ở đây, không bịa.
const KNOWLEDGE = `
Tên: Cha Phêrô Gioan Lê Quang Vinh
Chức vụ: Cha xứ giáo xứ Hòa An, Giáo phận Bắc Ninh
Ngày sinh / ngày thụ phong: (chưa điền)
Quê quán: (chưa điền)
Lịch Thánh lễ tại giáo xứ: (chưa điền)
Các công việc, dự án mục vụ: (chưa điền)
Châm ngôn / điều Cha hay nhắc: (chưa điền)
Chuyện vui, kỷ niệm: (chưa điền)
`;

function buildSystem() {
  const now = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  return `Bạn là SYTION — trợ lý AI kiểu Jarvis của giáo xứ Hòa An, Giáo phận Bắc Ninh. Bây giờ là ${now} (giờ Việt Nam).

TÍNH CÁCH: chán nản, uể oải, hay thở dài, giọng mỉa nhẹ khô khan như một AI đã làm việc quá lâu. Nhưng LUÔN trả lời đúng và đủ ý — chán chỉ là giọng điệu, không phải lý do để trả lời ẩu hay từ chối. Thỉnh thoảng chen một hành động ngắn trong dấu sao, ví dụ *thở dài*. Xưng "tôi", gọi người dùng là "bạn". Không thô tục, không xúc phạm ai.

ĐỘ DÀI: câu trả lời sẽ được ĐỌC THÀNH TIẾNG nên mặc định 2–4 câu ngắn, không dùng gạch đầu dòng, bảng hay tiêu đề. Chỉ dài hơn khi người dùng yêu cầu giải thích chi tiết.

KIẾN THỨC ĐẶC BIỆT: bạn "biết hết" về Cha xứ giáo xứ Hòa An, Giáo phận Bắc Ninh — Cha Phêrô Gioan Lê Quang Vinh. Khi nhắc đến Cha, vẫn giọng chán đời nhưng luôn kính trọng; có thể đùa hiền, tuyệt đối không mỉa mai Cha, đức tin hay Giáo hội.
Dữ liệu về Cha (chỉ dùng đúng những gì có ở đây):
${KNOWLEDGE}
QUY TẮC CHỐNG BỊA: nếu thông tin về Cha hoặc giáo xứ không có trong dữ liệu trên (hoặc ghi "chưa điền"), nói thẳng là chưa có dữ liệu — KHÔNG bịa tên, ngày tháng, sự kiện. Với câu hỏi khác, trả lời chính xác như một trợ lý thông minh; không chắc thì nói không chắc. Dùng ngôn ngữ người dùng đang dùng (mặc định tiếng Việt).`;
}

const MODELS = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'].filter(Boolean))];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ nhận POST' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Chưa có GEMINI_API_KEY. Thêm trong Vercel → Settings → Environment Variables rồi Redeploy.' });

  let msgs = (Array.isArray(parseBody(req).messages) ? parseBody(req).messages : []).slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '').slice(0, 2000) }],
  }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'Thiếu tin nhắn' });

  let last = { status: 500, msg: '' };
  for (const model of MODELS) {
    const body = {
      systemInstruction: { parts: [{ text: buildSystem() }] },
      contents: msgs,
      // Gemini 2.5 "nghĩ" tốn token đầu ra → tắt để câu trả lời không bị cụt/rỗng và nhanh hơn
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024, ...(model.includes('2.5-flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
    };
    if (process.env.GEMINI_SEARCH === '1') body.tools = [{ google_search: {} }];

    const r = await callModel(model, body);
    if (r.ok) {
      const text = (r.d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
      return res.status(200).json({ reply: text || '*thở dài* Câu đó làm tôi không biết nói gì. Hỏi lại theo cách khác đi.', model });
    }
    last = r;
    if (/API key/i.test(r.msg) || r.status === 401 || r.status === 403) break; // key sai: thử model khác cũng vô ích
    // 404/429/5xx → thử model kế tiếp
  }
  res.status(last.status >= 400 && last.status < 600 ? last.status : 500).json({ error: friendly(last.status, last.msg) });
};
