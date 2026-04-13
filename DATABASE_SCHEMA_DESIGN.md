# 🗄️ ĐẶC TẢ CHI TIẾT CƠ SỞ DỮ LIỆU LAM TRÀ (FULL 26 TABLES)

## 1. QUY TẮC CHUNG (GLOBAL CONVENTIONS)
*   **Naming:** Toàn bộ tên bảng và tên cột sử dụng chữ thường (`lowercase`).
*   **Tiền tệ & Số lượng:** Sử dụng kiểu `int8` (BigInt), đơn vị VNĐ.
*   **Tọa độ:** Sử dụng kiểu `float8` cho Kinh độ/Vĩ độ.
*   **Thời gian:** Sử dụng kiểu `timestamptz` (múi giờ +07).
*   **Xác thực:** Liên kết trực tiếp với `auth.users` của Supabase qua kiểu `uuid`.

---

## 2. DANH SÁCH CÁC BẢNG (TABLES DEFINITION)

### Phân hệ 1: Danh mục & Sản phẩm (Core Catalog)
1.  **`branches` (Chi nhánh):** `branchid` (int8, PK), `name`, `address`, `longitude`, `latitude`, `isactive` (bool).
2.  **`categories` (Danh mục):** `categoryid` (int8, PK), `name`, `description`.
3.  **`products` (Sản phẩm):** `productid` (int8, PK), `name`, `subtitle`, `description`, `baseprice`, `saleprice` (int8, Nullable), `imageurl`, `status`, `label` (text, Nullable), `has_size_l` (bool), `categoryid` (FK).
4.  **`sizes` (Kích thước):** `sizeid` (int8, PK), `name` (M/L), `additionalprice`.
5.  **`toppings` (Đồ thêm):** `toppingid` (int8, PK), `name`, `price`, `imageurl`, `isavailable` (bool).
6.  **`branchproductstatus` (Menu tại quán):** `branchid` (int8, FK), `productid` (int8, FK), `status` ('Còn món'/'Hết món').

### Phân hệ 2: Bán hàng & Giao dịch (Sales)
7.  **`orders` (Đơn hàng):** `orderid` (varchar, PK), `totalamount`, `discountamount`, `shippingfee`, `finalamount`, `paymentmethod`, `ordertype`, `status` ('Chờ xác nhận'/'Đang làm'/'Đang giao'/'Hủy'), `orderdate`, `branchid` (FK), `customerid` (FK, Nullable), `city` (varchar, Nullable), `ward` (varchar, Nullable), `address_detail` (varchar, Nullable), `customer_latitude` (float8, Nullable), `customer_longitude` (float8, Nullable).
8.  **`orderdetails` (Món trong đơn):** `orderdetailid` (int8, PK), `orderid` (FK), `productid` (FK), `sizeid` (FK), `quantity`, `sugarlevel`, `icelevel`, `priceatorder`, `subtotal`, `note` (text, Nullable).
9.  **`ordertoppings` (Topping trong ly):** `orderdetailid` (int8, FK), `toppingid` (int8, FK), `quantity`.

### Phân hệ 3: Quản lý Kho & Công thức (Inventory & Recipes)
10. **`ingredients` (Nguyên liệu thô):** `ingredientid` (int8, PK), `name`, `unit` (g, ml, cái), `baseprice` (giá nhập), `minstocklevel`.
11. **`recipes` (Công thức):** `recipeid` (int8, PK), `productid` (FK), `sizeid` (FK, Nullable), `toppingid` (FK, Nullable), `ingredientid` (FK), **`amount`** (định lượng tiêu hao).
12. **`branchinventory` (Tồn kho quán):** `branchid` (int8, FK), `ingredientid` (int8, FK), `currentstock`.
13. **`stockreceipts` (Phiếu nhập kho):** `receiptid` (int8, PK), `importdate`, `totalcost`, `branchid` (FK), `employeeid` (FK).
14. **`receiptdetails` (Chi tiết nhập):** `receiptid` (FK), `ingredientid` (FK), `quantity` (số lượng nhập), `unitprice`, `amount` (thành tiền).
15. **`inventoryaudits` (Phiếu kiểm kho):** `auditid` (int8, PK), `branchid` (FK), `employeeid` (FK), `auditdate`, `note`.
16. **`auditdetails` (Chi tiết kiểm kê):** `auditid` (FK), `ingredientid` (FK), `systemstock` (tồn máy), `actualstock` (tồn thực tế), `difference`, `reason`.

### Phân hệ 4: Marketing & Loyalty (CRM)
17. **`vouchers`:** `voucherid` (int4, PK), `code`, `title`, `discountvalue`, `discounttype`, `expirydate`, `iswelcome` (bool), `pointsrequired`, `minordervalue` (int8, Default 0), `maxdiscount` (int8, Nullable), `created_at`, `scope`.
18. **`customervouchers`:** `custvoucherid` (int4, PK), `customerid` (FK), `voucherid` (FK), `status`, `reason`, `receiveddate`, `useddate`.
19. **`pointhistory`:** `pointhistoryid` (int4, PK), `customerid` (FK), `pointchange`, `type`, `orderid` (FK, Nullable), `description`, `createddate`.
20. **`product_favorites` (Yêu thích món):** `id` (int8, PK), `customerid` (FK), `productid` (FK), `createdat`.
21. **`order_templates` (Đơn mẫu/Combo):** `templateid` (int8, PK), `customerid` (FK), `orderid` (FK), `templatename`.

### Phân hệ 5: Người dùng & Truyền thông (Users & Media)
22. **`accounts`:** `accountid` (uuid, PK), `role` (Admin/Manager/Staff), `branchid` (FK, Nullable), `employeeid` (FK).
23. **`employees`:** `employeeid` (int8, PK), `fullname`, `email`, `phone`, `position`, `branchid` (FK), `created_at`.
24. **`customers`:** `customerid` (int8, PK), `authid` (uuid), `fullname`, `phone`, `email`, `totalpoints`, `membership`, `birthday`, `gender`, `accumulated_points`.
25. **`news` (Quản lý nội dung/CMS):**
    *   `newsid` (int8, PK).
    *   `title` (varchar): Tiêu đề bài viết.
    *   `excerpt` (text): Đoạn tóm tắt nội dung bài viết.
    *   `content` (text): Nội dung (hỗ trợ HTML/Markdown).
    *   `type` (varchar): 'Khuyến mãi', 'Tin tức', 'Câu chuyện'.
    *   `status` (varchar): 'Hiện', 'Ẩn'.
    *   `publisheddate` (timestamptz).
    *   `thumbnail` (text): URL ảnh đại diện bài viết.
26. **`media` (Hình ảnh/Video):** `mediaid` (int8, PK), `path` (URL), `filetype`(varchar): 'image' hoặc 'video', `newsid` (FK, Nullable), `reviewid` (FK, Nullable).
27. **`reviews` (Đánh giá):** `reviewid` (int8, PK), `rating`, `comment`, `createdat`, `customerid` (FK), `orderid` (FK), `productid` (FK, Nullable), `sentiment` (varchar): Kết quả AI phân tích ('Tích cực', 'Tiêu cực', 'Trung lập').
28. **`_migrations`:** Bảng hệ thống quản lý lịch sử database.
29. **`homepage_config` (Cấu hình Landing Page):** `key` (varchar, PK), `value` (text). Dùng quản lý video, banner, v.v.
30. **`feedbacks` (Cảm nhận khách hàng):** `id` (uuid, PK), `customerid` (uuid, FK to auth.users, Nullable), `displayname` (varchar), `content` (text), `is_visible` (bool, default true), `createdat` (timestamptz, default now()).

---

## 3. SƠ ĐỒ LIÊN KẾT & QUAN HỆ (RELATIONSHIPS)

### A. Nhóm Sản phẩm & Thực đơn
- `products.categoryid` → `categories.categoryid` (n-1).
- `branchproductstatus` (n-n): Nối `branches` và `products` để quản lý menu riêng cho từng quán.

### B. Nhóm Bán hàng (Order Hierarchy)
- `orders.branchid` → `branches.branchid` (n-1).
- `orderdetails.orderid` → `orders.orderid` (n-1).
- `ordertoppings.orderdetailid` → `orderdetails.orderdetailid` (n-1).

### C. Nhóm Quản lý Kho (Inventory Logic)
- `branchinventory` (n-n): Nối `branches` và `ingredients` (Tồn kho thực tế của quán).
- `recipes` (n-1): Nối `products/toppings` với `ingredients` (Định lượng để trừ kho).
- `stockreceipts` & `inventoryaudits`: Đều liên kết với `branches` và `employees` để xác định ai làm, tại kho nào.

### D. Nhóm CRM & Loyalty
- `customervouchers` (n-n): Nối `customers` và `vouchers`.
- `pointhistory.customerid` → `customers.customerid` (n-1).
- `product_favorites.customerid` → `customers.customerid` (n-1).
- `product_favorites.productid` → `products.productid` (n-1).
- `order_templates.customerid` → `customers.customerid` (n-1).
- `order_templates.orderid` → `orders.orderid` (n-1).

### E. Nhóm Định danh (Auth)
- `accounts.accountid` → `auth.users.id` (1-1).
- `employees.employeeid` → `accounts.employeeid` (1-1).
- `customers.authid` → `auth.users.id` (1-1).

---

## 4. LUỒNG NGHIỆP VỤ CHÍNH

1.  **Vận hành kho:** Admin tạo `ingredients`. Manager tạo phiếu nhập (`stockreceipts`) → Hệ thống tự cộng `currentstock` trong `branchinventory`.
2.  **Bán hàng & Trừ kho:** Đơn hàng chuyển sang 'Xong' → Hệ thống tra cứu `recipes` → Trừ `currentstock` của chi nhánh tương ứng.
3.  **Loyalty:** Đơn hàng 'Xong' → Tính điểm → Cộng `totalpoints` cho `customers` → Tự động cập nhật `membership` (Trigger).
4.  **CRM:** Admin tặng mã (insert `customervouchers`) hoặc Khách đổi điểm (trừ `totalpoints` + insert `customervouchers`).
```