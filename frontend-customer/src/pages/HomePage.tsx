import React from "react";

const HomePage: React.FC = () => {
  return (
    <main style={{ padding: "40px" }}>
      <h1>Chào mừng đến với Lamtra ☕</h1>
      <p>
        Hệ thống đặt trà sữa trực tuyến — nhanh chóng, tiện lợi và hiện đại của nhóm 13.
      </p>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>🔥 Món bán chạy</h3>
        <ul>
          <li>Trà sữa truyền thống</li>
          <li>Trà đào cam sả</li>
          <li>Matcha kem cheese</li>
        </ul>
      </div>
    </main>
  );
};

export default HomePage;
