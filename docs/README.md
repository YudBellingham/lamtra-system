# 📚 Documentation – Lamtra Online Milk Tea (Customer Edition)

Thư mục `docs/` chứa toàn bộ tài liệu cho **Lamtra Online Milk Tea System**, tập trung vào **trải nghiệm khách hàng** (từ duyệt menu, đặt hàng, thanh toán, cho đến tương tác AI Chatbot).

---

## 📂 Cấu trúc Thư mục

```
docs/
├── user-guides/
│   └── CUSTOMER_GUIDE.md              # 📖 Hướng dẫn khách hàng chi tiết
│
├── api-specifications/
│   └── AI_CHATBOT_API.md              # 🤖 API của AI Chatbot (15 tools)
│
├── architecture-diagrams/             # 🏗️ Sơ đồ kiến trúc
│   ├── system-architecture.md         # Tổng quan 3-tier (Frontend+Backend+AI)
│   ├── customer-order-flow.md         # Luồng đặt hàng
│   └── ...
│
└── README.md                           # 📄 File này
```

---

## 🎯 Phạm vi Tài liệu

✅ **Chỉ tập trung vào Customer Edition:**

- Cách sử dụng website/app
- Đặt hàng, thanh toán, tracking
- Hệ thống loyalty & voucher
- Chat với AI Chatbot
- Tích hợp Zalo OA

✅ **Bao gồm chi tiết kỹ thuật:**

- API endpoints (AI Chatbot)
- 15 AI tools (specifications)
- Luồng dữ liệu (order flow, auth, payment)
- Kiến trúc hệ thống (microservices)

❌ **Không bao gồm:**

- Admin panel documentation (nằm ở repository khác)
- Tài liệu deploy/DevOps (nằm riêng)
- Tài liệu internal team (không cần)

---

## 📖 1. User Guides

### [`user-guides/CUSTOMER_GUIDE.md`](./user-guides/CUSTOMER_GUIDE.md)

**Hướng dẫn từng bước cho khách hàng sử dụng hệ thống:**

| Phần          | Nội dung                                      |
| ------------- | --------------------------------------------- |
| 🎯 Bắt đầu    | Cách truy cập website, đăng ký tài khoản      |
| 🔑 Xác thực   | Đăng ký, đăng nhập, quên mật khẩu             |
| 🛍️ Duyệt Menu | Xem danh mục, tìm kiếm, xem chi tiết sản phẩm |
| 🛒 Đặt Hàng   | Thêm vào giỏ, chọn size/topping, check out    |
| 💳 Thanh toán | VNPay (online), COD (khi giao)                |
| 🎁 Voucher    | Tìm khuyến mãi, áp dụng mã, tính tiền         |
| ⭐ Loyalty    | Tích điểm, nâng level, nhận ưu đãi            |
| 📦 Tracking   | Xem trạng thái đơn hàng, lịch sử              |
| 📍 Chi nhánh  | Tìm cửa hàng, giờ mở cửa, vị trí              |
| 💬 AI Chat    | Chat với bot, hỏi menu, tra thông tin         |
| 📱 Zalo       | Liên hệ trực tiếp qua Zalo OA                 |
| ⭐ Feedback   | Để lại đánh giá sau mua hàng                  |

---

## 🤖 2. API Specifications

### [`api-specifications/AI_CHATBOT_API.md`](./api-specifications/AI_CHATBOT_API.md)

**Tài liệu API chi tiết cho Groq LLM AI Chatbot:**

**Endpoint chính:**

```
POST http://localhost:5001/api/chat
```

**Tính năng:**

- 🔗 Agentic Function Calling (tự động gọi tools)
- 📊 15 tools được ghép thành 5 nhóm
- 🎯 Smart context injection (tự phát hiện user đăng nhập)
- 💬 Conversation history management
- ⚡ Fast response (<2s latencies)

**5 nhóm Tools:**

1. **Menu Tools (5)** - Tìm/duyệt menu, toppings, sizes
2. **Customer Tools (4)** - Thông tin khách, loyalty, vouchers
3. **Order Tools (2)** - Danh sách đơn, trạng thái
4. **Branch Tools (2)** - Danh sách chi nhánh, giờ mở cửa
5. **Policy Tools (2)** - Phí ship, quy tắc loyalty

---

## 🏗️ 3. Architecture Diagrams

Thư mục `architecture-diagrams/` chứa các sơ đồ chi tiết:

### Các sơ đồ chính:

1. **System Architecture** 🏢
   - 3-tier: Frontend (React) → Backend (Express) → Database (Supabase)
   - AI Service (Groq) kết nối Frontend + Backend
   - External integrations (VNPay, Zalo, Goong)

2. **Customer Order Flow** 📦
   - Khách chọn sản phẩm → Giỏ hàng → Checkout
   - Chọn phương thức thanh toán
   - Xác nhận đơn → Giao hàng → Đánh giá

3. **Auth Flow** 🔐
   - Đăng ký → Xác thực email → JWT token
   - Đăng nhập → Token lưu localStorage
   - Gợi ý lại mật khẩu

4. **Payment Flow** 💳
   - Frontend gọi Backend → Backend gọi VNPay
   - VNPay trả về kết quả → Update order status
   - Email xác nhận gửi khách hàng

5. **AI Chatbot Flow** 🤖
   - User nhập tin nhắn → Frontend gửi Backend/AI
   - AI phân tích → Gọi tools (menu, order, loyalty)
   - Tools lấy dữ liệu Supabase → Trả về kết quả
   - AI ghép text response → Gửi lại user

6. **Database Schema** 🗄️
   - 30 bảng PostgreSQL (chi tiết xem `DATABASE_SCHEMA.md`)
   - Quan hệ giữa bảng (relationships)
   - Indexes & constraints

---

## 📊 Tech Stack Chi Tiết

| Layer        | Công nghệ                    | Tác vụ                                   |
| ------------ | ---------------------------- | ---------------------------------------- |
| **Frontend** | React 18 + TypeScript + Vite | UI khách hàng, state management, routing |
| **Backend**  | Node.js + Express + Supabase | REST API, business logic, integrations   |
| **AI**       | Groq SDK (llama-3.3-70b)     | LLM, function calling, smart responses   |
| **Database** | Supabase PostgreSQL          | 30 tables, RLS, Auth, real-time          |
| **Payments** | VNPay                        | Thanh toán online                        |
| **Maps**     | Goong API                    | Tính toán khoảng cách chi nhánh          |
| **Chat**     | Zalo SDK                     | Widget tích hợp trên website             |
| **Email**    | Nodemailer                   | Gửi xác nhận, thông báo                  |

---

## 🔐 Bảo mật & Best Practices

✅ **Authentication:**

- Supabase JWT tokens (HTTPS only)
- Password hashing (bcrypt)
- RLS policies trên database

✅ **Data Protection:**

- CORS whitelist
- SQL injection prevention (Supabase SDK)
- Rate limiting trên API

✅ **Privacy:**

- PII stored securely (Supabase)
- Payment data NEVER stored locally
- GDPR compliant

---

## 📈 Performance Optimization

- ⚡ Vite fast refresh (Frontend dev speed)
- 📦 Code splitting & lazy loading
- 🗄️ Database query caching
- 🚀 Groq LLM optimized (70B model)
- 🔄 Connection pooling (Supabase)

---

## 🎓 Tài liệu bổ sung

### [`DATABASE_SCHEMA.md`](../DATABASE_SCHEMA.md)

Chi tiết 30 bảng PostgreSQL (xem ở root directory)

### [`README.md`](../README.md)

Hướng dẫn chạy dự án, kiến trúc tổng thể

---

## 📅 Version History

| Version | Ngày     | Thay đổi                              |
| ------- | -------- | ------------------------------------- |
| 1.0     | Apr 2026 | Documentation for Customer Edition v1 |

---

## 🎯 Mục đích mỗi tài liệu

| Tài liệu                   | Dành cho             | Mục đích                           |
| -------------------------- | -------------------- | ---------------------------------- |
| **CUSTOMER_GUIDE.md**      | Khách hàng, Hỗ trợ   | Hướng dẫn sử dụng chi tiết         |
| **AI_CHATBOT_API.md**      | Lập trình viên       | API spec, tool definitions         |
| **architecture-diagrams/** | Architect, Tech Lead | Kiến trúc, design patterns         |
| **DATABASE_SCHEMA.md**     | Backend Dev, DBA     | Schema, relationships, constraints |
| **README.md**              | Developers (tất cả)  | Project overview, setup            |

---

## 🤝 Cách đóng góp

- 📝 Update tài liệu khi có feature mới
- 🐛 Báo lỗi/sai trong docs
- 💡 Gợi ý cải thiện tài liệu
- 🌐 Dịch sang ngôn ngữ khác (nếu cần)

---

## 📞 Hỗ trợ

📖 **Hướng dẫn khách hàng**: Xem [`CUSTOMER_GUIDE.md`](./user-guides/CUSTOMER_GUIDE.md)  
🤖 **API Documentation**: Xem [`AI_CHATBOT_API.md`](./api-specifications/AI_CHATBOT_API.md)  
💬 **Chat với AI**: Trên website, click icon chat  
📱 **Zalo OA**: Scan QR hoặc tìm "Lam Trà"

---

© 2026 – **Lamtra Online Milk Tea System** | Customer Edition
