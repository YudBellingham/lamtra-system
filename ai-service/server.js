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

// Function để AI analyze và suggest cần query bảng nào
async function analyzeQueryNeedsWithAI(prompt, customerid = null) {
  try {
    const analysisPrompt = `
Bạn là chuyên gia phân tích dữ liệu. Dựa trên câu hỏi của khách: "${prompt}"

Hãy xác định câu hỏi này cần dữ liệu từ bảng nào trong số:
1. customers - Thông tin khách hàng (điểm, hạng, tài khoản)
2. orders - Lịch sử đơn hàng (đơn hàng, trạng thái)  
3. products - Menu sản phẩm (món, giá, danh mục)
4. branches - Chi nhánh (địa chỉ, giờ mở)

Trả lời NGẮN GỌN theo format: "TABLES: [bảng1, bảng2]"
Ví dụ: "TABLES: products, categories" hoặc "TABLES: customers"
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: analysisPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 100,
    });

    const responseText = response.choices[0]?.message?.content || "";
    const tableMatch = responseText.match(/TABLES:\s*\[(.*?)\]/i);
    const suggestedTables = tableMatch
      ? tableMatch[1]
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => Object.keys(TABLE_DESCRIPTORS).includes(t))
      : [];

    return suggestedTables.length > 0
      ? suggestedTables
      : ["products", "branches"]; // Default fallback
  } catch (err) {
    console.warn("⚠️ Lỗi khi analyze query:", err.message);
    return ["products"]; // Safe fallback
  }
}

// ==================== UTILITY: Extract phone number from prompt ====================
function extractPhoneNumber(text) {
  const phoneRegex = /\b([0-9]{10})\b/; // 10 chữ số liên tiếp
  const match = text.match(phoneRegex);
  return match ? match[1] : null;
}

// BƯỚC 1: DYNAMIC CONTEXT RETRIEVAL (AI-Driven, No Manual If-Else)
async function retrieveDynamicContext(prompt, customerid = null) {
  let contextData = "\n═══════════════════════════════════════";
  contextData += "\n[📊 SCHEMA AVAILABLE]";
  contextData += `\n${DATABASE_SCHEMA}`;
  contextData += `\n${LAMTRA_KNOWLEDGE}`;

  // 🔑 Cờ để kiểm tra xem có tìm được customer data hay không
  let hasCustomerData = false;

  try {
    // ✅ STEP 1: Dùng AI để analyze câu hỏi và xác định cần query bảng nào
    console.log("🧠 Analyzing query with AI...");
    const suggestedTables = await analyzeQueryNeedsWithAI(prompt, customerid);
    console.log(`   → Suggested tables: ${suggestedTables.join(", ")}`);

    // ✅ STEP 2: Fetch dữ liệu từ các bảng được suggest
    const fetchedData = {};

    // 🔍 LƯU Ý: Tìm kiếm khách hàng bằng số điện thoại nếu không có customerid
    let effectiveCustomerId = customerid;
    if (suggestedTables.includes("customers")) {
      // Thử tìm số điện thoại trong prompt
      const phoneFromPrompt = extractPhoneNumber(prompt);
      if (phoneFromPrompt && !customerid) {
        console.log(
          `📞 Phát hiện số điện thoại trong prompt: ${phoneFromPrompt}`,
        );
        try {
          const { data: customerByPhone } = await supabase
            .from("customers")
            .select(
              "customerid, fullname, email, phone, membership, totalpoints, accumulated_points, birthday",
            )
            .eq("phone", phoneFromPrompt)
            .single();
          if (customerByPhone) {
            effectiveCustomerId = customerByPhone.customerid;
            fetchedData.customer = customerByPhone;
            hasCustomerData = true;
            console.log(
              `✅ Tìm thấy khách hàng từ số điện thoại: ${customerByPhone.fullname}`,
            );
          }
        } catch (err) {
          console.warn(
            "⚠️ Không tìm thấy khách hàng bằng số điện thoại:",
            err.message,
          );
        }
      }

      // Nếu có customerid hoặc vừa tìm thấy từ phone
      if (effectiveCustomerId && !fetchedData.customer) {
        try {
          const { data } = await supabase
            .from("customers")
            .select(
              "fullname, email, phone, membership, totalpoints, accumulated_points, birthday",
            )
            .eq("customerid", effectiveCustomerId)
            .single();
          if (data) {
            fetchedData.customer = data;
            hasCustomerData = true;
          }
        } catch (err) {
          console.warn("⚠️ Lỗi lấy customer:", err.message);
        }
      }

      // 🚫 Nếu không tìm được customer data: thêm cảnh báo
      if (!hasCustomerData && suggestedTables.includes("customers")) {
        contextData += "\n\n[⚠️ HỆ THỐNG CẢNH BÁO]";
        contextData +=
          "\nKhách chưa đăng nhập và chưa cung cấp số điện thoại hợp lệ.";
        contextData +=
          "\nTUYỆT ĐỐI KHÔNG ĐƯỢC ĐOÁN SỐ ĐIỂM, SỐ ĐIỆN THOẠI hoặc HẠNG THẺ của khách.";
        contextData +=
          "\nHãy yêu cầu khách đăng nhập lại hoặc cung cấp số điện thoại.";
      }
    }

    // Nếu AI suggest lấy order info
    if (suggestedTables.includes("orders") && effectiveCustomerId) {
      try {
        const { data } = await supabase
          .from("orders")
          .select("orderid, status, finalamount, orderdate, address_detail")
          .eq("customerid", effectiveCustomerId)
          .order("orderdate", { ascending: false })
          .limit(10);
        if (data && data.length > 0) {
          fetchedData.orders = data;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy orders:", err.message);
      }
    }

    // Nếu AI suggest lấy product info - LẤY TOÀN BỘ MENU + TÌM KIẾM CỤ THỂ
    if (suggestedTables.includes("products")) {
      try {
        // 📌 Fetch toàn bộ menu
        let { data } = await supabase
          .from("products")
          .select(
            "productid, name, baseprice, description, imageurl, isactive, categories(categoryid, name)",
          )
          .eq("isactive", true);

        // 🔍 TỐI ƯU: Tìm kiếm à việc khách đang hỏi về món ăn cụ thể nào
        // Nếu prompt có chứa từ khóa, sắp xếp để những món khớp lên đầu
        const displayedProducts = [];
        const keywords = prompt
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((w) => w.length > 2);

        if (data && data.length > 0 && keywords.length > 0) {
          // Phân loại sản phẩm: có khớp từ khóa hay không
          const matchedProducts = [];
          const unmatchedProducts = [];

          data.forEach((p) => {
            const productName = p.name.toLowerCase();
            const description = (p.description || "").toLowerCase();
            const isMatched = keywords.some(
              (kw) => productName.includes(kw) || description.includes(kw),
            );
            if (isMatched) {
              matchedProducts.push(p);
            } else {
              unmatchedProducts.push(p);
            }
          });

          // Lôi những món khớp lên đầu context
          displayedProducts.push(...matchedProducts, ...unmatchedProducts);
          console.log(
            `🔍 Tìm thấy ${matchedProducts.length} sản phẩm khớp từ khóa`,
          );
        } else {
          displayedProducts.push(...(data || []));
        }

        if (displayedProducts.length > 0) {
          fetchedData.products = displayedProducts;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy products:", err.message);
      }
    }

    // Nếu AI suggest lấy branch info
    if (suggestedTables.includes("branches")) {
      try {
        const { data } = await supabase
          .from("branches")
          .select(
            "branchid, name, address, phone, opentime, closetime, lat, lng",
          )
          .eq("isactive", true);

        if (data && data.length > 0) {
          fetchedData.branches = data;
        }
      } catch (err) {
        console.warn("⚠️ Lỗi lấy branches:", err.message);
      }
    }

    // ✅ STEP 3: Format dữ liệu thành readable context cho AI
    if (
      Object.keys(fetchedData).length === 0 &&
      !customerid &&
      suggestedTables.includes("orders")
    ) {
      contextData +=
        "\n[📋 LƯỚI Ý]: Khách chưa đăng nhập nên không thể xem lịch sử đơn hàng.";
    } else {
      if (fetchedData.customer) {
        contextData += `
[👤 THÔNG TIN KHÁCH HÀNG]
Tên: ${fetchedData.customer.fullname}
Email: ${fetchedData.customer.email}
Điện thoại: ${fetchedData.customer.phone}
Hạng thẻ: ${fetchedData.customer.membership}
Điểm hiện có: ${fetchedData.customer.totalpoints}
Điểm tích luỹ tổng: ${fetchedData.customer.accumulated_points}
Sinh nhật: ${fetchedData.customer.birthday || "Chưa cập nhật"}`;
      }

      if (fetchedData.orders && fetchedData.orders.length > 0) {
        contextData += `\n\n[🛒 LỊCH SỬ ĐƠN HÀNG - ${fetchedData.orders.length} đơn gần đây]`;
        fetchedData.orders.forEach((o) => {
          contextData += `
- Đơn #${o.orderid}
  Ngày: ${new Date(o.orderdate).toLocaleDateString("vi-VN")}
  Trạng thái: ${o.status}
  Tổng tiền: ${o.finalamount?.toLocaleString()}đ
  Địa chỉ: ${o.address_detail || "Chưa có"}`;
        });
      }

      if (fetchedData.products && fetchedData.products.length > 0) {
        // Nhóm theo category
        const grouped = {};
        fetchedData.products.forEach((p) => {
          const cat = p.categories?.name || "Khác";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(p);
        });

        contextData += `\n\n[☕ MENU LAM TRÀ - ${fetchedData.products.length} sản phẩm]`;
        Object.entries(grouped).forEach(([cat, products]) => {
          contextData += `\n\n📌 ${cat}:`;
          products.forEach((p) => {
            contextData += `
   • ${p.name} - ${p.baseprice?.toLocaleString()}đ`;
            if (p.description)
              contextData += `
     Mô tả: ${p.description}`;
          });
        });
      }

      if (fetchedData.branches && fetchedData.branches.length > 0) {
        contextData += `\n\n[🏪 CHI NHÁNH LAM TRÀ - ${fetchedData.branches.length} chi nhánh]`;
        fetchedData.branches.forEach((b) => {
          contextData += `
- ${b.name}
  Địa chỉ: ${b.address}
  Điện thoại: ${b.phone}
  Giờ mở: ${b.opentime || "8:00"} - ${b.closetime || "22:00"}`;
        });
      }
    }

    contextData += "\n═══════════════════════════════════════\n";
    return contextData;
  } catch (err) {
    console.error("❌ Lỗi retrieveDynamicContext:", err.message);
    return LAMTRA_KNOWLEDGE;
  }
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
