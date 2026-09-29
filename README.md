# SYTION v2 — trợ lý AI kiểu Jarvis (Gemini)

## Đưa lên Vercel
1. Đẩy cả thư mục này lên GitHub (giữ nguyên cấu trúc: `index.html`, `api/`, `vercel.json`).
2. vercel.com → Add New → Project → chọn repo → Deploy.
3. Settings → Environment Variables → thêm `GEMINI_API_KEY` (aistudio.google.com/apikey).
4. **Redeploy** (bắt buộc sau khi thêm biến).

## Biến tuỳ chọn
- `GEMINI_MODEL` — model ưu tiên (mặc định gemini-2.5-flash, tự chuyển sang flash-lite / 2.0-flash nếu hết hạn mức)
- `GEMINI_SEARCH=1` — cho Sytion tra Google khi cần (thông minh hơn, tốn hạn mức hơn)
- `GEMINI_VOICE` — giọng đọc (mặc định Charon; thử Algenib, Orus, Puck...)

## Điền dữ liệu về Cha xứ
Sửa `KNOWLEDGE` ở đầu `api/chat.js`.

## Nếu lỗi
Mở `https://<tên-miền>/api/chat` sẽ thấy "Chỉ nhận POST" → nghĩa là API đã chạy. Nếu 404 thì cấu trúc thư mục chưa đúng.
Lỗi hiện thẳng trong khung chat kèm nguyên nhân (sai key, hết hạn mức...).
