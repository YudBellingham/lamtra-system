# 🤖 AI Chatbot API Documentation

## Overview

**Service**: Groq LLM (llama-3.3-70b) with Agentic Function Calling  
**Base URL**: `http://localhost:5001`  
**Port**: 5001  
**Authentication**: Customer ID (via Supabase Auth)

---

## Endpoints

### 1. Chat with AI

**POST** `/api/chat`

#### Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Tôi muốn uống Matcha"
    }
  ],
  "customerid": 18
}
```

#### Response

```json
{
  "reply": "Dạ bạn, em có những món Matcha sau đây: matcha latte, Matcha kem cốm, trà sữa Matcha. Bạn muốn chọn cái nào vậy? 🧋"
}
```

#### Status Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 200  | Success                    |
| 400  | Invalid request            |
| 429  | Rate limit exceeded (Groq) |
| 500  | Server error               |

---

## 15 AI Tools (Function Calling)

### Menu Tools (5)

#### 1. menu_search

Search products by keyword  
**Parameters**: `keyword` (string, required), `limit` (integer, default 10)

#### 2. menu_categories

Get all product categories  
**Parameters**: `limit` (integer, default 20)

#### 3. menu_bestsellers

Get best-selling/popular products  
**Parameters**: `limit` (integer, default 5)

#### 4. menu_product_details

Get detailed info about a product  
**Parameters**: `product_id` (integer) OR `product_name` (string)

#### 5. menu_extras

Get toppings or sizes  
**Parameters**: `type` (enum: "toppings", "sizes"), `limit` (integer, default 20)

---

### Customer Tools (4)

#### 6. customer_loyalty

Get loyalty points & membership info  
**Parameters**: `customer_id` (integer), `phone_number` (string)

#### 7. customer_orders

Get order history  
**Parameters**: `customer_id` (integer), `order_status` (string), `limit` (integer)

#### 8. customer_favorites

Get favorite products  
**Parameters**: `customer_id` (integer), `limit` (integer)

#### 9. customer_templates

Get saved drink templates/combos  
**Parameters**: `customer_id` (integer), `limit` (integer)

---

### Order Tools (2)

#### 10. order_status

Get current order status  
**Parameters**: `order_id` (string), `customer_id` (integer, optional)

#### 11. order_details

Get detailed order info with items  
**Parameters**: `order_id` (string)

---

### Branch Tools (3)

#### 12. branch_list

Get all Lam Trà branches  
**Parameters**: `include_inactive` (boolean, default false)

#### 13. branch_info

Get details about a specific branch  
**Parameters**: `branch_id` (integer) OR `branch_name` (string)

#### 14. branch_menu

Get products available at a branch  
**Parameters**: `branch_id` (integer), `product_status` (enum: "available", "unavailable", "all")

---

### Policy Tools (2)

#### 15. policy_loyalty

Get loyalty program info  
**Parameters**: None

#### 16. policy_shipping

Get shipping & delivery info  
**Parameters**: None

---

## Authentication

### Customer Context Injection

When a user is logged in, the system automatically injects their `customerid`:

```javascript
const systemInstruction = `
...
🔹 KHÁCH HÀNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP): Mã khách ${customerid}
-> Bạn KHÔNG ĐƯỢC HỎI LẠI số điện thoại nếu khách muốn tra cứu thông tin cá nhân.
-> Mọi function yêu cầu customer_id, HÃY TỰ CHUYỂN customer_id: hiện tại thành số (ví dụ: ${customerid}).
`;
```

**Result**: AI automatically detects logged-in user, no need to ask for phone number

---

## Example Flows

### Flow 1: Search Menu

```
User: "Tôi muốn uống gì có chứa Matcha?"
→ AI calls: menu_search(keyword="Matcha", limit=10)
→ DB returns: [matcha latte, Matcha kem cốm, trà sữa Matcha]
→ AI replies: "Em có 3 món Matcha: ..."
```

### Flow 2: Check Loyalty Points (Auto-detect)

```
User: "Tôi có bao nhiêu điểm?"
Logged-in user: customerid=18
→ AI calls: customer_loyalty(customer_id=18)
→ DB returns: {totalpoints: 250, membership: "Silver"}
→ AI replies: "Bạn có 250 điểm, hạng Bạc. Chúc mừng! 🎉"
```

### Flow 3: Order Tracking

```
User: "Đơn hàng của tôi đâu rồi?"
→ AI asks: "Bạn cho mình xin số Order ID nhé"
User: "ORD-2026-001"
→ AI calls: order_status(order_id="ORD-2026-001", customer_id=18)
→ DB returns: {status: "delivering", finalamount: 45000}
→ AI replies: "Đơn hàng đang giao, về mau thôi! 🚚"
```

---

## Error Handling

### Rate Limit (429)

Groq free tier: 100,000 tokens/day

```json
{
  "error": {
    "message": "Rate limit reached for model `llama-3.3-70b-versatile`...",
    "code": "rate_limit_exceeded"
  }
}
```

**Solution**: Wait 13m+ or upgrade Groq plan

### Schema Validation (400)

Invalid tool parameter type

```json
{
  "error": {
    "message": "invalid JSON schema for tool order_status...",
    "type": "invalid_request_error"
  }
}
```

**Solution**: Check tool schema in `tool_registry.js`

---

## Performance Tips

✅ Temperature: 0.1 (stable, less hallucination)  
✅ Max tokens: 2000 (first call), 800 (second call)  
✅ Message history: Last 6 messages only  
✅ No status filter on menu queries (get real data)  
✅ Cache branch info (change less frequently)

---

## Testing

```bash
# Start AI Service
cd ai-service
npm install
node server.js

# Test via PowerShell
$body = @{
  messages = @(@{ role = "user"; content = "menu có gì?" });
  customerid = 18
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5001/api/chat `
  -Method POST `
  -ContentType "application/json" `
  -Body $body | Select-Object -Expand Content
```

---

**Last Updated**: April 14, 2026
