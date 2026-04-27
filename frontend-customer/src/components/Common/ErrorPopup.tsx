import React from "react";
import "./ErrorPopup.css";

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, onClose }) => {
  return (
    <div className="error-popup-overlay">
      <div className="error-popup-content">
        <div className="error-popup-header">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="error-popup-icon"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.74a3.25 3.25 0 01-2.598 4.857H4.644a3.25 3.25 0 01-2.598-4.857L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="error-popup-title">Thông báo lỗi</h3>
        </div>
        <p className="error-popup-message">{message}</p>
        <button onClick={onClose} className="error-popup-close-btn">
          Đã hiểu
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
