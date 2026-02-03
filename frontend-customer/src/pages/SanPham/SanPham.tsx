import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const SanPham: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative" }}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Sản phẩm</h1>
        <p>Danh mục sản phẩm Lamtra — trà, topping và đồ uống đặc sắc.</p>
      </div>
    </main>
  );
};

export default SanPham;
