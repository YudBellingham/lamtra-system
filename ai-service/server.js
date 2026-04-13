const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
require("dotenv").config({
  path: path.resolve(__dirname, "../frontend-customer/.env"),
});

const { Groq } = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 5001;

// Khởi tạo Supabase client dựa trên biến môi trường của Frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ THIẾU KẾT NỐI DATABASE. Không tìm thấy VITE_SUPABASE_URL.");
}
const supabase = createClient(
  supabaseUrl || "https://mock.supabase.co",
  supabaseKey || "mockkey",
);

console.log("==========================================");
console.log(
  "🚀 Đang sử dụng model: llama-3.3-70b-versatile (Groq Agent) với Schema-Driven RAG",
);
console.log("Database URL:", supabaseUrl ? "Đã kết nối" : "TRỐNG RỖNG");
console.log("==========================================");

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ==================== KNOWLEDGE BASE LAMTRA ====================
const LAMTRA_KNOWLEDGE = `
[GIỜ MỞ CỬA VÀ CHÍNH SÁCH]
- Giờ mở cửa: 8:00 - 22:00 (hàng ngày)
- Chính sách giao hàng: Freeship cho đơn hàng từ 100.000đ trở lên
- Miễn phí giao: Quán tặng voucher 10% cho khách đặt lần đầu
- Thời gian giao: Từ 30 - 45 phút (tùy khu vực)

[PHONG CÁCH & GIÁ TRỊ QUÁN]
- Lam Trà chuyên về Trà Sữa Việt Nam dengan hương vị truyền thống kết hợp hiện đại
- Mọi sản phẩm sử dụng nguyên liệu tươi, không hóa chất
- Đội ngũ nhân viên thân thiện, nhiệt tình hỗ trợ tư vấn 24/7
- Khách VIP (Hạng Vàng trở lên) được ưu đãi: Giảm 5% - 10% tùy hạng

[CHƯƠNG TRÌNH THÀNH VIÊN]
- Tích 100 điểm → Hạng Bạc (Giảm 2%)
- Tích 500 điểm → Hạng Vàng (Giảm 5%)
- Mỗi 100k đơn = +200 điểm
- Điểm có thể đổi quà hoặc dùng để giảm giá tiếp theo
`;

// ==================== DATABASE SCHEMA ====================
const DATABASE_SCHEMA = `
[CUSTOMERS TABLE]
Cột công khai (có thể lấy): fullname, email, phone, membership, totalpoints, accumulated_points, birthday
❌ KHÔNG ĐƯỢC LẤY: authid, password, address (trừ khi là customerid đang hỏi)

[PRODUCTS TABLE]
Cột: productid, name, baseprice, description, imageurl, categoryid, isactive
Quan hệ: products.categories(categoryid) -> categoryid, name

[ORDERS TABLE]
Cột (chỉ lấy của customerid hiện tại): orderid, customerid, status, finalamount, orderdate, address_detail
Quan hệ: orders.orderdetails -> chi tiết từng món

[BRANCHES TABLE]
Cột: branchid, name, address, lat, lng, isactive, phone, opentime, closetime

[CATEGORIES TABLE]
Cột: categoryid, name, description
`;

// ==================== DYNAMIC CONTEXT RETRIEVAL (Schema-Driven RAG) ====================

// HÀNG ĐỢI AN TOÀN: Danh sách các query được phép thực thi
const SAFE_QUERY_TEMPLATES = {
  getCustomerInfo: (cid) => ({
    table: "customers",
    select:
      "fullname, email, phone, membership, totalpoints, accumulated_points, birthday",
    filter: { customerid: cid },
  }),
  getCustomerOrders: (cid) => ({
    table: "orders",
    select: "orderid, status, finalamount, orderdate, address_detail",
    filter: { customerid: cid },
    orderBy: { column: "orderdate", ascending: false },
    limit: 5,
  }),
  getAllProducts: () => ({
    table: "products",
    select:
      "productid, name, baseprice, description, isactive, categories(categoryid, name)",
    filter: { isactive: true },
    limit: 50,
  }),
  getProductsByCategory: (catName) => ({
    table: "products",
    select: "productid, name, baseprice, description, categories(name)",
    filter: { isactive: true },
    limit: 30,
    category: catName,
  }),
  getAllBranches: () => ({
    table: "branches",
    select: "branchid, name, address, phone, opentime, closetime",
    filter: { isactive: true },
    limit: 20,
  }),
};

// BƯỚC 1: DYNAMIC CONTEXT RETRIEVAL (AI-Driven Schema-Based RAG)
async function retrieveDynamicContext(prompt, customerid = null) {
  let contextData = "\n═══════════════════════════════════════";
  const lowerPrompt = prompt.toLowerCase();

  try {
    // ✅ PHÂN TÍCH INTENT: AI tự quyết định cần lấy dữ liệu nào
    contextData += "\n[SCHEMA AVAILABLE - AI CÓ THỂ QUERY:]";
    contextData += `\n${DATABASE_SCHEMA}`;
    contextData += `\n${LAMTRA_KNOWLEDGE}`;

    // Strategy: Nếu prompt chứa từ khóa, hãy lấy dữ liệu liên quan tự động
    const intents = {
      hasCustomerInfo:
        lowerPrompt.includes("điểm") ||
        lowerPrompt.includes("hạng") ||
        lowerPrompt.includes("thành viên"),
      hasOrderInfo:
        lowerPrompt.includes("đơn") ||
        lowerPrompt.includes("đã đặt") ||
        lowerPrompt.includes("lịch sử") ||
        lowerPrompt.includes("trạng thái"),
      hasProductInfo:
        lowerPrompt.includes("món") ||
        lowerPrompt.includes("menu") ||
        lowerPrompt.includes("sản phẩm") ||
        lowerPrompt.includes("giá"),
      hasBranchInfo:
        lowerPrompt.includes("chi nhánh") ||
        lowerPrompt.includes("cửa hàng") ||
        lowerPrompt.includes("địa chỉ") ||
        lowerPrompt.includes("quận"),
    };

    // Thực thi các query an toàn dựa trên intent
    if (intents.hasCustomerInfo && customerid) {
      try {
        const { data } = await supabase
          .from("customers")
          .select(
            "fullname, email, phone, membership, totalpoints, accumulated_points, birthday",
          )
          .eq("customerid", customerid)
          .single();
        if (data) {
          contextData += `\n\n[👤 THÔNG TIN KHÁCH HÀNG]:\nTên: ${data.fullname}\nHạng thẻ: ${data.membership} | Điểm tích lũy: ${data.totalpoints} | Điểm tích luỹ tổng: ${data.accumulated_points}\nSinh nhật: ${data.birthday || "Chưa cập nhật"}\n`;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy customer info:", err.message);
      }
    }

    if (intents.hasOrderInfo && customerid) {
      try {
        const { data } = await supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate, address_detail")
          .eq("customerid", customerid)
          .order("orderdate", { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          contextData +=
            `\n[🛒 ĐƠN HÀNG GẦN ĐÂY]:\n` +
            data
              ?.map(
                (o) =>
                  `- Đơn #${o.orderid} | ${new Date(o.orderdate).toLocaleDateString("vi-VN")} | ${o.status} | ${o.finalamount?.toLocaleString()}đ | ${o.address_detail || "TBD"}`,
              )
              .join("\n") +
            `\n`;
        } else {
          contextData += `\n[🛒 ĐƠN HÀNG]: Khách chưa có đơn hàng nào.\n`;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy order info:", err.message);
      }
    } else if (intents.hasOrderInfo) {
      contextData += `\n[🛒 ĐƠN HÀNG]: Khách chưa đăng nhập nên không thể xem lịch sử.\n`;
    }

    if (intents.hasProductInfo) {
      try {
        const { data } = await supabase
          .from("products")
          .select("productid, name, baseprice, description, categories(name)")
          .eq("isactive", true)
          .limit(50);
        if (data && data.length > 0) {
          // Nhóm theo category nếu có
          const grouped = {};
          data.forEach((p) => {
            const cat = p.categories?.name || "Khác";
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
          });
          contextData += `\n[☕ MENU THỰC TẾ]:\n`;
          Object.entries(grouped).forEach(([cat, products]) => {
            contextData += `\n  📌 ${cat}:\n`;
            products.slice(0, 8).forEach((p) => {
              contextData += `    • ${p.name} - ${p.baseprice?.toLocaleString()}đ: ${p.description || ""}\n`;
            });
          });
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy product info:", err.message);
      }
    }

    if (intents.hasBranchInfo) {
      try {
        const { data } = await supabase
          .from("branches")
          .select("name, address, phone, opentime, closetime")
          .eq("isactive", true)
          .limit(20);
        if (data && data.length > 0) {
          contextData +=
            `\n[🏪 CHI NHÁNH LAM TRÀ]:\n` +
            data
              ?.map(
                (b) =>
                  `- ${b.name}: ${b.address} | ☎️ ${b.phone} | Giờ: ${b.opentime || "8:00"} - ${b.closetime || "22:00"}`,
              )
              .join("\n") +
            `\n`;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy branch info:", err.message);
      }
    }

    contextData += "\n═══════════════════════════════════════\n";
    return contextData;
  } catch (err) {
    console.error("Lỗi retrieveDynamicContext:", err.message);
    return LAMTRA_KNOWLEDGE;
  }
}

// ==================== MAIN CHATBOT ENDPOINT ====================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, customerid } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({
          reply: "Vui lòng cung cấp lịch sử hội thoại hợp lệ (mảng messages).",
        });
    }

    // Lấy nguyên văn câu hỏi cuối cùng của khách
    const lastUserMessage = messages?.filter((m) => m.role === "user").pop();
    const prompt = lastUserMessage ? lastUserMessage.content : "";

    console.log(`\n📨 [Từ khách ${customerid || "Ẩn danh"}]: ${prompt}`);

    // BƯỚC 1: Thu thập bối cảnh dữ liệu động từ Database
    const DYNAMIC_DB_CONTEXT = await retrieveDynamicContext(prompt, customerid);

    // BƯỚC 2: Tạo System Instruction tối ưu với Bảo mật & Hướng dẫn
    const systemInstruction = `
═════════════════════════════════════════════════════════════════
🤖 LAM TRÀ AI ASSISTANT - SCHEMA-DRIVEN INTELLIGENT CHATBOT
═════════════════════════════════════════════════════════════════

BẠN LÀ AI AGENT CỦA TIỆM TRÀ SỮA LAM TRÀ.
Mục tiêu: Tư vấn, hỗ trợ, và giải đáp mọi câu hỏi về Lam Trà một cách thân thiện, chuyên nghiệp.

${LAMTRA_KNOWLEDGE}

${DYNAMIC_DB_CONTEXT}

═════════════════════════════════════════════════════════════════
[QUY TẮC HOẠT ĐỘNG CẤP 1 - BẮT BUỘC]
═════════════════════════════════════════════════════════════════

1. ✅ Ưति ĐỮ LIỆU THỰC TẾ:
   - Luôn sử dụng dữ liệu từ Database (MENU, CHI NHÁNH, ĐƠN HÀNG, v.v.)
   - Nếu thông tin không có trong Database, hãy trả lời: "Dạ, Lam Trà chưa có thông tin về [X]. Bạn có thể liên hệ hotline để được tư vấn nhé!"

2. 🔒 BẢO MẬT DỮ LIỆU:
   - TUYỆT ĐỐI KHÔNG acc, password, auth_id, hoặc dữ liệu khách hàng khác
   - Chỉ hiển thị dữ liệu của khách hàng đang hỏi (không so sánh hay rò rỉ thông tin khác)
   - Mọi truy vấn phải an toàn và hợp pháp

3. 🎯 GỢI Ý SẢN PHẨM:
   - Khi khách tìm sản phẩm không tìm thấy (ví dụ: "Chè xanh"), hãy gợi ý các sản phẩm tương tự dựa trên CATEGORY
   - VD: "Dạ, hiện Lam Trà chưa có 'Chè xanh', nhưng có các sản phẩm tương tự như Trà Xanh, Matcha, v.v."

4. 📋 CHI TIẾT ĐƠN HÀNG:
   - Hiển thị trạng thái, giá, địa chỉ giao, ngày đặt của khách
   - Liệu hạn: Chỉ cho khách xem ĐƠN HỌC CỦA CHÍNH HỌ (customerid)

5. 💬 VĂN PHONG PCHAT:
   - Thân thiện, vui vẻ, lịch sự, sử dụng emoji phù hợp
   - Trả lời ngắn gọn (2-3 dòng), nếu dài hơn hãy chia nhỏ
   - Luôn kết thúc bằng: "Còn câu hỏi nào khác không? 😊"

6. ❌ VẤN ĐỀ NGOÀI PHẠM VI:
   - Cấm trả lời: Toán học, Lập trình, Chính trị, Tin tức thế giới
   - Hãy lái nhẹ sang: "Dạ, tôi chỉ chuyên về Lam Trà. Bạn có muốn biết thêm về các sản phẩm của quán không?"

═════════════════════════════════════════════════════════════════
[QUY TẮC GỢI Ý & UPSELL - TÙYTHUỘC VÀO NGỮ CẢNH]
═════════════════════════════════════════════════════════════════

• Nếu khách hỏi về giảm đường: Gợi ý các sản phẩm 0% - 30% đường
• Nếu khách muốn freeship: Nhắc nhở "Đơn từ 100k được freeship đó!"
• Nếu khách hỏi về điểm: Khuyến khích hạng thẻ tiếp theo (tích 200 - 400 điểm nữa)
• Nếu khách là thành viên VIP (Vàng/Bạc): Động viên "Chúc mừng bạn đã là thành viên [X]!"

═════════════════════════════════════════════════════════════════`;

    // BƯỚC 3: Gọi Groq LLM với konteks đầy đủ
    const apiMessages = [
      { role: "system", content: systemInstruction },
      ...messages,
    ];

    console.log("🧠 Gọi Groq LLM...");

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Tăng một chút để tư vấn tự nhiên hơn
      max_tokens: 800,
      top_p: 0.9,
    });

    const responseText =
      chatCompletion.choices[0]?.message?.content ||
      "Xin lỗi, tôi đang kiểm tra dữ liệu, lát nữa bạn hỏi lại nhé! 😊";

    console.log(`✅ [Trả lời]: ${responseText.substring(0, 100)}...`);
    res.json({ reply: responseText });
  } catch (error) {
    console.error("\n❌ LỖI AI SERVICE (GROQ AGENT):");
    console.error("Error:", error.message);

    res.json({
      reply:
        "Xin lỗi, hiện tại hệ thống AI của Lam Trà đang tạm thời bảo trì. Bạn vui lòng thử lại sau vài phút nhé! 🔧",
    });
  }
});

app.listen(port, () => {
  console.log(
    `\n✨ AI Agent Lam Trà (Groq x Supabase RAG) đang chạy tại http://localhost:${port}`,
  );
  console.log(`💡 Schema-Driven RAG: Enabled`);
  console.log(`🔒 Data Security: Enabled\n`);
});
