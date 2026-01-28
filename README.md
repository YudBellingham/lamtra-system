# ☕ Lamtra Online Milk Tea System

Hệ thống bán trà sữa trực tuyến cho chuỗi **Lam Trà (Lamtra)**, phục vụ mục tiêu đồ án học phần và định hướng xây dựng hệ thống thực tế.

---

## 📌 Mục tiêu dự án

* Xây dựng **website bán trà sữa cho khách hàng**
* Xây dựng **website quản trị cho hệ thống Lam Trà**
* Thiết kế kiến trúc **frontend – backend – AI service tách biệt**
* Áp dụng mô hình làm việc nhóm, GitHub, API, AI

---

## 🧱 Kiến trúc tổng thể

```
Lamtra-Online-Milk-Tea-System
├── frontend-customer   # Website khách hàng
├── frontend-admin      # Website quản trị
├── backend-api         # REST API (PHP thuần)
├── ai-service          # AI Recommendation & Sentiment
├── docs                # Tài liệu dự án
└── README.md
```

---

## 🧑‍💻 Công nghệ sử dụng

### Frontend (Customer & Admin)

* React.js
* TypeScript
* Vite
* Axios
* Tailwind CSS (dự kiến)

### Backend API

* PHP thuần
* RESTful API
* JWT Authentication

### AI Service

* Python
* FastAPI
* AI Recommendation
* Sentiment Analysis

### Công cụ hỗ trợ

* VSCode
* Git & GitHub
* Ollama (thiết kế logic)
* AI Toolkit
* GitHub Copilot

---

## 👥 Phân công nhóm (dự kiến)

| Thành viên | Vai trò                     |
| ---------- | --------------------------- |
| Member 1   | Frontend Customer + Admin   |
| Member 2   | Backend API (PHP)           |
| Member 3   | AI Service + hỗ trợ backend |

---

## ⚙️ Quy tắc làm việc nhóm

* Không commit file `.env`
* Mỗi thành viên tự tạo `.env` trên máy
* Mỗi tính năng làm trên **branch riêng**
* Chỉ merge vào `main` khi hoàn thành và test

---

## 🚀 Cách chạy dự án (sẽ cập nhật)

### Frontend

```bash
cd frontend-customer
npm install
npm run dev
```

### Backend

```bash
cd backend-api
php -S localhost:8000
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

---

## 📚 Tài liệu

Xem chi tiết trong thư mục [`docs/`](./docs)

---

## 📌 Ghi chú

Dự án được xây dựng theo hướng **mô phỏng hệ thống thực tế**, ưu tiên kiến trúc rõ ràng, dễ mở rộng và dễ phân công nhóm.

---

© 2026 – Lamtra Online Milk Tea System
