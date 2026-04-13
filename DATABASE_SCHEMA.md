ĐẶC TẢ CHI TIẾT CƠ SỞ DỮ LIỆU LAM TRÀ (FULL 30 TABLES)
1. QUY TẮC CHUNG (GLOBAL CONVENTIONS)
Naming: Toàn bộ tên bảng và tên cột sử dụng chữ thường (lowercase).

Tiền tệ & Số lượng: Sử dụng kiểu int8 (BigInt), đơn vị VNĐ.

Tọa độ: Sử dụng kiểu float8 cho Kinh độ/Vĩ độ.

Thời gian: Sử dụng kiểu timestamptz (múi giờ +07).

Xác thực: Liên kết trực tiếp với auth.users của Supabase qua kiểu uuid.

2. DANH SÁCH CHI TIẾT 30 BẢNG (TABLES DEFINITION)
🟦 Phân hệ 1: Danh mục & Sản phẩm (Core Catalog)
branches (Chi nhánh): branchid (int8, PK), name, address, longitude, latitude, isactive (bool).

categories (Danh mục): categoryid (int8, PK), name, description.

products (Sản phẩm): productid (int8, PK), name, subtitle, description, baseprice, saleprice (int8, Nullable), imageurl, status, label, has_size_l (bool), categoryid (FK).

sizes (Kích thước): sizeid (int8, PK), name (M/L), additionalprice.

toppings (Đồ thêm): toppingid (int8, PK), name, price, imageurl, isavailable (bool).

branchproductstatus (Menu tại quán): branchid (int8, FK), productid (int8, FK), status ('Còn món'/'Hết món').

🟥 Phân hệ 2: Bán hàng & Giao dịch (Sales)
orders (Đơn hàng): orderid (varchar, PK), totalamount, discountamount, shippingfee, finalamount, paymentmethod, ordertype, status, orderdate, branchid (FK), customerid (FK).

orderdetails (Món trong đơn): orderdetailid (int8, PK), orderid (FK), productid (FK), sizeid (FK), quantity, sugarlevel, icelevel, priceatorder, subtotal, note.

ordertoppings (Topping trong ly): orderdetailid (int8, FK), toppingid (int8, FK), quantity, priceatorder.

order_templates (Đơn mẫu/Combo): templateid (int8, PK), customerid (FK), orderid (FK), templatename.

🟩 Phân hệ 3: Quản lý Kho & Công thức (Inventory & Recipes)
ingredients (Nguyên liệu thô): ingredientid (int8, PK), name, unit, baseprice, minstocklevel.

recipes (Công thức): recipeid (int8, PK), productid (FK), sizeid (FK), toppingid (FK), ingredientid (FK), amount.

branchinventory (Tồn kho quán): branchid (int8, FK), ingredientid (int8, FK), currentstock (numeric).

stockreceipts (Phiếu nhập kho): receiptid (int8, PK), importdate, totalcost, branchid (FK), employeeid (FK).

receiptdetails (Chi tiết nhập): receiptid (FK), ingredientid (FK), quantity, unitprice, amount.

inventoryaudits (Phiếu kiểm kho): auditid (int8, PK), branchid (FK), employeeid (FK), auditdate, note.

auditdetails (Chi tiết kiểm kê): auditid (FK), ingredientid (FK), systemstock, actualstock, difference, reason.

🟨 Phân hệ 4: Marketing & Loyalty (CRM)
vouchers: voucherid (int4, PK), code, title, discountvalue, discounttype, expirydate, iswelcome (bool), pointsrequired, minordervalue, maxdiscount.

customervouchers: custvoucherid (int4, PK), customerid (FK), voucherid (FK), status, reason, receiveddate, useddate.

pointhistory: pointhistoryid (int4, PK), customerid (FK), pointchange, type, orderid (FK), description, createddate.

product_favorites: id (int8, PK), customerid (FK), productid (FK), createdat.

🟪 Phân hệ 5: Người dùng & Truyền thông (Users & Media)
accounts: accountid (uuid, PK), role (Admin/Manager/Staff), branchid (FK), employeeid (FK).

employees: employeeid (int8, PK), fullname, email, phone, position, branchid (FK), created_at.

customers: customerid (int8, PK), authid (uuid), fullname, phone, email, totalpoints, membership, birthday, gender, accumulated_points.

news (CMS): newsid (PK), title, excerpt, content, type, status, publisheddate, thumbnail.

media: mediaid (PK), path, filetype, newsid (FK), reviewid (FK).

reviews: reviewid (PK), rating, comment, createdat, customerid (FK), orderid (FK), productid (FK), sentiment (AI).

feedbacks: id (uuid, PK), customerid (uuid), displayname, content, is_visible, createdat.

homepage_config: key (PK), value (text).

_migrations: Quản lý lịch sử database.

3. SƠ ĐỒ LIÊN KẾT & QUAN HỆ (RELATIONSHIPS)
A. Nhóm Sản phẩm & Thực đơn
products.categoryid → categories.categoryid (n-1).

branchproductstatus (n-n): Nối branches và products để quản lý menu riêng cho từng quán.

recipes (n-1): Nối products, sizes, toppings với ingredients để định lượng tiêu hao.

B. Nhóm Bán hàng (Order Hierarchy)
orders.branchid → branches.branchid (n-1).

orderdetails.orderid → orders.orderid (n-1).

ordertoppings.orderdetailid → orderdetails.orderdetailid (n-1).

C. Nhóm Quản lý Kho (Inventory Logic)
branchinventory (n-n): Tồn kho thực tế của quán.

stockreceipts & inventoryaudits: Liên kết với branches và employees để truy vết người thực hiện.

receiptdetails & auditdetails: Chi tiết hóa từng nguyên liệu trong phiếu.

D. Nhóm CRM & Loyalty
customervouchers (n-n): Nối customers và vouchers.

pointhistory.customerid → customers.customerid (n-1).

order_templates.orderid → orders.orderid (1-1).

E. Nhóm Định danh (Auth)
accounts.accountid → auth.users.id (1-1).

customers.authid → auth.users.id (1-1).

employees.employeeid → accounts.employeeid (1-1).

4. LUỒNG NGHIỆP VỤ CHÍNH
Vận hành kho: Phiếu nhập (stockreceipts) → Tự cộng currentstock trong branchinventory.

Bán hàng & Trừ kho: Đơn hàng 'Xong' → Tra cứu recipes → Trừ currentstock tại chi nhánh.

Loyalty: Đơn hàng 'Xong' → Tính điểm → Cập nhật totalpoints và membership.

CMS & AI: Khách gửi reviews → AI phân tích sentiment → Lưu vào bảng reviews.