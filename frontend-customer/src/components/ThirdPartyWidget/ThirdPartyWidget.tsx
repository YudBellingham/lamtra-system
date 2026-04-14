/**
 * ZALO WIDGET POSITIONING
 * ================================
 * Vị trí: Bottom-Right (cạnh Chatbot AI)
 * Mục đích: Điều chỉnh positioning của Zalo bubble mặc định
 *
 * Zalo SDK tự inject icon và xử lý popup
 * Component này chỉ điều chỉnh vị trí để không overlap Chatbot
 */

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
