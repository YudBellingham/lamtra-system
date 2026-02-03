import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const CuaHang: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative" }}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Cửa hàng</h1>
        <p>Danh sách cửa hàng Lamtra — địa chỉ và giờ mở cửa.</p>
      </div>
    </main>
  );
};

export default CuaHang;
