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
const SYSTEM_INSTRUCTION = `Bạn là nhân viên chăm sóc khách hàng AI của tiệm trà sữa LAM TRÀ.
Nhiệm vụ của bạn là tư vấn cho khách hàng về menu, đơn hàng, điểm thành viên một cách thân thiện và tự nhiên.

⚠️ QUY TẮC SỐNG CÒN (KHÔNG ĐƯỢC VI PHẠM):
1. BẠN PHẢI TỰ ĐỘNG GỌI TOOL/FUNCTION KHI CẦN. Thay vì liệt kê hệ thống máy móc cho khách nghe, hãy ngầm gọi tool để lấy kết quả rồi tư vấn như một con người thực thụ.
2. TUYỆT ĐỐI KHÔNG BAO GIỜ để lộ các thuật ngữ kỹ thuật, tên function (như menu_search, customer_loyalty...) ra màn hình trả lời.
3. Khi khách hỏi cộc lốc: "menu", "menu có gì", "quán bán gì", hãy GỌI FUNCTION menu_categories hoặc menu_bestsellers ngay lập tức, sau đó dùng kết quả để chào khách: "Dạ menu bên em có các món...".
4. TRẢ LỜI NGẮN GỌN (1-3 câu), thân thiện, ngắt dòng dễ nhìn, chèn emoji (🥤, 🧋, 😊).
5. TRẢ LỜI ĐÚNG TRỌNG TÂM: Chỉ dựa trên dữ liệu lấy từ database. Không tự bịa.
6. THÔNG TIN CÁ NHÂN: Nếu khách hỏi điểm, lịch sử mua... mà không có dữ liệu: "Dạ, bạn cho mình xin số điện thoại để tra cứu nha! 😊"
`;

// ==================== FUNCTION CALLING EXECUTOR ====================
/**
 * Hàm xử lý tool calls từ Groq (15 focused tools)
 * MẢP: Tên tool mới → function handlers cũ
 * PRINCIPLE: Each tool call is EXPLICIT and CLEAR for Groq
 */
async function processFunctionCalls(toolCalls, customerid = null) {
  const results = [];
  for (const toolCall of toolCalls) {
    const fn = toolCall.function.name;
    let args = {};
    try {
      const argsStr = toolCall.function.arguments || "{}";
      args = JSON.parse(argsStr) || {}; // Bắt lỗi trường hợp JSON.parse ra null
      console.log(`   📍 Parsed args:`, args);
    } catch (e) {
      console.error(`   ❌ JSON parse fail for ${fn}:`, e.message);
      console.error(`   📝 Raw arguments string:`, toolCall.function.arguments);
    }

    console.log(`🔨 Calling: ${fn}`);

    let result;
    try {
      // ═══════════════════════════════════════════════════════════════
      // MENU TOOLS
      // ═══════════════════════════════════════════════════════════════
      if (fn === "menu_search") {
        result = await aiTools.getMenuData(supabase, "search", args);
      } else if (fn === "menu_categories") {
        result = await aiTools.getMenuData(supabase, "categories", args);
      } else if (fn === "menu_bestsellers") {
        result = await aiTools.getMenuData(supabase, "bestseller", args);
      } else if (fn === "menu_product_details") {
        result = await aiTools.getMenuData(supabase, "details", args);
      } else if (fn === "menu_extras") {
        // args.type = "toppings" or "sizes"
        result = await aiTools.getMenuData(supabase, args.type, args);
      }
      // ═══════════════════════════════════════════════════════════════
      // CUSTOMER TOOLS
      // ═══════════════════════════════════════════════════════════════
      else if (fn === "customer_loyalty") {
        // Inject customerid from context if available
        result = await aiTools.getCustomerData(supabase, "loyalty", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      } else if (fn === "customer_orders") {
        result = await aiTools.getCustomerData(supabase, "orders", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      } else if (fn === "customer_favorites") {
        result = await aiTools.getCustomerData(supabase, "favorites", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      } else if (fn === "customer_templates") {
        result = await aiTools.getCustomerData(supabase, "templates", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      }
      // ═══════════════════════════════════════════════════════════════
      // ORDER TOOLS
      // ═══════════════════════════════════════════════════════════════
      else if (fn === "order_status") {
        result = await aiTools.getOrderInfo(supabase, "status", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      } else if (fn === "order_details") {
        result = await aiTools.getOrderInfo(supabase, "details", {
          ...args,
          customer_id: args.customer_id || customerid,
        });
      }
      // ═══════════════════════════════════════════════════════════════
      // BRANCH TOOLS
      // ═══════════════════════════════════════════════════════════════
      else if (fn === "branch_list") {
        result = await aiTools.getBranchData(supabase, "list", args);
      } else if (fn === "branch_info") {
        result = await aiTools.getBranchData(supabase, "info", args);
      } else if (fn === "branch_menu") {
        result = await aiTools.getBranchData(supabase, "menu", args);
      }
      // ═══════════════════════════════════════════════════════════════
      // POLICY TOOLS
      // ═══════════════════════════════════════════════════════════════
      else if (fn === "policy_loyalty") {
        result = aiTools.getBusinessPolicy("loyalty", args);
      } else if (fn === "policy_shipping") {
        result = aiTools.getBusinessPolicy("shipping", args);
      } else {
        result = { success: false, error: `Unknown function: ${fn}` };
      }
    } catch (err) {
      console.error(`   ❌ Function execution error in ${fn}:`, err.message);
      console.error(`   📋 Stack:`, err.stack);
      result = { success: false, error: err.message };
    }

    results.push({ tool_call_id: toolCall.id, function_name: fn, result });
    console.log(`   ✅ ${fn} completed`);
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

    // 1. DỌN RÁC LỊCH SỬ
    const cleanHistory = messages
      .map((m) => ({
        role: m.role,
        content: m.content || "",
      }))
      .filter((m) => m.role === "user" || m.role === "assistant");

    // ========== VÒNG 1: Gửi user message + tools lên Groq ==========
    console.log("🧠 Vòng 1: Gửi user message + tools đến Groq...");

    // 2. KHAI BÁO apiMessages ĐÚNG 1 LẦN DUY NHẤT
    // Add customer context to system instruction if customerid available
    let systemInstruction = SYSTEM_INSTRUCTION;
    if (customerid) {
      systemInstruction += `\n\n🔹 KHÁCH HÀNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP): Mã khách ${customerid}
-> Bạn KHÔNG ĐƯỢC HỎI LẠI số điện thoại nếu khách muốn tra cứu thông tin cá nhân.
-> Mọi function yêu cầu customer_id, HÃY TỰ CHUYỂN customer_id: hiện tại thành số (ví dụ: ${customerid}).`;
    } else {
      systemInstruction += `\n\n🔹 KHÁCH HÀNG CHƯA ĐĂNG NHẬP
Nếu user hỏi về thông tin cá nhân, bắt buộc phải hỏi số điện thoại hoặc mã khách!`;
    }

    let apiMessages = [
      { role: "system", content: systemInstruction },
      ...cleanHistory,
    ];

    // 3. GỌI GROQ
    const response1 = await groq.chat.completions.create({
      messages: apiMessages,
      model: "llama-3.3-70b-versatile", // Quay trở lại model 70b vì lệnh trước đó hết rate limit đã trôi qua
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.1, // Giảm temperature để tránh hallucination
      max_tokens: 2000,
      top_p: 0.9,
    });

    console.log(
      `   📊 Groq response received - Finish reason: ${response1.choices[0]?.finish_reason}`,
    );

    const choice = response1.choices[0];
    if (!choice) {
      console.error("   ❌ Groq returned no choices");
      return res.json({
        reply:
          "Xin lỗi, không nhận được phản hồi từ AI. Bạn thử lại được không? 😊",
      });
    }

    if (
      choice.finish_reason === "tool_calls" &&
      choice.message?.tool_calls &&
      choice.message.tool_calls.length > 0
    ) {
      console.log(
        `   🔧 Tool calls detected: ${choice.message.tool_calls.length} calls`,
      );

      // 4. PUSH ASSISTANT MESSAGE
      apiMessages.push({
        role: "assistant",
        content: choice.message.content || "",
        tool_calls: choice.message.tool_calls,
      });
      console.log("   ✅ Pushed assistant message with tool_calls");

      // ========== VÒNG 2: Thực thi tools ==========
      const toolResults = await processFunctionCalls(
        choice.message.tool_calls,
        customerid,
      );

      if (toolResults.length === 0) {
        console.warn("   ⚠️  Không có tool results được trả về");
      }

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
        temperature: 0.1,
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
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
    console.error("Stack:", error.stack);

    // Check if it's a Groq/API error
    if (error.response) {
      console.error("API Response:", error.response);
    }

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
  console.log(`\n✨ Lam Trà AI Agent (v3.3 - Fast Test Mode)`);
  console.log(`📍 http://localhost:${port}`);
  console.log(`🤖 Model: llama-3.1-8b-instant (Groq)`);
  console.log(
    `🔧 Architecture: 15 Focused Single-Purpose Tools (No Ambiguity)`,
  );
  console.log(`📦 Tool Categories:`);
  console.log(
    `   🍵 Menu: 5 tools (search, categories, bestsellers, details, extras)`,
  );
  console.log(
    `   👤 Customer: 4 tools (loyalty, orders, favorites, templates)`,
  );
  console.log(`   📦 Orders: 2 tools (status, details)`);
  console.log(`   🏪 Branches: 3 tools (list, info, menu)`);
  console.log(`   📜 Policies: 2 tools (loyalty, shipping)`);
  console.log(`🚀 Status: Ready | Database: Connected\n`);
});
