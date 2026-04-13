import React from "react";
import { useNavigate } from "react-router-dom";
import TinTucCard from "./TinTucCard";
import { TinTuc } from "../types/tintuc";
import "../styles/TinTuc.css";

interface TinTucListProps {
  tintucs: TinTuc[];
}

const TinTucList: React.FC<TinTucListProps> = ({ tintucs }) => {
  const navigate = useNavigate();

  const handleCardClick = (id: string) => {
    navigate(`/tin-tuc/${id}`);
  };

  return (
    <div className="tintuc-list-container">
      <div className="tintuc-list">
        {tintucs.map((item) => (
          <TinTucCard
            key={item.id}
            tintuc={item}
            onClick={() => handleCardClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TinTucList;
