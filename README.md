# ☕ Lamtra Online Milk Tea System – Customer Edition

Hệ thống bán trà sữa trực tuyến cho chuỗi **Lam Trà (Lamtra)**, xây dựng với kiến trúc **Microservices** (Frontend, Backend, AI Service tách biệt), tích hợp AI Chatbot thông minh và Zalo OA để tăng trải nghiệm khách hàng.

---

## 🎯 Mục tiêu dự án

✅ Xây dựng **website bán trà sữa hiện đại** cho khách hàng  
✅ Tích hợp **AI Chatbot tự động** kinh doanh (tư vấn menu, theo đơn, loyalty)  
✅ Kết nối **Zalo OA** để liên hệ trực tiếp & nhanh chóng  
✅ Thiết kế kiến trúc **mở rộng, bảo trì dễ dàng**  
✅ Bảo mật dữ liệu khách hàng bằng **Supabase Auth**

---

## 🏗️ Kiến trúc Microservices

```
📦 lamtra-system (Monorepo)
│
├── 🎨 frontend-customer/        React 18 + TypeScript + Vite
│   ├── pages/                   (HomePage, SanPham, Cart, Auth, Profile, OrderTracking...)
│   ├── components/              (Header, Footer, Chatbot, Zalo Widget)
│   └── services/                (Supabase Auth, API calls)
│
├── 🔧 backend-api/              Node.js + Express + Supabase
│   ├── API Routes               (Products, Orders, Payment VNPay, Branches, Email)
│   ├── Supabase Integration     (30 tables: products, orders, customers, loyalty...)
│   └── External Services        (Goong Distance API, Nodemailer, VNPay Gateway)
│
├── 🤖 ai-service/               Groq LLM + Express + Function Calling
│   ├── server.js                (Express API + Groq client)
│   ├── ai_tools/                (15 focused tools: menu, customer, orders, branches, policies)
│   └── Supabase Integration     (Query products, orders, loyalty data)
│
├── 📊 Database (Cloud)           Supabase PostgreSQL (30 tables)
│   ├── Auth Module              (Users, sessions via JWT)
│   └── Data Tables              (Products, orders, customers, inventory...)
│
├── 📚 docs/                      Documentation
│   ├── user-guides/             (Customer user guide)
│   ├── api-specifications/      (AI Chatbot API)
│   └── architecture-diagrams/   (System diagrams)
│
└── 📖 DATABASE_SCHEMA.md         Full schema definition
```

---

## 💻 Tech Stack Chi Tiết

| Layer            | Công nghệ                                       | Port  |
| ---------------- | ----------------------------------------------- | ----- |
| **Frontend**     | React 18 + TypeScript + Vite + TailwindCSS      | 5173  |
| **Backend**      | Node.js + Express + Supabase SDK                | 8000  |
| **AI Service**   | Groq SDK (llama-3.3-70b) + Function Calling     | 5001  |
| **Database**     | Supabase (PostgreSQL 15) + JWT Auth             | Cloud |
| **Integrations** | Zalo API, VNPay Payment, Goong Maps, Nodemailer | -     |
| **DevTools**     | TypeScript, ESLint, Vite, React Router v7       | -     |

---

## 🚀 Hướng dẫn chạy dự án

### ⚙️ Chuẩn bị

1. Clone repo:

```bash
git clone https://github.com/YudBellingham/lamtra-system.git
cd lamtra-system
```

2. Tạo `.env` files (xem `.env.example` từng folder)

---

### 1️⃣ Frontend Customer (React)

```bash
cd frontend-customer
npm install
npm run dev
```

✅ Truy cập: **http://localhost:5173**

**Tính năng:**

- 🛍️ Duyệt menu & tìm kiếm sản phẩm
- 🛒 Giỏ hàng, thanh toán VNPay
- 👤 Đăng ký/Đăng nhập (Supabase Auth)
- 📊 Xem lịch sử đơn hàng & trạng thái
- ⭐ Hệ thống điểm thành viên & voucher
- 💬 Chat với AI Chatbot (Bottom-right)
- 📱 Zalo OA widget (Bottom-right)
- 📍 Tìm chi nhánh gần nhất
- 📰 Tin tức & tuyển dụng
- ⭐ Đánh giá & phản hồi

**File cấu trúc:**

```
src/
├── pages/              (HomePage, SanPham, Cart, Auth, Profile...)
├── components/         (Header, Footer, Chatbot, ThirdPartyWidget)
├── context/            (CartContext)
├── lib/                (supabase.ts config)
└── services/           (API calls)
```

---

### 2️⃣ Backend API (Node.js)

```bash
cd backend-api
npm install
npm start
```

✅ Chạy tại: **http://localhost:8000**

**Chức năng:**

- 📦 API REST cho sản phẩm, đơn hàng, khách hàng
- 💳 Tích hợp VNPay (thanh toán online)
- 📧 Gửi email (xác nhận đơn, reset password)
- 📍 Tính toán khoảng cách chi nhánh (Goong API)
- 🔐 Xác thực qua Supabase JWT
- 💾 Quản lý dữ liệu 30 bảng PostgreSQL

**Routes:**

- `POST /api/products` - Danh sách sản phẩm
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn
- `POST /api/payment/vnpay` - Khởi tạo thanh toán
- `GET /api/branches` - Danh sách chi nhánh
- Và nhiều routes khác...

---

### 3️⃣ AI Service (Groq LLM)

```bash
cd ai-service
npm install
node server.js
```

✅ Chạy tại: **http://localhost:5001/api/chat**

**Công nghệ:**

- 🤖 Groq SDK (mô hình: `llama-3.3-70b-versatile`)
- 🔗 **Agentic Function Calling** (15 tools đơn lẻ)
- 🧠 Tự động gọi tools mà không cần hướng dẫn tường minh
- 🎯 Smart Customer Context Injection (tự detect khách đăng nhập)

**15 AI Tools được chia thành 5 nhóm:**

1. **Menu Tools** (5 tools)
   - `menu_search` - Tìm kiếm sản phẩm theo từ khóa
   - `menu_categories` - Danh sách danh mục
   - `menu_bestsellers` - Sản phẩm bán chạy
   - `menu_product_details` - Chi tiết sản phẩm
   - `menu_extras` - Topping & kích thước

2. **Customer Tools** (4 tools)
   - `customer_info` - Thông tin khách hàng
   - `customer_loyalty` - Điểm thành viên
   - `customer_history` - Lịch sử mua hàng
   - `customer_vouchers` - Voucher có sẵn

3. **Order Tools** (2 tools)
   - `order_list` - Danh sách đơn hàng
   - `order_status` - Trạng thái đơn hàng

4. **Branch Tools** (2 tools)
   - `branch_list` - Danh sách chi nhánh
   - `branch_hours` - Giờ mở cửa

5. **Policy Tools** (2 tools)
   - `policy_shipping` - Phí giao hàng & điều kiện
   - `policy_loyalty` - Quy tắc điểm & ưu đãi

---

## 🎯 Tính năng chính

### 👥 Từ phía Khách hàng

| Tính năng     | Chi tiết                               |
| ------------- | -------------------------------------- |
| 🏪 Menu       | Duyệt menu theo danh mục, xem giá      |
| 🔍 Tìm kiếm   | Gõ tên sản phẩm, AI gợi ý              |
| 🛒 Giỏ hàng   | Thêm/xóa sản phẩm, chọn size & topping |
| 💳 Thanh toán | VNPay, COD (Cash on Delivery)          |
| 📦 Theo dơi   | Xem trạng thái đơn hàng real-time      |
| ⭐ Loyalty    | Tích điểm, dùng voucher, nhận ưu đãi   |
| 💬 AI Chat    | Hỏi menu, tìm kiếm, tra điểm, xem đơn  |
| 📱 Zalo       | Nhắn tin trực tiếp với cửa hàng        |
| 👤 Tài khoản  | Đăng ký, đăng nhập, quản lý profile    |
| 📍 Chi nhánh  | Xem danh sách cửa hàng, giờ mở cửa     |
| 📰 Tin tức    | Đọc tin tức, bài viết về trà sữa       |
| 👔 Tuyển dụng | Xem các vị trí tuyển dụng              |
| ⭐ Đánh giá   | Để lại feedback và xếp sao             |

### 🤖 AI Chatbot (15 Tools)

| Khả năng          | Tool                                                    |
| ----------------- | ------------------------------------------------------- |
| Tìm menu          | `menu_search`, `menu_categories`, `menu_bestsellers`    |
| Chi tiết sản phẩm | `menu_product_details`, `menu_extras`                   |
| Thông tin khách   | `customer_info`, `customer_loyalty`, `customer_history` |
| Voucher           | `customer_vouchers`                                     |
| Đơn hàng          | `order_list`, `order_status`                            |
| Chi nhánh         | `branch_list`, `branch_hours`                           |
| Chính sách        | `policy_shipping`, `policy_loyalty`                     |

---

## 📊 Database (Supabase PostgreSQL)

**30 bảng chính:**

- **Catalog**: `products`, `categories`, `sizes`, `toppings`, `branches`, `branchproductstatus`
- **Sales**: `orders`, `orderdetails`, `ordertoppings`, `order_templates`
- **Customer**: `customers`, `customerloyalty`, `customervouchers`, `customeraddresses`
- **Inventory**: `ingredients`, `recipes`, `branchinventory`, `stockreceipts`, `receiptdetails`, `inventoryaudits`, `auditdetails`
- **Marketing**: `promotions`, `promotiondetails`, `feedbacks`
- **Other**: `paymentmethods`, `ishipping`, `branches` (config)

Chi tiết: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)

---

## 📚 Tài liệu

| Tài liệu                                                                                   | Mục đích                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`docs/user-guides/CUSTOMER_GUIDE.md`](./docs/user-guides/CUSTOMER_GUIDE.md)               | Hướng dẫn sử dụng chi tiết cho khách hàng |
| [`docs/api-specifications/AI_CHATBOT_API.md`](./docs/api-specifications/AI_CHATBOT_API.md) | API endpoint & tool definition            |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)                                               | Schema đầy đủ 30 bảng PostgreSQL          |
| `docs/architecture-diagrams/`                                                              | Sơ đồ kiến trúc hệ thống                  |

---

## 🔐 Bảo mật

✅ **Supabase Auth** - JWT token, RLS policies  
✅ **CORS** - Chỉ cho phép origin được phép  
✅ **Supabase RLS** - Row-level security trên database  
✅ **Environment Variables** - Không expose keys công khai  
✅ **VNPay Secure** - Hash signature, TMNCODE verification

---

## ⚡ Hiệu suất

- **Frontend**: Vite fast refresh, code splitting
- **Backend**: Express middleware optimize, Supabase query cache
- **AI**: Groq fast LLM (70B model, <2s latencies)
- **Database**: Indexed queries, 30 optimized tables

---

## 🎓 Công nghệ học tập

Dự án này sử dụng:

- ✅ React Hooks + Context API
- ✅ TypeScript strict mode
- ✅ Supabase RLS & Auth
- ✅ RESTful API design
- ✅ Agentic AI (Function Calling)
- ✅ Payment gateway integration
- ✅ Email service integration
- ✅ Monorepo structure

---

## 📧 Hỗ trợ

📖 Xem tài liệu chi tiết: [`docs/README.md`](./docs/README.md)  
💬 Chat với AI: Mở website → Click icon chat  
📱 Zalo OA: Scan QR hoặc tìm "Lam Trà" trên Zalo

````

### AI Service

```json
{
  "groq-sdk": "^0.4.0",
  "@supabase/supabase-js": "^2.0",
  "express": "^4.18",
  "cors": "^2.8",
  "dotenv": "^16.0"
}
````

---

## ⚙️ Environment Variables

### `.env` (Frontend)

```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_AI_URL=http://localhost:5001
```

### `.env` (AI Service)

```
GROQ_API_KEY=gsk_...
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 📊 Database

**Engine**: PostgreSQL (Supabase)  
**Tables**: 30 entities  
**Schema**: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)

Key tables:

- `customers` - Khách hàng
- `products` - Sản phẩm
- `orders` - Đơn hàng
- `orderdetails` - Chi tiết đơn hàng
- `branches` - Chi nhánh
- `pointhistory` - Lịch sử điểm

---

## 🔐 Security

✅ JWT Authentication (Supabase)  
✅ Customer context injection (Auto-detect logged-in user)  
✅ CORS enabled  
✅ Environment variables protected  
✅ No admin APIs exposed

---

## 📝 Quy tắc code

- ✅ TypeScript strict mode
- ✅ ESLint enabled
- ✅ Prettier formatting
- ✅ Commit messages: `feat/`, `fix/`, `docs/`, `refactor/`

---

## 🤝 Nhóm phát triển (1 thành viên)

| Vai trò        | Trách nhiệm                                    |
| -------------- | ---------------------------------------------- |
| **Full Stack** | Frontend Customer + AI Service + Documentation |

---

## 📅 Progress

| Phase       | Status         | Tasks                                    |
| ----------- | -------------- | ---------------------------------------- |
| **Phase 1** | ✅ Done        | Frontend UI + Auth + Cart + Orders       |
| **Phase 2** | ✅ Done        | AI Chatbot (15 tools) + Function Calling |
| **Phase 3** | ✅ Done        | Zalo Integration + Positioning           |
| **Phase 4** | ⏳ In Progress | Data accuracy + Edge cases               |
| **Phase 5** | ⏳ Pending     | Performance optimization                 |

---

## 🚨 Known Issues & Fixes

**Fixed:**

- ✅ Groq LLM 400 validation error (typo in schema)
- ✅ Rate limit 429 (token usage optimization)
- ✅ N+1 query problem (order details)
- ✅ Menu data accuracy (removed status filters)
- ✅ Zalo + Chatbot positioning (z-index management)

**Current:**

- ⚠️ Menu queries need real data verification
- ⏳ Backend API full implementation pending

---

## 📞 Support

- 💬 **Chat AI**: On website (Bottom-right corner)
- 📱 **Zalo**: Click Zalo icon (Bottom-right corner)
- 📧 **Email**: Contact info on website

---

## 📄 License & Attribution

© 2026 – **Lamtra Online Milk Tea System (Customer Edition)**

---

**Last Updated**: April 14, 2026  
**Version**: 1.0 (Customer MVP)
