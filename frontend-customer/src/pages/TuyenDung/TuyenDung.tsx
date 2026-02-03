import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const TuyenDung: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative" }}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Tuyển dụng</h1>
        <p>Thông tin tuyển dụng và các vị trí đang cần tuyển tại Lamtra.</p>
      </div>
    </main>
  );
};

export default TuyenDung;
