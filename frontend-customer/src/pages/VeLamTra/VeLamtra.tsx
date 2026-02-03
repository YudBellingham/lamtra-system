import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const VeLamtra: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative" }}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Về Lamtra</h1>
        <p>Thông tin về Lamtra — sứ mệnh, tầm nhìn và giá trị cốt lõi.</p>
      </div>
    </main>
  );
};

export default VeLamtra;
