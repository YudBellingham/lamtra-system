const ZaloWidget = () => {
  return (
    <style>{`
      /* Position Zalo widget next to Chatbot (Bottom-Right) */
      .zalo-chat-widget {
        position: fixed !important;
        bottom: 30px !important;
        right: 100px !important;
        z-index: 9999 !important;
      }
      
      /* Ensure all Zalo elements are visible */
      .zalo-widget-container,
      .zalo-bubble-sm,
      [data-zalo-widget] {
        display: flex !important;
        z-index: 9999 !important;
      }
    `}</style>
  );
};

export default ZaloWidget;
