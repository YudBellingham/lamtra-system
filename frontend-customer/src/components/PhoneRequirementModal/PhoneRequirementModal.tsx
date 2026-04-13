import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface PhoneModalProps {
  customerData: any;
  onSuccess: () => void;
}

const PhoneRequirementModal: React.FC<PhoneModalProps> = ({
  customerData,
  onSuccess,
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg(
        "Số điện thoại không hợp lệ (Phải đúng 10 số, đầu số hợp lệ).",
      );
      return;
    }

    setLoading(true);
    try {
      const { data: exist } = await supabase
        .from("customers")
        .select("phone")
        .eq("phone", phone)
        .maybeSingle();
      if (exist) {
        setErrorMsg(
          "Số điện thoại này đã được sử dụng. Vui lòng nhập số khác!",
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("customers")
        .update({ phone: phone })
        .eq("customerid", customerData.customerid);
      if (error) throw error;

      toast.success("Cập nhật thông tin thành công!");
      onSuccess();
    } catch (e: any) {
      toast.error("Có lỗi hệ thống xảy ra: " + e.message, {
        id: "phone-sys-err",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "15px",
          padding: "30px",
          width: "90%",
          maxWidth: "400px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            color: "#d81b60",
            marginBottom: "15px",
            fontFamily: "Quicksand",
          }}
        >
          Bổ Sung Thông Tin
        </h2>
        <p style={{ color: "#555", marginBottom: "20px", fontSize: "15px" }}>
          Để đảm bảo quyền lợi tích điểm hạng thành viên và nhận voucher, vui
          lòng cung cấp số điện thoại của bạn.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Nhập số điện thoại (VD: 0987654321)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ffccd5",
              marginBottom: "20px",
              fontFamily: "Quicksand",
              outline: "none",
              fontSize: "16px",
            }}
            disabled={loading}
            autoFocus
          />
          {errorMsg && (
            <div
              style={{
                color: "#d32f2f",
                background: "#ffebee",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "15px",
                fontWeight: 600,
                fontFamily: "Quicksand",
              }}
            >
              {errorMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !phone}
            style={{
              width: "100%",
              background: "#d81b60",
              color: "#fff",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: loading || !phone ? "not-allowed" : "pointer",
              fontFamily: "Quicksand",
            }}
          >
            {loading ? "Đang cập nhật..." : "Hoàn Tất Cập Nhật"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default PhoneRequirementModal;
