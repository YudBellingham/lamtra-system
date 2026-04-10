import React from "react";
import { TinTuc } from "../types/tintuc";
import "../styles/TinTuc.css";

interface TinTucCardProps {
  tintuc: TinTuc;
  onClick: () => void;
}

const TinTucCard: React.FC<TinTucCardProps> = ({ tintuc, onClick }) => {
  return (
    <div className="tintuc-card" onClick={onClick}>
      <div className="tintuc-card-image">
        <img src={tintuc.image} alt={tintuc.title} />
      </div>
      <div className="tintuc-card-content">
        <h3 className="tintuc-card-title">{tintuc.title}</h3>
        <p className="tintuc-card-date">{tintuc.date}</p>
        <p className="tintuc-card-summary">{tintuc.summary}</p>
        <button className="tintuc-card-button">Đọc thêm →</button>
      </div>
    </div>
  );
};

export default TinTucCard;
