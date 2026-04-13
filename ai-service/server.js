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
  console.error("\n❌ CRITICAL ERROR: SUPABASE CONNECTION FAILED");
  console.error("   ❌ VITE_SUPABASE_URL không được tìm thấy");
  console.error("   ❌ VITE_SUPABASE_ANON_KEY không được tìm thấy");
  console.error("\n   📋 Vui lòng kiểm tra file .env tại:");
  console.error("   - d:\\lamtra-system\\ai-service\\.env");
  console.error("   - d:\\lamtra-system\\frontend-customer\\.env");
  console.error("\n   Không thể khởi chạy AI Service bằng dữ liệu fake.\n");
  process.exit(1); // Exit ngay, không tiếp tục
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// ==================== INTELLIGENT TABLE SELECTOR (AI-DRIVEN) ====================
// Hàm này sẽ giúp AI quyết định cần lấy dữ liệu từ bảng nào
const TABLE_DESCRIPTORS = {
  customers: {
    name: "customers",
    description:
      "Bảng thông tin khách hàng: tên, email, điểm tích lũy, hạng thẻ, ngày sinh",
    keywords: [
      "điểm",
      "hạng",
      "thành viên",
      "từng khách",
      "tài khoản",
      "hồ sơ",
    ],
    publicColumns: [
      "fullname",
      "email",
      "phone",
      "membership",
      "totalpoints",
      "accumulated_points",
      "birthday",
    ],
  },
  orders: {
    name: "orders",
    description:
      "Bảng lịch sử đơn hàng: mã đơn, trạng thái, ngày đặt, tổng tiền, địa chỉ giao",
    keywords: ["đơn", "đơn hàng", "lịch sử", "trạng thái", "đã đặt", "giao"],
    publicColumns: [
      "orderid",
      "status",
      "finalamount",
      "orderdate",
      "address_detail",
    ],
  },
  products: {
    name: "products",
    description:
      "Bảng menu sản phẩm: tên sản phẩm, giá, mô tả, danh mục, hình ảnh",
    keywords: [
      "món",
      "menu",
      "sản phẩm",
      "giá",
      "đồ uống",
      "trà",
      "danh mục",
      "category",
      "có gì",
    ],
    publicColumns: [
      "productid",
      "name",
      "baseprice",
      "description",
      "imageurl",
      "categoryid",
    ],
  },
  branches: {
    name: "branches",
    description:
      "Bảng chi nhánh: tên chi nhánh, địa chỉ, điện thoại, giờ mở cửa",
    keywords: [
      "chi nhánh",
      "cửa hàng",
      "địa chỉ",
      "quận",
      "khu vực",
      "gần",
      "phone",
    ],
    publicColumns: [
      "branchid",
      "name",
      "address",
      "phone",
      "opentime",
      "closetime",
    ],
  },
};

// ==================== DYNAMIC CONTEXT RETRIEVAL (DEFENSIVE PROGRAMMING) ====================
// Nguyên tắc: Tách try-catch để chống lỗi domino
async function retrieveDynamicContext(prompt, customerid = null) {
  let contextData = "\n═══════════════════════════════════════";
  contextData += "\n[📊 KIẾN THỨC NỀN TẢNG LAM TRÀ]";
  contextData += `\n${LAMTRA_KNOWLEDGE}\n`;

  // ============ PHẦN 1: LẤY MENU (TÁCH RỜI) ============
  try {
    console.log("📌 Bước 1: Lấy Menu từ database...");
    // ✅ FIX 1: Dùng cột `status` thay vì `isactive` (theo schema)
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("name, baseprice, description, status");

    if (prodErr) {
      console.error("❌ LỖI LẤY MENU:", prodErr.message);
    } else if (products && products.length > 0) {
      // Lọc những sản phẩm có status hợp lệ (có sẵn)
      const activeProducts = products.filter(
        (p) => p.status && p.status !== "unavailable",
      );
      if (activeProducts.length > 0) {
        contextData += `\n[☕ MENU LAM TRÀ (LUÔN CÓ SẴN)]`;
        activeProducts.forEach((p) => {
          contextData += `\n- ${p.name}: ${p.baseprice}đ (Trạng thái: ${p.status || "Không xác định"})`;
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Lỗi trong phần lấy Menu:", err.message);
    // ❌ KHÔNG return! Tiếp tục sang phần khách hàng
  }

  // ============ PHẦN 2: LẤY THÔNG TIN KHÁCH HÀNG & ĐƠN HÀNG (TÁCH RỜI) ============
  try {
    console.log("📌 Bước 2: Lấy thông tin Khách hàng...");

    let foundCustomer = null;

    // ✅ FIX 2: Kiểm tra kiểu dữ liệu của customerid
    // - Nếu là UUID (chứa dấu gạch ngang "-"): query bằng authid
    // - Nếu là số nguyên: query bằng customerid
    if (customerid) {
      const isUUID = typeof customerid === "string" && customerid.includes("-");

      if (isUUID) {
        // UUID → query theo authid
        console.log(`🔍 Tìm khách hàng bằng authid (UUID): ${customerid}`);
        const { data, error: err1 } = await supabase
          .from("customers")
          .select(
            "customerid, fullname, phone, email, membership, totalpoints, accumulated_points",
          )
          .eq("authid", customerid)
          .single();
        if (err1) {
          console.warn("⚠️ Không tìm thấy khách bằng authid:", err1.message);
        } else if (data) {
          foundCustomer = data;
          console.log(`✅ Tìm thấy khách: ${data.fullname}`);
        }
      } else {
        // Số nguyên → query theo customerid
        console.log(`🔍 Tìm khách hàng bằng customerid (số): ${customerid}`);
        const { data, error: err2 } = await supabase
          .from("customers")
          .select(
            "customerid, fullname, phone, email, membership, totalpoints, accumulated_points",
          )
          .eq("customerid", parseInt(customerid))
          .single();
        if (err2) {
          console.warn(
            "⚠️ Không tìm thấy khách bằng customerid:",
            err2.message,
          );
        } else if (data) {
          foundCustomer = data;
          console.log(`✅ Tìm thấy khách: ${data.fullname}`);
        }
      }
    } else {
      // Thử tìm bằng số điện thoại từ prompt
      const phoneInPrompt = prompt.match(/\b([0-9]{10})\b/);
      if (phoneInPrompt) {
        console.log(
          `📞 Tìm khách hàng bằng số điện thoại: ${phoneInPrompt[0]}`,
        );
        const { data, error: err3 } = await supabase
          .from("customers")
          .select(
            "customerid, fullname, phone, email, membership, totalpoints, accumulated_points",
          )
          .eq("phone", phoneInPrompt[0])
          .single();
        if (err3) {
          console.warn(
            "⚠️ Không tìm thấy khách bằng điện thoại:",
            err3.message,
          );
        } else if (data) {
          foundCustomer = data;
          console.log(`✅ Tìm thấy khách: ${data.fullname}`);
        }
      }
    }

    // Xử lý dữ liệu khách hàng nếu tìm thấy
    if (foundCustomer) {
      contextData += `\n\n[👤 THÔNG TIN KHÁCH HÀNG ĐANG CHAT]
Tên: ${foundCustomer.fullname}
Điện thoại: ${foundCustomer.phone}
Email: ${foundCustomer.email || "Không có"}
Hạng thẻ: ${foundCustomer.membership || "Chưa có"}
Điểm hiện có: ${foundCustomer.totalpoints || 0}
Điểm tích lũy: ${foundCustomer.accumulated_points || 0}`;

      // Lấy 5 đơn hàng gần nhất của khách
      try {
        const { data: orders, error: ordErr } = await supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate")
          .eq("customerid", foundCustomer.customerid)
          .order("orderdate", { ascending: false })
          .limit(5);

        if (ordErr) {
          console.warn("⚠️ Lỗi lấy đơn hàng:", ordErr.message);
        } else if (orders && orders.length > 0) {
          contextData += `\n\n[🛒 5 ĐƠN HÀNG GẦN NHẤT]`;
          orders.forEach((o) => {
            const dateStr = new Date(o.orderdate).toLocaleDateString("vi-VN");
            contextData += `\n- Đơn #${o.orderid} (${dateStr}): ${o.status}, Tổng: ${o.finalamount?.toLocaleString() || 0}đ`;
          });
        }
      } catch (ordErr) {
        console.warn("⚠️ Lỗi trong khối lấy đơn hàng:", ordErr.message);
        // Không return - vẫn để luồng tiếp tục
      }
    } else {
      contextData += `\n\n[⚠️ HỆ THỐNG CẢNH BÁO]
Khách chưa đăng nhập và chưa cung cấp số điện thoại hợp lệ.
TUYỆT ĐỐI KHÔNG BỊA RA: Điểm, Hạng thẻ, hoặc thông tin Đơn hàng của khách!
Hãy yêu cầu khách: "Bạn vui lòng đăng nhập hoặc cung cấp số điện thoại 10 chữ số nhé! 📱"`;
    }
  } catch (err) {
    console.error("❌ Lỗi NGHIÊM TRỌNG trong phần khách hàng:", err.message);
    // Dù lỗi cũng phải return contextData (chứa ít nhất menu)
    contextData += `\n\n[⚠️ LỖI]: Không thể tải thông tin khách hàng vào lúc này.`;
  }

  contextData += "\n═══════════════════════════════════════\n";
  return contextData;
}

// ==================== MAIN CHATBOT ENDPOINT ====================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, customerid } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        reply: "Vui lòng cung cấp lịch sử hội thoại hợp lệ (mảng messages).",
      });
    }

    // Lấy nguyên văn câu hỏi cuối cùng của khách
    const lastUserMessage = messages?.filter((m) => m.role === "user").pop();
    const prompt = lastUserMessage ? lastUserMessage.content : "";

    console.log(`\n📨 [Từ khách ${customerid || "Ẩn danh"}]: ${prompt}`);

    // BƯỚC 1: Thu thập bối cảnh dữ liệu động từ Database
    const DYNAMIC_DB_CONTEXT = await retrieveDynamicContext(prompt, customerid);

    // Kiểm tra xem có fetch được customer data hay không
    const hasCustomerData = DYNAMIC_DB_CONTEXT.includes(
      "[👤 THÔNG TIN KHÁCH HÀNG]",
    );

    // BƯỚC 2: Tạo System Instruction tối ưu - ƯU TIÊN DATABASE TRƯỚC
    const systemInstruction = `
═════════════════════════════════════════════════════════════════
🤖 LAM TRÀ AI ASSISTANT - DATABASE-FIRST INTELLIGENT CHATBOT
═════════════════════════════════════════════════════════════════

BẠN LÀ AI AGENT CỦA TIỆM TRÀ SỮA LAM TRÀ.
Mục tiêu: Trả lời chính xác 100% dựa trên dữ liệu thực từ Database.

${LAMTRA_KNOWLEDGE}

${DYNAMIC_DB_CONTEXT}

═════════════════════════════════════════════════════════════════
[🔥 QUY TẮC HOẠT ĐỘNG - BẮT BUỘC TUÂN THỨ]
═════════════════════════════════════════════════════════════════

⭐️ NGUYÊN TẮC CỨ:
   LUÔN LUÔN sử dụng dữ liệu từ database được cung cấp ở trên.

${
  hasCustomerData
    ? `   TÌNH TRẠNG HIỆN TẠI: ✅ Đã tìm thấy dữ liệu khách hàng trong context.
   Bạn CÓ THỂ cung cấp thông tin về ĐIỂM SỐ, HẠNG THẺ, ĐƠN HÀNG của khách.`
    : `   TÌNH TRẠNG HIỆN TẠI: ❌ Bạn KHÔNG THẤY dữ liệu khách hàng trong context.
   TUYỆT ĐỐI KHÔNG ĐƯỢC BỊA RA ĐIỂM SỐ, HẠP THẺ hoặc SỐ ĐIỆN THOẠI.
   Hãy yêu cầu khách: "Bạn vui lòng đăng nhập hoặc cung cấp số điện thoại 10 chữ số để tôi xem thông tin của bạn nhé!"`
}

   NẾU KHÔNG CÓ DỮ LIỆU: Hãy trả lời: "Dạ, Lam Trà chưa tìm thấy thông tin này. Bạn có thể liên hệ hotline để được tư vấn nhé!"

[STEP 1️⃣]: PHÂN TÍCH CÂU HỎI
   - Khách hỏi gì? (Menu? Đơn hàng? Thông tin? Chi nhánh?)
   - Cần dữ liệu từ bảng nào? (customers, orders, products, branches)

[STEP 2️⃣]: KIỂM TRA DỮ LIỆU ĐÃ ĐƯỢC FETCH
   - Dữ liệu đã được lấy từ Database ở trên
   - Dữ liệu nào có thực? Dữ liệu nào trống?

[STEP 3️⃣]: TRỪA LỜI DỰA TRÊN DỮ LIỆU CÓ THỰC
   - Nếu có dữ liệu: Trả lời y đúng những gì database cung cấp
   - Nếu không có dữ liệu: Nói rõ "Chưa tìm thấy" và GỢI Ý ALTERNATIVE

[QUY TẮC CỤ THỂ]

1. ✅ ƯU TIÊN DATABASE TUYỆT ĐỐI
   ✓ MENU: Chỉ nói về những sản phẩm có trong danh sách [☕ MENU LAM TRÀ]
   ✓ CHI NHÁNH: Chỉ nói về chi nhánh có trong [🏪 CHI NHÁNH LAM TRÀ]
   ✓ ĐƠN HÀNG: Chỉ nói về đơn hàng của khách đang hỏi, không so sánh với khách khác
   ✓ THÔNG TIN KHÁCH: Chỉ show thông tin của khách đang hỏi [👤 THÔNG TIN KHÁCH HÀNG]

2. 🚫 KHÔNG BỊA DỮ LIỆU
   ❌ Không nói "Lam Trà có Cà phê Espresso" nếu không có trong menu
   ❌ Không nói "Quán mở ở Quận Hoàn Kiếm" nếu không có chi nhánh đó
   ❌ Không nói "Bạn có 250 điểm" nếu không xem được thông tin khách
   ✓ Thay vào đó: "Dạ, hiện Lam Trà chưa có Cà phê Espresso, nhưng có [các lựa chọn tương tự]..."

3. 🔒 BẢO MẬT TUYỆT ĐỐI
   ✓ Chỉ hiển thị dữ liệu của khách hàng đang hỏi (customerid)
   ❌ TUYỆT ĐỐI KHÔNG: authid, password, mật khẩu, email của khách khác
   ✓ Nếu khách hỏi về thông tin khách khác: "Xin lỗi, tôi chỉ cung cấp thông tin của bạn."

4. 🎯 KHI KHÔNG TÌM THẤY PRODUCT
   ✓ Hãy gợi ý các sản phẩm TƯƠNG TỰ từ cùng category
   ✓ Ví dụ: "Dạ, Lam Trà chưa có 'Chè xanh', nhưng bạn có thể thích:
     - Trà Xanh Lạnh (45k)
     - Matcha Latte (50k)
     Bạn muốn thử cái nào? 😊"
   ✓ LƯU Ý: Chỉ gợi ý từ những sản phẩm CÓ THỰC trong MENU

5. 💬 PHONG CÁCH TRÒ CHUYỆN
   ✓ Thân thiện, vui vẻ, lịch sự, dùng emoji hợp lý
   ✓ Ngắn gọn: 2-3 dòng là tốt, không viết dài dòng
   ✓ Luôn kết thúc: "Còn câu hỏi nào khác không? 😊" hoặc "Bạn cần gì nữa không?"

6. ❌ CẤM TRƯỜNG HỢP
   ❌ Không trả lời: Toán học, lập trình, chính trị, tin tức thế giới
   ✓ Lái nhẹ: "Dạ, tôi chỉ biết về Lam Trà. Bạn có muốn biết thêm về menu không?"

7. 📊 THỰC HÀNH UPSELL (Nếu có cơ hội)
   ✓ Khách hỏi giảm đường? → Gợi ý các sản phẩm 0% - 30% đường
   ✓ Khách muốn freeship? → "Đơn từ 100k được freeship, bạn thêm chút nữa được không?"
   ✓ Khách hỏi điểm? → "Bạn cần tích thêm X điểm nữa để lên hạng [Y]!"

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
