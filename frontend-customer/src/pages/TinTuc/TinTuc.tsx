import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const TinTuc: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative"}}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Tin tức</h1>
        <p>
          Cập nhật những tin tức mới nhất về Lamtra và chương trình khuyến mãi.
        </p>
      </div>
    </main>
  );
};

export default TinTuc;
