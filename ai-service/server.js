const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../frontend-customer/.env') });

const { Groq } = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5001;

// Khởi tạo Supabase client dựa trên biến môi trường của Frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ THIẾU KẾT NỐI DATABASE. Không tìm thấy VITE_SUPABASE_URL.");
}
const supabase = createClient(supabaseUrl || 'https://mock.supabase.co', supabaseKey || 'mockkey');

console.log("==========================================");
console.log("🚀 Đang sử dụng model: llama-3.3-70b-versatile (Groq Agent)");
console.log("Database URL:", supabaseUrl ? "Đã kết nối" : "TRỐNG RỖNG");
console.log("==========================================");

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// BƯỚC 1: DYNAMIC DATA RETRIEVAL (RAG LOGIC)
async function retrieveDynamicContext(prompt, customerid = null) {
    let contextData = "";
    const lowerPrompt = prompt.toLowerCase();

    try {
        // 1. Quét từ khóa: Điểm tích lũy, Hạng thành viên
        if (lowerPrompt.includes("điểm") || lowerPrompt.includes("hạng") || lowerPrompt.includes("member")) {
            if (customerid) {
               const { data } = await supabase.from('customers').select('fullname, totalpoints, membership').eq('customerid', customerid).single();
               if (data) {
                   contextData += `\n[THÔNG TIN CÁ NHÂN]: Khách hàng: ${data.fullname} | Hạng thẻ: ${data.membership} | Điểm tích lũy: ${data.totalpoints} điểm.\n`;
               }
            } else {
               contextData += `\n[THÔNG TIN CÁ NHÂN]: Khách chưa đăng nhập nên không tra được điểm.\n`;
            }
        }

        // 2. Quét từ khóa: Đơn hàng, Trạng thái đơn, Lịch sử mua
        if (lowerPrompt.includes("đơn hàng") || lowerPrompt.includes("đã đặt") || lowerPrompt.includes("lịch sử")) {
            if (customerid) {
               const { data } = await supabase.from('orders').select('orderid, status, finalamount, orderdate').eq('customerid', customerid).order('orderdate', { ascending: false }).limit(3);
               if (data && data.length > 0) {
                   contextData += `\n[ĐƠN HÀNG GẦN ĐÂY]:\n` + data.map(o => `- Đơn #${o.orderid} | Ngày: ${new Date(o.orderdate).toLocaleDateString()} | Trạng thái: ${o.status} | Tổng: ${o.finalamount}đ`).join('\n') + `\n`;
               } else {
                   contextData += `\n[ĐƠN HÀNG GẦN ĐÂY]: Khách chưa có đơn hàng nào.\n`;
               }
            } else {
               contextData += `\n[ĐƠN HÀNG GẦN ĐÂY]: Không thể tra cứu vì khách chưa đăng nhập.\n`;
            }
        }

        // 3. Quét từ khóa: Chi nhánh, Quận, Địa chỉ
        if (lowerPrompt.includes("quận") || lowerPrompt.includes("chi nhánh") || lowerPrompt.includes("địa chỉ") || lowerPrompt.includes("cửa hàng")) {
            const { data } = await supabase.from('branches').select('name, address').eq('isactive', true);
            if (data) {
                contextData += `\n[CHI NHÁNH LAM TRÀ]:\n` + data.map(b => `- ${b.name}: ${b.address}`).join('\n') + `\n`;
            }
        }

        // 4. Luôn quét Menu món ăn để hỗ trợ Tư vấn (Giới hạn 20 món Best Seller/Có sẵn)
        const { data: products } = await supabase.from('products').select(`name, baseprice, description, categories(name)`).limit(20);
        if (products) {
            contextData += `\n[MENU THỰC TẾ TRONG DATABASE]:\n` + products.map(p => `- ${p.name} (${p.categories?.name || 'Đồ uống'}) - ${p.baseprice}đ: ${p.description || 'Ngon chuẩn vị'}`).join('\n') + `\n`;
        }

        return contextData;
    } catch (err) {
        console.error("Lỗi lấy data DB:", err.message);
        return "\n[LỖI]: Không thể tải dữ liệu tự động từ Database.\n";
    }
}

app.post('/api/chat', async (req, res) => {
  try {
    // Nhận thêm customerid từ request body nếu có
    const { messages, customerid } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: "Vui lòng cung cấp lịch sử hội thoại hợp lệ (mảng messages)." });
    }

    // Lấy nguyên văn câu hỏi cuối cùng của khách để quét từ khóa
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const prompt = lastUserMessage ? lastUserMessage.content : "";

    // GỌI BƯỚC 1: Thu thập bối cảnh dữ liệu
    const DYNAMIC_DB_CONTEXT = await retrieveDynamicContext(prompt, customerid);

    // GỌI BƯỚC 2: AI Generation
    const systemInstruction = `Bạn là AI Agent toàn năng của tiệm trà sữa Lam Trà. BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI DỰA TRÊN DỮ LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY. KHÔNG BỊA ĐẶT. Trả lời ngắn gọn, vui vẻ, lịch sự bằng tiếng Việt.

${DYNAMIC_DB_CONTEXT}

[QUY TẮC NGHIÊM NGẶT - BẢO MẬT & TƯ VẤN]
1. TRẢ LỜI SÁT SỰ THẬT: Nếu khách hỏi thông tin KHÔNG CÓ trong Context bên trên, hãy trả lời: "Dạ, hiện tại Lam Trà chưa tìm thấy thông tin này, bạn vui lòng kiểm tra lại nhé!".
2. PHÂN TÍCH TỪ KHÓA: Nếu khách tìm "Xoài" hay "Dâu", hãy tự động đối chiếu với "MENU THỰC TẾ", trích xuất các món có từ khóa đó rồi tư vấn.
3. KÊNH GIẢM CÂN: Tư vấn mạnh về mô tả sức khỏe ở Đồ uống hoa quả, khuyến khích giảm đường 0% - 30%.
4. HÀNH ĐỘNG DỮ LIỆU: Mọi thông tin bạn đưa ra chỉ mang tính chất tư vấn (Read-only), bạn không tự động đặt đơn hay chỉnh sửa điểm của khách được.
5. VẤN ĐỀ NGOÀI LỀ: Cấm trả lời về toán học, lập trình, hoặc chính trị trí tuệ nhân tạo. Lái nhẹ câu chuyện về Lam Trà.`;

    const apiMessages = [
        { role: "system", content: systemInstruction },
        ...messages
    ];

    const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 600,
        top_p: 1,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "Xin lỗi, tôi đang kiểm tra dữ liệu, lát nữa bạn hỏi lại nhé.";
    res.json({ reply: responseText });
    
  } catch (error) {
    console.error('\n❌ LỖI AI SERVICE (GROQ AGENT):');
    console.error('Message:', error.message);
    
    res.json({ reply: 'Xin lỗi, hiện tại hệ thống Lam Trà đang cập nhật menu, bạn đợi chút nhé!' });
  }
});

app.listen(port, () => {
  console.log(`🤖 AI Agent (Powered by Groq x Supabase RAG) đang chạy tại http://localhost:${port}`);
});
