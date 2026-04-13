import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  FiUser,
  FiGift,
  FiShoppingBag,
  FiLock,
  FiLogOut,
  FiClock,
  FiHeart,
} from "react-icons/fi";
import { Coins, Crown } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import ComboDetailModal from "../../components/ComboDetailModal/ComboDetailModal";
import "./styles/Profile.css";

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "1";
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const { addToCart } = useCart();
  const [reorderLoading, setReorderLoading] = useState<string | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  // Tab 1 Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    birthday: "",
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tab 2 State
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [favorites, setFavorites] = useState<{
    products: any[];
    templates: any[];
  }>({ products: [], templates: [] });
  const [favLoading, setFavLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);

  // Tab 3 State
  const [orders, setOrders] = useState<any[]>([]);

  // Tab 4 State
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateOrderId, setTemplateOrderId] = useState("");
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] =
    useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session: currSession },
      } = await supabase.auth.getSession();
      if (!currSession) {
        navigate("/auth");
        return;
      }
      setSession(currSession);
      fetchCustomer(currSession.user.id);
    };
    fetchSession();
  }, [navigate]);

  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");

    if (customer) {
      if (activeTab === "2") fetchLoyaltyData(customer.customerid);
      if (activeTab === "3") fetchOrders(customer.customerid);
    }
  }, [activeTab, customer]);

  const fetchCustomer = async (authId: string) => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("authid", authId)
      .maybeSingle();
    setCustomer(data);
    if (data) {
      setEditForm({
        fullname: data.fullname || "",
        email: data.email || "",
        phone: data.phone || "",
        birthday: data.birthday || "",
      });
    }
    setLoadingData(false);
  };

  const fetchLoyaltyData = async (customerId: number) => {
    setLoadingData(true);
    try {
      const {
        data: { session: currSession },
      } = await supabase.auth.getSession();
      const headers = currSession?.access_token
        ? { Authorization: `Bearer ${currSession.access_token}` }
        : {};

      const [vouchersRes, historyRes, myVouchersRes] = await Promise.all([
        supabase
          .from("vouchers")
          .select("*")
          .gt("pointsrequired", 0)
          .eq("iswelcome", false)
          .order("pointsrequired", { ascending: true }),
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/customers/point-history`,
          { headers },
        ),
        supabase
          .from("customervouchers")
          .select("*, vouchers(*)")
          .eq("customerid", customerId)
          .or("status.eq.Chưa dùng,status.is.null"),
      ]);
      setVouchers(vouchersRes.data || []);
      setPointHistory(historyRes.data || []);

      const rawMyVouchers = myVouchersRes.data || [];
      const groupedMyVouchers: any = {};
      rawMyVouchers.forEach((item) => {
        if (!item.vouchers) return;
        const vid = item.voucherid;
        if (!groupedMyVouchers[vid]) {
          groupedMyVouchers[vid] = { ...item, count: 1 };
        } else {
          groupedMyVouchers[vid].count += 1;
        }
      });
      setMyVouchers(Object.values(groupedMyVouchers));
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  const fetchOrders = async (customerId: number) => {
    setLoadingData(true);
    try {
      const {
        data: { session: currSession },
      } = await supabase.auth.getSession();
      const headers = currSession?.access_token
        ? { Authorization: `Bearer ${currSession.access_token}` }
        : {};

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/customers/order-history`,
        { headers },
      );
      setOrders(res.data || []);
    } catch (e) {
      console.error("Lỗi fetch order history:", e);
      // Fallback nếu API lỗi
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customerid", customerId)
        .order("orderdate", { ascending: false });
      setOrders(data || []);
    }
    setLoadingData(false);
  };

  const handleRedeem = async (voucher: any) => {
    if (customer.totalpoints < voucher.pointsrequired) {
      setErrorMsg("Bạn không đủ điểm để đổi phần quà này.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setRedeemLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const newPoints = customer.totalpoints - voucher.pointsrequired;

      const { error: updateErr } = await supabase
        .from("customers")
        .update({ totalpoints: newPoints })
        .eq("customerid", customer.customerid);

      if (updateErr) throw updateErr;

      const historyInsert = supabase.from("pointhistory").insert({
        customerid: customer.customerid,
        pointchange: -voucher.pointsrequired,
        type: "Đổi quà",
        description: `Đổi voucher: ${voucher.title}`,
      });

      const voucherInsert = supabase.from("customervouchers").insert({
        customerid: customer.customerid,
        voucherid: voucher.voucherid,
        status: "Chưa dùng",
        reason: "Đổi điểm",
        receiveddate: new Date().toISOString(),
      });

      await Promise.all([historyInsert, voucherInsert]);

      setSuccessMsg(`Đổi thành công: ${voucher.title}!`);
      setTimeout(() => setSuccessMsg(""), 6000);

      // Refresh user points and history
      await fetchCustomer(session.user.id);
      await fetchLoyaltyData(customer.customerid);
    } catch (e: any) {
      setErrorMsg("Đã có lỗi xảy ra: " + e.message);
      setTimeout(() => setErrorMsg(""), 3000);
    }
    setRedeemLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu phải từ 6 ký tự.");
      return;
    }
    setIsUpdatingPass(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Đổi mật khẩu thành công!");
      setNewPassword("");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setIsUpdatingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    const phoneRegex = /^0\d{9}$/;
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@(?!(gmai|yaho|hotmai)\.com$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!editForm.fullname.trim() || !editForm.phone.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ Họ tên và Số điện thoại.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (!emailRegex.test(editForm.email)) {
      setErrorMsg("Email không hợp lệ hoặc sai chính tả (vd: @gmail.com).");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    if (!phoneRegex.test(editForm.phone)) {
      setErrorMsg(
        "Số điện thoại không hợp lệ (phải có đủ 10 chữ số và bắt đầu bằng số 0).",
      );
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    setIsSavingInfo(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/customers/update-profile`,
        {
          customerId: customer.customerid,
          fullname: editForm.fullname,
          email: editForm.email,
          phone: editForm.phone,
          birthday: editForm.birthday,
        },
      );

      if (res.data.success) {
        setCustomer({
          ...customer,
          fullname: editForm.fullname,
          phone: editForm.phone,
          email: editForm.email,
        });
        setSuccessMsg(res.data.message);
        setIsEditingInfo(false);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || "Cập nhật thất bại: " + e.message);
      setTimeout(() => setErrorMsg(""), 5000);
    }
    setIsSavingInfo(false);
  };

  const fetchFavorites = async () => {
    setFavLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/customers/favorites`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      setFavorites(res.data || { products: [], templates: [] });
    } catch (err) {
      console.error("Lỗi fetch favorites:", err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa đơn mẫu này?")) return;
    setIsDeletingTemplate(templateId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/saved-templates/${templateId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (res.data.success) {
        toast.success("Đã xóa đơn mẫu!");
        fetchFavorites(); // Re-fetch để cập nhật UI
      }
    } catch (err: any) {
      toast.error("Lỗi khi xóa: " + (err.response?.data?.error || err.message));
    } finally {
      setIsDeletingTemplate(null);
    }
  };

  useEffect(() => {
    if (activeTab === "5" || activeTab === "1") fetchFavorites();
  }, [activeTab]);

  if (loadingData && !customer) {
    return (
      <div className="profile-page loading-state">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const handleReorder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    setReorderLoading(orderId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders/reorder`,
        { orderid: orderId },
      );
      if (res.data.success) {
        const { reorderCart, hasMissingItems } = res.data;
        let addedCount = 0;
        reorderCart.forEach((item: any) => {
          addToCart(item);
          addedCount++;
        });

        if (addedCount === 0) {
          toast.error("Các món trong đơn hàng này đã ngừng bán.");
        } else {
          if (hasMissingItems) {
            toast.success(
              `Đã thêm ${addedCount} món vào giỏ. Một số món đã ngừng phục vụ nên không được thêm.`,
            );
          } else {
            toast.success("Đã thêm các món từ đơn hàng cũ vào giỏ.");
          }
          setTimeout(() => navigate("/cart"), 1000);
        }
      }
    } catch (err: any) {
      toast.error(
        "Lỗi khi đặt lại đơn: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setReorderLoading(null);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) {
      toast.error("Vui lòng nhập tên cho đơn hàng mẫu.");
      return;
    }
    setIsSavingTemplate(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders/template/save`,
        { orderId: templateOrderId, templateName: templateNameInput },
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      if (res.data.success) {
        toast.success("Đã lưu vào danh sách đơn hàng mẫu!");
        setShowTemplateModal(false);
        setTemplateNameInput("");
        fetchFavorites();
      }
    } catch (err: any) {
      toast.error(
        "Lỗi khi lưu đơn mẫu: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const renderTab1 = () => (
    <div className="tab-pane fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          borderBottom: "2px solid #ffeff3",
          paddingBottom: "15px",
        }}
      >
        <h2
          className="tab-head"
          style={{ borderBottom: "none", margin: 0, paddingBottom: 0 }}
        >
          Thông tin tài khoản
        </h2>
        {!isEditingInfo ? (
          <button
            className="btn-edit-profile"
            onClick={() => setIsEditingInfo(true)}
          >
            Chỉnh sửa thông tin
          </button>
        ) : (
          <div>
            <button
              className="btn-cancel-edit"
              onClick={() => {
                setIsEditingInfo(false);
                setEditForm({
                  fullname: customer?.fullname,
                  email: customer?.email,
                  phone: customer?.phone,
                  birthday: customer?.birthday,
                });
              }}
              disabled={isSavingInfo}
            >
              Hủy
            </button>
            <button
              className="btn-save-profile"
              onClick={handleSaveProfile}
              disabled={
                isSavingInfo ||
                !editForm.fullname ||
                !editForm.phone ||
                !/^0\d{9}$/.test(editForm.phone)
              }
              style={{
                opacity:
                  isSavingInfo ||
                  !editForm.fullname ||
                  !editForm.phone ||
                  !/^0\d{9}$/.test(editForm.phone)
                    ? 0.6
                    : 1,
              }}
            >
              {isSavingInfo ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        )}
      </div>

      <div className="info-cards">
        <div className="info-card">
          <label>Họ và tên</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.fullname || "Chưa cập nhật"}</div>
          ) : (
            <input
              type="text"
              className="profile-edit-input"
              value={editForm.fullname}
              onChange={(e) =>
                setEditForm({ ...editForm, fullname: e.target.value })
              }
            />
          )}
        </div>
        <div className="info-card">
          <label>Email</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.email || "Chưa cập nhật"}</div>
          ) : (
            <input
              type="email"
              className="profile-edit-input"
              disabled
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              title="Không thể đổi email lấy khóa đăng nhập"
            />
          )}
        </div>
        <div className="info-card">
          <label>Số điện thoại</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.phone || "Chưa cập nhật"}</div>
          ) : (
            <input
              type="tel"
              className="profile-edit-input"
              value={editForm.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ""); // Loại bỏ chữ
                if (val.length <= 10) setEditForm({ ...editForm, phone: val });
              }}
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
            />
          )}
        </div>
        <div className="info-card">
          <label>Ngày sinh</label>
          {!isEditingInfo ? (
            <div className="value">
              {customer?.birthday
                ? new Date(customer.birthday).toLocaleDateString("vi-VN")
                : "Chưa cập nhật"}
              {!customer?.birthday && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8d6e63",
                    marginTop: "4px",
                    fontWeight: "normal",
                    fontStyle: "italic",
                  }}
                >
                  🎂 Cập nhật ngày sinh để nhận quà bất ngờ vào tháng sinh nhật
                  của bạn!
                </div>
              )}
            </div>
          ) : (
            <input
              type="date"
              className="profile-edit-input"
              value={editForm.birthday}
              onChange={(e) =>
                setEditForm({ ...editForm, birthday: e.target.value })
              }
            />
          )}
        </div>
      </div>

      <h2 className="tab-head mt-4">Hạng & Tích điểm</h2>
      <div
        className="rank-cards-wrapper"
        style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
      >
        <div
          className="rank-card points-card"
          style={{
            flex: 1,
            minWidth: "200px",
            background: "#fff9fa",
            border: "1px solid #ffccd5",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div className="rank-icon">
            <Coins size={36} color="#d81b60" />
          </div>
          <div className="rank-details">
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#666",
                marginBottom: "5px",
              }}
            >
              Ví điểm khả dụng
            </label>
            <div
              className="rank-val"
              style={{ color: "#d81b60", fontSize: "24px", fontWeight: "bold" }}
            >
              {customer?.totalpoints || 0} điểm
            </div>
          </div>
        </div>
        <div
          className={`rank-card tier-card tier-${(customer?.membership || "Đồng").toLowerCase()}`}
          style={{
            flex: 1,
            minWidth: "200px",
            background: "#f5f7ff",
            border: "1px solid #cce0ff",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div className="rank-icon">
            <Crown size={36} color="#3366cc" />
          </div>
          <div className="rank-details">
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#666",
                marginBottom: "5px",
              }}
            >
              Hạng thành viên
            </label>
            <div
              className="rank-val"
              style={{ fontSize: "24px", fontWeight: "bold", color: "#3366cc" }}
            >
              {customer?.membership || "Đồng"}
            </div>
          </div>
        </div>
      </div>

      {customer && (
        <div
          className="progress-section"
          style={{
            marginTop: "25px",
            padding: "20px",
            background: "#fcfcfc",
            borderRadius: "12px",
            border: "1px solid #eee",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#333" }}>
            Tiến trình thăng hạng
          </h3>
          {(() => {
            const info = (() => {
              const pts = customer?.accumulated_points || 0;
              let nextTier = "";
              let needed = 0;
              let percentage = 0;

              if (pts < 100) {
                nextTier = "Bạc";
                needed = 100 - pts;
                percentage = (pts / 100) * 100;
              } else if (pts < 500) {
                nextTier = "Vàng";
                needed = 500 - pts;
                percentage = ((pts - 100) / 400) * 100;
              } else {
                return {
                  isMax: true,
                  percentage: 100,
                  text: "Bạn đang ở hạng cao nhất",
                };
              }

              return {
                isMax: false,
                percentage,
                text: `Bạn đang có ${pts} điểm. Cần thêm ${needed} điểm nữa để lên hạng ${nextTier}.`,
              };
            })();

            return (
              <div>
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "14px",
                    color: "#555",
                    fontWeight: "500",
                  }}
                >
                  {info.text}
                </p>
                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    background: "#e0e0e0",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${info.percentage}%`,
                      background: "linear-gradient(90deg, #ff8a00, #e52e71)",
                      transition: "width 0.5s ease-in-out",
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#888",
                    fontWeight: "bold",
                  }}
                >
                  <span>Đồng (0)</span>
                  <span>Bạc (100)</span>
                  <span>Vàng (500)</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderTab2 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Kho quà tặng (Đổi điểm)</h2>
      <p className="tab-desc">
        Sử dụng điểm tích luỹ <b>{customer?.totalpoints}</b> của bạn để đổi các
        Voucher giá trị.
      </p>

      <div
        className="voucher-grid"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: "15px",
          paddingBottom: "10px",
        }}
      >
        {vouchers?.map((v) => {
          const isNotEnough = customer?.totalpoints < v.pointsrequired;
          return (
            <div
              className={`voucher-item`}
              style={{
                flex: "0 0 calc(50% - 10px)",
                scrollSnapAlign: "start",
                filter: isNotEnough ? "grayscale(100%) opacity(0.6)" : "none",
              }}
              key={v.voucherid}
            >
              <div className="v-value">Mã: {v.code}</div>
              <div className="v-title">{v.title}</div>
              <div className="v-points">Trị giá: -{v.pointsrequired} điểm</div>
              <button
                className="btn-redeem"
                onClick={() => handleRedeem(v)}
                disabled={redeemLoading || isNotEnough}
              >
                {isNotEnough
                  ? `Cần thêm ${v.pointsrequired - customer?.totalpoints} điểm`
                  : redeemLoading
                    ? "Đang đổi..."
                    : "Đổi quà"}
              </button>
            </div>
          );
        })}
        {vouchers.length === 0 && (
          <p className="empty-text">Hiện chưa có phần quà nào để đổi.</p>
        )}
      </div>

      <h2 className="tab-head mt-4">Voucher của bạn</h2>
      <div
        className="voucher-grid"
        style={{
          marginBottom: "30px",
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap: "15px",
          paddingBottom: "10px",
        }}
      >
        {myVouchers?.map((mv) => {
          const v = mv.vouchers;
          if (!v) return null;
          return (
            <div
              key={mv.custvoucherid}
              className="voucher-item"
              style={{
                flex: "0 0 calc(50% - 10px)",
                scrollSnapAlign: "start",
                border: "1px solid #4caf50",
                background: "#f1f8e9",
                position: "relative",
              }}
            >
              {mv.count > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "#ff3d00",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "3px 8px",
                    borderBottomLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                  }}
                >
                  x{mv.count}
                </div>
              )}
              <div
                className="v-value"
                style={{
                  color: "#2e7d32",
                  paddingRight: mv.count > 1 ? "30px" : "0",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                Giảm{" "}
                {v.discounttype === "%"
                  ? `${v.discountvalue}%`
                  : formatPrice(v.discountvalue)}
              </div>
              <div
                className="v-title"
                style={{
                  color: "#1b5e20",
                  fontSize: "13px",
                  margin: "4px 0",
                  fontWeight: "500",
                }}
              >
                {v.title}
              </div>
              <div
                style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}
              >
                Đơn tối thiểu {formatPrice(v.minordervalue || 0)}
                {v.discounttype === "%" &&
                  v.maxdiscount &&
                  ` - Giảm tối đa ${formatPrice(v.maxdiscount)}`}
              </div>
              <div
                className="v-points"
                style={{
                  color: "#388e3c",
                  fontSize: "11px",
                  borderTop: "1px dashed #c8e6c9",
                  paddingTop: "5px",
                }}
              >
                HSD:{" "}
                {v.expirydate
                  ? new Date(v.expirydate).toLocaleDateString("vi-VN")
                  : "Không giới hạn"}
              </div>
              <button
                className="btn-redeem"
                style={{ background: "#4caf50" }}
                onClick={() => navigate("/san-pham")}
              >
                Dùng ngay
              </button>
            </div>
          );
        })}
        {myVouchers.length === 0 && (
          <p className="empty-text">Bạn chưa sở hữu voucher nào.</p>
        )}
      </div>

      <h2 className="tab-head mt-4">Lịch sử điểm</h2>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setHistoryFilter("all")}
            style={{
              padding: "6px 15px",
              borderRadius: "20px",
              border: "1px solid #d81b60",
              background: historyFilter === "all" ? "#d81b60" : "transparent",
              color: historyFilter === "all" ? "#fff" : "#d81b60",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Tất cả
          </button>
          <button
            onClick={() => setHistoryFilter("in")}
            style={{
              padding: "6px 15px",
              borderRadius: "20px",
              border: "1px solid #4caf50",
              background: historyFilter === "in" ? "#4caf50" : "transparent",
              color: historyFilter === "in" ? "#fff" : "#4caf50",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Nhận điểm
          </button>
          <button
            onClick={() => setHistoryFilter("out")}
            style={{
              padding: "6px 15px",
              borderRadius: "20px",
              border: "1px solid #f44336",
              background: historyFilter === "out" ? "#f44336" : "transparent",
              color: historyFilter === "out" ? "#fff" : "#f44336",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Dùng điểm
          </button>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#666" }}>
            Lọc theo ngày:
          </span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "13px",
            }}
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              style={{
                background: "none",
                border: "none",
                color: "#d81b60",
                cursor: "pointer",
                fontSize: "13px",
                textDecoration: "underline",
              }}
            >
              Xóa
            </button>
          )}
        </div>
      </div>
      <div
        className="history-list"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          paddingRight: "5px",
          border: "1px solid #f9f9f9",
          borderRadius: "10px",
        }}
      >
        {pointHistory
          ?.filter((h) => {
            let matchType = true;
            if (historyFilter === "in") matchType = h.pointchange > 0;
            if (historyFilter === "out") matchType = h.pointchange < 0;

            let matchDate = true;
            if (filterDate) {
              matchDate =
                new Date(h.createddate).toISOString().split("T")[0] ===
                filterDate;
            }

            return matchType && matchDate;
          })
          ?.map((h) => (
            <div className="history-item" key={h.pointhistoryid}>
              <div className="h-left">
                <div className="h-type">{h.type}</div>
                <div className="h-date">
                  {new Date(h.createddate).toLocaleDateString("vi-VN")}{" "}
                  {new Date(h.createddate).toLocaleTimeString("vi-VN")}
                </div>
                <div className="h-desc">{h.description}</div>
              </div>
              <div
                className="h-right"
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  color: h.pointchange > 0 ? "#4caf50" : "#f44336",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {h.pointchange > 0 ? "+" : ""}
                {h.pointchange} điểm
              </div>
            </div>
          ))}
        {pointHistory.length === 0 && (
          <p className="empty-text">Chưa có lịch sử giao dịch điểm.</p>
        )}
      </div>
    </div>
  );

  const renderTab3 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Lịch sử đơn hàng</h2>
      <div className="order-list">
        {orders?.map((o) => {
          const statusClass = `status-${o.status?.split(" ")[0]?.toLowerCase()}`;
          return (
            <div
              className="order-item"
              key={o.orderid}
              onClick={() => navigate(`/order/${o.orderid}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="o-header">
                <span className="o-id">#{o.orderid}</span>
                <span className={`o-status ${statusClass}`}>{o.status}</span>
              </div>
              <div className="o-body">
                <div className="o-row">
                  <span>Ngày đặt:</span>
                  <strong>
                    {new Date(o.orderdate).toLocaleString("vi-VN")}
                  </strong>
                </div>
                <div className="o-row">
                  <span>Phương thức:</span>
                  <strong>{o.paymentmethod || o.ordertype}</strong>
                </div>
                <div className="o-row total">
                  <span>Tổng tiền:</span>
                  <strong>
                    {Number(o.finalamount).toLocaleString("vi-VN")}đ
                  </strong>
                </div>
              </div>
              <div
                className="o-footer"
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                {o.status === "Hoàn thành" ? (
                  <button
                    className="btn-view-order"
                    onClick={(e) => handleReorder(e, o.orderid)}
                    disabled={reorderLoading === o.orderid}
                    style={{
                      background: "#ffebf0",
                      color: "#d81b60",
                      border: "1px solid #ffccd5",
                    }}
                  >
                    {reorderLoading === o.orderid ? "Đang tải..." : "Đặt lại"}
                  </button>
                ) : (
                  <button
                    className="btn-view-order disabled-reorder"
                    disabled
                    title="Chỉ có thể đặt lại đơn hàng đã hoàn thành"
                    style={{
                      background: "#f5f5f5",
                      color: "#aaa",
                      border: "1px solid #ddd",
                      cursor: "not-allowed",
                    }}
                  >
                    Đặt lại
                  </button>
                )}

                {o.status === "Hoàn thành" &&
                  (o.is_saved_template ? (
                    <button
                      className="btn-view-order"
                      disabled
                      title="Đơn hàng này đã được lưu vào danh sách mẫu"
                      style={{
                        background: "#f0f0f0",
                        color: "#888",
                        border: "1px solid #ddd",
                        cursor: "default",
                      }}
                    >
                      ✓ Đã lưu
                    </button>
                  ) : (
                    <button
                      className="btn-view-order"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateOrderId(o.orderid);
                        setTemplateNameInput(
                          `Đơn mẫu ${new Date(o.orderdate).toLocaleDateString("vi-VN")}`,
                        );
                        setShowTemplateModal(true);
                      }}
                      style={{
                        background: "#fff9e6",
                        color: "#f57c00",
                        border: "1px solid #ffe082",
                      }}
                    >
                      ⭐ Lưu mẫu
                    </button>
                  ))}
                <button
                  className="btn-view-order"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/order/${o.orderid}`);
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="empty-text">Bạn chưa có đơn hàng nào.</p>
        )}
      </div>
    </div>
  );

  const renderTab4 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Đổi mật khẩu</h2>
      <form className="password-form" onSubmit={handleUpdatePassword}>
        <div className="input-grp">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Nhập ít nhất 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn-savepass"
          disabled={isUpdatingPass}
        >
          {isUpdatingPass ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );

  const renderTab5 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Yêu thích</h2>

      <h3 style={{ fontSize: "18px", color: "#d81b60", marginBottom: "15px" }}>
        Món yêu thích ({favorites.products.length})
      </h3>
      <div className="voucher-grid" style={{ marginBottom: "30px" }}>
        {favorites.products?.map((fav) => (
          <div
            key={fav.id}
            className="voucher-item"
            style={{ border: "1px solid #ffeff3" }}
          >
            <div className="v-title" style={{ color: "#333" }}>
              {fav.products.name}
            </div>
            <div className="v-points" style={{ fontSize: "12px" }}>
              {fav.products.subtitle}
            </div>
            <button
              className="btn-redeem"
              onClick={() => navigate(`/san-pham/${fav.productid}`)}
            >
              Xem món
            </button>
          </div>
        ))}
        {favorites.products.length === 0 && (
          <p className="empty-text">Bạn chưa thích món nào.</p>
        )}
      </div>

      <h3 style={{ fontSize: "18px", color: "#d81b60", marginBottom: "15px" }}>
        Đơn hàng mẫu ({favorites.templates.length})
      </h3>
      <div className="order-list">
        {favorites.templates?.map((tmp) => (
          <div
            key={tmp.templateid}
            className="order-item"
            style={{ borderLeft: "5px solid #ffcc00" }}
          >
            <div className="o-header" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <span
                  className="o-id"
                  style={{ display: "block", marginBottom: "5px" }}
                >
                  {tmp.templatename}
                </span>
                <span style={{ fontSize: "12px", color: "#888" }}>
                  Mô tả: {tmp.orders?.orderdetails?.length || 0} món trong combo
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    background: "#fff9e6",
                    color: "#f57c00",
                    border: "1px solid #ffe082",
                    padding: "5px 12px",
                    borderRadius: "15px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() =>
                    handleReorder(new MouseEvent("click") as any, tmp.orderid)
                  }
                  disabled={isDeletingTemplate !== null}
                >
                  Đặt nhanh
                </button>
                <button
                  style={{
                    background: "#f0f4ff",
                    color: "#3366cc",
                    border: "1px solid #cce0ff",
                    padding: "5px 12px",
                    borderRadius: "15px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => {
                    setSelectedTemplateForDetail(tmp);
                    setIsDetailModalOpen(true);
                  }}
                  disabled={isDeletingTemplate !== null}
                >
                  Xem chi tiết
                </button>
                <button
                  style={{
                    background: "#ffebee",
                    color: "#d32f2f",
                    border: "1px solid #ffcdd2",
                    padding: "5px 12px",
                    borderRadius: "15px",
                    fontSize: "12px",
                    cursor:
                      isDeletingTemplate === tmp.templateid
                        ? "wait"
                        : "pointer",
                    fontWeight: "bold",
                    opacity: isDeletingTemplate === tmp.templateid ? 0.6 : 1,
                  }}
                  onClick={() => handleDeleteTemplate(tmp.templateid)}
                  disabled={isDeletingTemplate !== null}
                  title="Xóa đơn mẫu này"
                >
                  {isDeletingTemplate === tmp.templateid
                    ? "⏳ Xóa..."
                    : "🗑️ Xóa"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {favorites.templates.length === 0 && (
          <p className="empty-text">Bạn chưa có đơn hàng mẫu nào.</p>
        )}
      </div>

      {/* Modal chi tiết combo */}
      <ComboDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        template={selectedTemplateForDetail}
        onAddToCart={(oid) => {
          setIsDetailModalOpen(false);
          handleReorder(new MouseEvent("click") as any, oid);
        }}
      />
    </div>
  );

  return (
    <div className="profile-page">
      {/* Toast Notification */}
      {errorMsg && (
        <div className="toast-msg toast-err">
          {errorMsg}
          <button
            onClick={() => setErrorMsg("")}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              marginLeft: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>
      )}
      {successMsg && (
        <div className="toast-msg toast-succ">
          {successMsg}
          <button
            onClick={() => setSuccessMsg("")}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              marginLeft: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="profile-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="user-brief">
            <div className="avatar">
              {session?.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Avatar" />
              ) : (
                customer?.fullname?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <h3>{customer?.fullname || "Thành viên"}</h3>
            <span className="tier-badge">{customer?.membership || "Bạc"}</span>
          </div>

          <div className="sidebar-menu">
            <button
              className={`sidebar-item ${activeTab === "1" ? "active" : ""}`}
              onClick={() => setSearchParams({ tab: "1" })}
            >
              <FiUser /> Thông tin chung
            </button>
            <button
              className={`sidebar-item ${activeTab === "2" ? "active" : ""}`}
              onClick={() => setSearchParams({ tab: "2" })}
            >
              <FiGift /> Điểm & Quà tặng
            </button>
            <button
              className={`sidebar-item ${activeTab === "3" ? "active" : ""}`}
              onClick={() => setSearchParams({ tab: "3" })}
            >
              <FiShoppingBag /> Lịch sử đơn hàng
            </button>
            <button
              className={`sidebar-item ${activeTab === "5" ? "active" : ""}`}
              onClick={() => setSearchParams({ tab: "5" })}
            >
              <FiHeart /> Mục yêu thích
            </button>
            <button
              className={`sidebar-item ${activeTab === "4" ? "active" : ""}`}
              onClick={() => setSearchParams({ tab: "4" })}
            >
              <FiLock /> Đổi mật khẩu
            </button>
            <button className="sidebar-item logout" onClick={handleLogout}>
              <FiLogOut /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="profile-content">
          {activeTab === "1" && renderTab1()}
          {activeTab === "2" && renderTab2()}
          {activeTab === "3" && renderTab3()}
          {activeTab === "4" && renderTab4()}
          {activeTab === "5" && renderTab5()}
        </main>
      </div>

      {/* Template Name Modal */}
      {showTemplateModal && (
        <div
          className="template-modal-overlay"
          onClick={() => setShowTemplateModal(false)}
        >
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Lưu Đơn hàng mẫu</h3>
            <p>
              Đặt tên cho combo này để nhanh chóng đặt lại trong lần sau nhé!
            </p>

            <div className="template-input-wrapper">
              <label>Tên đơn mẫu</label>
              <input
                type="text"
                className="template-input"
                placeholder="Ví dụ: Bữa sáng yêu thích, Combo trà sữa..."
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="template-modal-actions">
              <button
                className="btn-cancel-template"
                onClick={() => setShowTemplateModal(false)}
                disabled={isSavingTemplate}
              >
                Hủy
              </button>
              <button
                className="btn-save-template"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateNameInput.trim()}
              >
                {isSavingTemplate ? "Đang lưu..." : "Lưu Đơn Mẫu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
