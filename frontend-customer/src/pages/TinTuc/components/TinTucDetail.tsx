import React from "react";
import { useNavigate } from "react-router-dom";
import { TinTuc } from "../types/tintuc";
import "../styles/TinTucDetail.css";

interface TinTucDetailProps {
  tintuc: TinTuc;
}

const TinTucDetailComponent: React.FC<TinTucDetailProps> = ({ tintuc }) => {
  const navigate = useNavigate();

  return (
    <article className="tintuc-detail">
      <button
        className="tintuc-detail-back"
        onClick={() => navigate("/tin-tuc")}
      >
        ← Quay lại danh sách
      </button>

      <div className="tintuc-detail-header">
        <img
          src={tintuc.image}
          alt={tintuc.title}
          className="tintuc-detail-image"
        />
        <div className="tintuc-detail-info">
          <h1 className="tintuc-detail-title">{tintuc.title}</h1>
          <div className="tintuc-detail-meta">
            <span className="tintuc-detail-date">{tintuc.date}</span>
            {tintuc.author && (
              <span className="tintuc-detail-author">Bởi {tintuc.author}</span>
            )}
          </div>
        </div>
      </div>

      <div className="tintuc-detail-content">
        {tintuc.content.split("\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
};

export default TinTucDetailComponent;
