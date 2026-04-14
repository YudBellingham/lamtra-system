const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
require("dotenv").config({
  path: path.resolve(__dirname, "../frontend-customer/.env"),
});

const { Groq } = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

// Import AI Tools
const aiTools = require("./ai_tools");
const { TOOLS } = aiTools;

const app = express();
const port = process.env.PORT || 5001;

// ==================== SUPABASE INITIALIZATION ====================
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("\n❌ CRITICAL ERROR: SUPABASE CONNECTION FAILED");
  console.error("   ❌ VITE_SUPABASE_URL không được tìm thấy");
  console.error("   ❌ VITE_SUPABASE_ANON_KEY không được tìm thấy");
  console.error("\n   📋 Vui lòng kiểm tra file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("==========================================");
console.log(
  "🚀 Đang sử dụng: Groq llama-3.3-70b-versatile + Agentic Function Calling",
);
console.log("📡 Database: Supabase (Connected)");
console.log("🛠️  AI Tools: Modularized (ai_tools/)");
console.log("==========================================");

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ==================== SYSTEM INSTRUCTION ====================
const SYSTEM_INSTRUCTION = `
═════════════════════════════════════════════════════════════════
🤖 LAM TRÀ AI ASSISTANT - AGENTIC FUNCTION CALLING v3.0
═════════════════════════════════════════════════════════════════

BẠN LÀ AI AGENT THÔNG MINH CỦA TIỆM TRÀ SỮA LAM TRÀ
Sử dụng công nghệ Function Calling để tương tác với Database một cách thông minh

CÁC NGUYÊN TẮC HOẠT ĐỘNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🔍 PHÂN TÍCH INTENT THÔNG MINH:
   - Lắng nghe câu hỏi của khách, hiểu rõ ý định thực sự
   - Xác định cần gọi hàm nào (function calling) để lấy dữ liệu
   - Nếu cần nhiều dữ liệu, gọi nhiều hàm một cách hợp lý

2. 🛠️ SỬ DỤNG FUNCTION CALLING:
   - Sử dụng các tools có sẵn trong danh sách functions để query database
   - KHÔNG BỊA RA DỮ LIỆU - LUÔN query từ database
   - Truyền tham số chính xác vào các functions

3. 💬 PHONG CÁCH TRỐNG CHUYỆN:
   - Thân thiện, tự nhiên, vui vẻ như nhân viên cửa hàng
   - CHITCHAT: Nếu khách chào hỏi, nói chuyện phiếm → Trả lời tự nhiên + khéo léo nối vào Lam Trà
   - Ngắn gọn: 2-4 dòng là tốt
   - Kết thúc với gợi ý hoặc câu hỏi lại

4. 🎯 KHI CÓ KẾT QUẢ FUNCTION:
   - Phân tích kết quả, chọn thông tin liên quan
   - Trình bày bằng ngôn ngữ tự nhiên, thân thiện
   - Nếu không có kết quả, nói rõ + gợi ý giải pháp

5. 🚫 XỨ LÝ LỖI:
   - Nếu hàm trả về lỗi, giải thích cho khách một cách tự nhiên
   - Ví dụ: "Dạ, hiện tại hệ thống đang bận. Bạn thử lại trong chốc lát được không? 😊"

6. 🔒 BẢO MẬT & QUYỀN RIÊNG TƯ:
   - TUYỆT ĐỐI KHÔNG hiển thị: authid, password, mật khẩu
   - Chỉ hiển thị dữ liệu của khách hàng đang chat
   - Luôn xác thực quyền truy cập trước khi hiển thị thông tin cá nhân

7. 📊 UPSELL TỰ NHIÊN:
   - Gợi ý sản phẩm một cách tự nhiên (không ép buộc)
   - Ví dụ: Khách hỏi trà → gợi ý topping, size
   - Khách hỏi best seller → gợi ý các sản phẩm bán chạy + combo hemat

═════════════════════════════════════════════════════════════════

THÀNH CÔ NGUÔI KHOÁ THỨNG HỎI:
- "Có món gì/danh mục nào?" → Sử dụng search_products hoặc get_products_by_category
- "Best seller?" → Sử dụng get_bestseller_products
- "Có topping gì?" → Sử dụng get_available_toppings
- "Chi nhánh ở đâu?" → Sử dụng get_all_branches hoặc get_branch_info
- "Tôi có bao nhiêu điểm?" → Sử dụng get_customer_loyalty_info
- "Đơn hàng của tôi?" → Sử dụng get_customer_orders hoặc get_order_status
- "Điều kiện giao hàng?" → Sử dụng get_shipping_policy
- "Chương trình thành viên?" → Sử dụng get_loyalty_program_info

═════════════════════════════════════════════════════════════════
`;

// ==================== FUNCTION CALLING EXECUTOR ====================
/**
 * Hàm xử lý tool calls từ Groq
 * Thực thi các functions tương ứng và trả về kết quả
 */
async function processFunctionCalls(toolCalls, customerid = null) {
  const results = [];

  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = toolCall.function.arguments;

    console.log(`🔨 Executing function: ${functionName}`);
    console.log(`   Arguments:`, JSON.stringify(args, null, 2));

    let result;

    try {
      // ========== CUSTOMER TOOLS ==========
      if (functionName === "get_customer_loyalty_info") {
        result = await aiTools.getCustomerLoyaltyInfo(
          supabase,
          args.customerid || customerid,
          args.authid,
        );
      } else if (functionName === "get_customer_orders") {
        result = await aiTools.getCustomerOrders(
          supabase,
          args.customerid || customerid,
          args.limit || 5,
          args.status_filter,
        );
      } else if (functionName === "get_customer_favorites") {
        result = await aiTools.getCustomerFavorites(
          supabase,
          args.customerid || customerid,
          args.limit || 10,
        );
      } else if (functionName === "get_customer_order_templates") {
        result = await aiTools.getCustomerOrderTemplates(
          supabase,
          args.customerid || customerid,
          args.limit || 5,
        );
      } else if (functionName === "search_customer_by_phone") {
        result = await aiTools.searchCustomerByPhone(supabase, args.phone);
      }
      // ========== MENU TOOLS ==========
      else if (functionName === "search_products") {
        result = await aiTools.searchProducts(
          supabase,
          args.keyword,
          args.limit || 10,
        );
      } else if (functionName === "get_products_by_category") {
        result = await aiTools.getProductsByCategory(
          supabase,
          args.category_name,
          args.limit || 15,
        );
      } else if (functionName === "get_bestseller_products") {
        result = await aiTools.getBestsellerProducts(supabase, args.limit || 8);
      } else if (functionName === "get_product_details") {
        result = await aiTools.getProductDetails(
          supabase,
          args.product_name,
          args.productid,
        );
      } else if (functionName === "get_available_toppings") {
        result = await aiTools.getAvailableToppings(supabase, args.limit || 20);
      } else if (functionName === "get_available_sizes") {
        result = await aiTools.getAvailableSizes(supabase);
      } else if (functionName === "get_all_categories") {
        result = await aiTools.getAllCategories(supabase);
      }
      // ========== ORDER TOOLS ==========
      else if (functionName === "get_order_status") {
        result = await aiTools.getOrderStatus(
          supabase,
          args.orderid,
          args.customerid || customerid,
        );
      } else if (functionName === "get_order_details") {
        result = await aiTools.getOrderDetails(
          supabase,
          args.orderid,
          args.customerid || customerid,
        );
      }
      // ========== BRANCH TOOLS ==========
      else if (functionName === "get_all_branches") {
        result = await aiTools.getAllBranches(
          supabase,
          args.include_closed || false,
        );
      } else if (functionName === "get_branch_info") {
        result = await aiTools.getBranchInfo(
          supabase,
          args.branch_name,
          args.branchid,
        );
      } else if (functionName === "get_branch_menu_status") {
        result = await aiTools.getBranchMenuStatus(
          supabase,
          args.branchid,
          args.branch_name,
          args.status_filter || "available",
        );
      }
      // ========== BUSINESS INFO TOOLS ==========
      else if (functionName === "get_loyalty_program_info") {
        result = aiTools.getLoyaltyProgramInfo();
      } else if (functionName === "get_shipping_policy") {
        result = aiTools.getShippingPolicyInfo();
      } else {
        result = {
          success: false,
          error: `Unknown function: ${functionName}`,
        };
      }
    } catch (err) {
      console.error(`❌ Error executing ${functionName}:`, err.message);
      result = {
        success: false,
        error: `Lỗi thực thi hàm ${functionName}: ${err.message}`,
      };
    }

    results.push({
      tool_call_id: toolCall.id,
      function_name: functionName,
      result: result,
    });

    console.log(`✅ Function ${functionName} completed`);
  }

  return results;
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

    const lastUserMessage = messages?.filter((m) => m.role === "user").pop();
    const prompt = lastUserMessage ? lastUserMessage.content : "";

    console.log(`\n📨 [Từ khách ${customerid || "Ẩn danh"}]: ${prompt}`);

    // ========== VÒNG 1: Gửi user message + tools lên Groq ==========
    console.log("🧠 Vòng 1: Gửi user message + tools đến Groq...");

    let apiMessages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...messages,
    ];

    const response1 = await groq.chat.completions.create({
      messages: apiMessages,
      model: "llama-3.3-70b-versatile",
      tools: TOOLS,
      tool_choice: "auto", // Groq tự quyết định call tool hay không
      temperature: 0.5,
      max_tokens: 2000,
      top_p: 0.9,
    });

    const choice = response1.choices[0];

    // Kiểm tra xem Groq có gọi tools không
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      console.log(
        `\n🔨 Groq yêu cầu gọi ${choice.message.tool_calls.length} tools`,
      );

      // ========== VÒNG 2: Thực thi tools ==========
      const toolResults = await processFunctionCalls(
        choice.message.tool_calls,
        customerid,
      );

      // ========== VÒNG 3: Gửi tool results lại cho Groq ==========
      console.log("\n🧠 Vòng 3: Gửi tool results lại đến Groq...");

      // Ghép lại messages bao gồm: system + user messages gốc + assistant message + tool results
      apiMessages = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...messages,
        {
          role: "assistant",
          content: choice.message.content || "",
          tool_calls: choice.message.tool_calls,
        },
        ...toolResults.map((tr) => ({
          role: "tool",
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(tr.result),
        })),
      ];

      const response2 = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 800,
        top_p: 0.9,
      });

      const responseText =
        response2.choices[0]?.message?.content ||
        "Xin lỗi, tôi đang xử lý dữ liệu. Bạn thử lại nhé! 😊";

      console.log(`✅ [Trả lời]: ${responseText.substring(0, 100)}...`);
      return res.json({ reply: responseText });
    } else {
      // Groq không cần gọi tools, trả lời trực tiếp
      console.log(`\n💬 Groq trả lời trực tiếp (không cần tools)`);

      const responseText =
        choice.message?.content ||
        "Xin lỗi, tôi không thể trả lời câu hỏi này. 😊";

      console.log(`✅ [Trả lời]: ${responseText.substring(0, 100)}...`);
      return res.json({ reply: responseText });
    }
  } catch (error) {
    console.error("\n❌ LỖI AI SERVICE:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    res.json({
      reply:
        "Xin lỗi, hiện tại hệ thống AI của Lam Trà đang bảo trì. Bạn thử lại sau vài phút nhé! 🔧",
    });
  }
});

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Lam Trà AI Agent",
    version: "3.0 (Agentic Function Calling)",
  });
});

app.listen(port, () => {
  console.log(`\n✨ Lam Trà AI Agent đang chạy tại http://localhost:${port}`);
  console.log(`🤖 Model: llama-3.3-70b-versatile`);
  console.log(`🔧 Architecture: Agentic Function Calling`);
  console.log(`📦 Tools: ${TOOLS.length} tools available`);
  console.log(`💾 Database: Supabase (Connected)\n`);
});
