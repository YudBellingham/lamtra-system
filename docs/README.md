# 📚 TÀI LIỆU DỰ ÁN – LAMTRA ONLINE MILK TEA SYSTEM

Thư mục `docs/` dùng để lưu toàn bộ tài liệu liên quan đến phân tích – thiết kế – triển khai hệ thống.

---

## 📂 Cấu trúc thư mục docs

```
docs/
├── architecture-diagrams/
├── api-specifications/
├── user-guides/
├── admin-guides/
└── README.md
```

---

## 1️⃣ architecture-diagrams

Chứa các sơ đồ:

* Sơ đồ tổng thể hệ thống (System Architecture)
* Sơ đồ luồng nghiệp vụ đặt hàng
* Sơ đồ phân quyền (RBAC)
* Sequence Diagram (Customer → Admin → Staff)

📌 File gợi ý:

* system-architecture.png
* order-flow-diagram.png
* auth-flow.png

---

## 2️⃣ api-specifications

Chứa tài liệu mô tả REST API Backend:

* Auth API
* User API
* Order API
* Product API
* Branch API
* Voucher API

📌 Mỗi API gồm:

* Method
* Endpoint
* Request
* Response
* Status Code

Ví dụ:

```
POST /api/auth/login
```

---

## 3️⃣ user-guides

Hướng dẫn dành cho **khách hàng**:

* Cách đăng ký / đăng nhập
* Cách đặt trà sữa
* Cách sử dụng voucher
* Cách xem lịch sử đơn hàng

---

## 4️⃣ admin-guides

Hướng dẫn dành cho **admin / quản lý / nhân viên**:

* Quản lý chi nhánh
* Quản lý menu
* Xử lý đơn hàng
* Phân quyền hệ thống

---

## 📌 Quy ước

* Tài liệu viết bằng Markdown (.md)
* Hình ảnh lưu cùng thư mục
* Tên file rõ nghĩa

---

📅 Tài liệu sẽ được cập nhật dần trong quá trình làm đồ án.

---

© Lamtra Project Documentation
