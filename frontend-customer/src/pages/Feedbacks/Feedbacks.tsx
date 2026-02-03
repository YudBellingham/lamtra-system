import React from "react";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";

const Feedbacks: React.FC = () => {
  return (
    <main style={{ padding: "40px", position: "relative" }}>
      <BackgroundDecor />
      <div style={{ position: "relative", zIndex: 2 }}>
        <h1>Feedbacks</h1>
        <p>Gửi ý kiến, đánh giá và phản hồi về trải nghiệm tại Lamtra.</p>
      </div>
    </main>
  );
};

export default Feedbacks;
