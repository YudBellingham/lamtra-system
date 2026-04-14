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
- query_menu (search, category, bestseller, details, toppings, sizes)
- query_customer (loyalty, orders, favorites, templates, search)
- query_order (status, details)
- query_branch (list, info, menu)
- query_policy (loyalty, shipping)

═════════════════════════════════════════════════════════════════
`;

// ==================== FUNCTION CALLING EXECUTOR ====================
/**
 * Hàm xử lý tool calls từ Groq (5 consolidated tools tối ưu)
 * Giảm từ 19 → 5 tools, schema nhỏ hơn 73%
 */
async function processFunctionCalls(toolCalls, customerid = null) {
  const results = [];
  for (const toolCall of toolCalls) {
    const fn = toolCall.function.name;
    const args = toolCall.function.arguments;
    console.log(`🔨 ${fn}/${args.type}`);
    let result;
    try {
      if (fn === "query_menu") {
        result = await aiTools.getMenuData(supabase, args.type, args);
      } else if (fn === "query_customer") {
        result = await aiTools.getCustomerData(supabase, args.type, {
          ...args,
          customerid: args.customerid || customerid,
        });
      } else if (fn === "query_order") {
        result = await aiTools.getOrderInfo(supabase, args.type, {
          ...args,
          customerid: args.customerid || customerid,
        });
      } else if (fn === "query_branch") {
        result = await aiTools.getBranchData(supabase, args.type, args);
      } else if (fn === "query_policy") {
        result = aiTools.getBusinessPolicy(args.type, args);
      } else {
        result = { success: false, error: `Unknown: ${fn}` };
      }
    } catch (err) {
      console.error(`❌ ${fn}:`, err.message);
      result = { success: false, error: err.message };
    }
    results.push({ tool_call_id: toolCall.id, function_name: fn, result });
    console.log(`✅ ${fn}/${args.type}`);
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
    if (
      choice.finish_reason === "tool_calls" &&
      choice.message.tool_calls &&
      choice.message.tool_calls.length > 0
    ) {
      console.log(
        `\n🔨 Groq yêu cầu gọi ${choice.message.tool_calls.length} tools`,
      );

      // ⚠️ CRITICAL STEP 1: PUSH assistant message (nguyên gốc từ Groq) vào apiMessages
      // Điều này BẮTBUỘC trước khi push tool results
      apiMessages.push(choice.message);
      console.log("   ✅ Pushed assistant message with tool_calls");

      // ========== VÒNG 2: Thực thi tools ==========
      const toolResults = await processFunctionCalls(
        choice.message.tool_calls,
        customerid,
      );

      // ========== VÒNG 3: PUSH tool results vào apiMessages ==========
      console.log("\n🧠 Vòng 3: Push tool results vào messages...");

      // STEP 2: Push từng tool result vào apiMessages (ngay sau assistant message)
      for (const tr of toolResults) {
        const toolMessage = {
          role: "tool",
          tool_call_id: tr.tool_call_id,
          content:
            typeof tr.result === "string"
              ? tr.result
              : JSON.stringify(tr.result),
        };
        apiMessages.push(toolMessage);
        console.log(`   ✅ Pushed tool result: ${tr.tool_call_id}`);
      }

      // Log sequence for debugging
      console.log(
        `   📍 Final message sequence: system + original msgs + assistant_toolcalls + ${toolResults.length} tool_results`,
      );

      // ========== VÒNG 3: Gửi apiMessages (đã update) lại cho Groq ==========
      console.log("   🔄 Gửi API call lần 2 đến Groq...");

      const response2 = await groq.chat.completions.create({
        messages: apiMessages, // Sử dụng mảng đã được update
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 800,
        top_p: 0.9,
        // NOTE: Không gửi tools lần 2 - chỉ để hoàn thành response
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
  console.log(`\n✨ Lam Trà AI Agent (v3.1 - Optimized)`);
  console.log(`📍 http://localhost:${port}`);
  console.log(`🤖 Model: llama-3.3-70b-versatile (Groq)`);
  console.log(
    `🔧 Architecture: Agentic Function Calling (5 consolidated tools)`,
  );
  console.log(`📦 Tools: ${TOOLS.length} tools | 73% context reduction`);
  console.log(`🚀 Status: Ready | Database: Connected\n`);
});
