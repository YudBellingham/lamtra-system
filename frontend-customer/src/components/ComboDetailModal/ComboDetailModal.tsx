import React from 'react';
import { FiX, FiShoppingCart, FiInfo } from 'react-icons/fi';

interface ComboDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onAddToCart: (orderId: string) => void;
}

const ComboDetailModal: React.FC<ComboDetailModalProps> = ({ isOpen, onClose, template, onAddToCart }) => {
  if (!isOpen || !template) return null;

  const order = template.orders;
  const items = order?.orderdetails || [];

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalFadeIn 0.3s ease-out',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to right, #fff, #fff9fb)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#d81b60', fontWeight: '800', fontFamily: 'Quicksand' }}>
              {template.templatename}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
              Chi tiết combo bạn đã lưu
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#666',
            transition: 'all 0.2s'
          }}>
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px 30px',
          overflowY: 'auto',
          flex: 1,
          background: '#fff'
        }}>
          {items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item: any, idx: number) => (
                <div key={idx} style={{
                  paddingBottom: idx === items.length - 1 ? 0 : '20px',
                  borderBottom: idx === items.length - 1 ? 'none' : '1px dashed #eee',
                  display: 'flex',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    background: '#fcfcfc',
                    border: '1px solid #f0f0f0',
                    flexShrink: 0
                  }}>
                    <img 
                      src={item.products?.imageurl || 'https://via.placeholder.com/100'} 
                      alt={item.products?.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '700' }}>
                        {item.products?.name}
                      </h4>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d81b60' }}>
                        x{item.quantity}
                      </span>
                    </div>
                    
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', background: '#fff0f4', color: '#d81b60', padding: '3px 10px', borderRadius: '30px', fontWeight: '600' }}>
                        Size {item.sizeid || 'M'}
                      </span>
                      <span style={{ fontSize: '12px', background: '#f0f4ff', color: '#3366cc', padding: '3px 10px', borderRadius: '30px', fontWeight: '600' }}>
                        {item.sugarlevel || '100%'} đường
                      </span>
                      <span style={{ fontSize: '12px', background: '#f0f4ff', color: '#3366cc', padding: '3px 10px', borderRadius: '30px', fontWeight: '600' }}>
                        {item.icelevel || '100%'} đá
                      </span>
                    </div>

                    {item.ordertoppings && item.ordertoppings.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiInfo size={12} /> Topping thêm:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {item.ordertoppings.map((ot: any, otIdx: number) => (
                            <span key={otIdx} style={{ fontSize: '12px', color: '#555', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>
                              {ot.toppings?.name} (x{ot.quantity || 1})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.note && (
                      <div style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic', color: '#777', background: '#f9f9f9', padding: '6px 10px', borderRadius: '8px', borderLeft: '3px solid #ddd' }}>
                        " {item.note} "
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>Không có dữ liệu chi tiết cho đơn hàng này.</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 30px',
          borderTop: '1px solid #f0f0f0',
          background: '#fcfcfc',
          display: 'flex',
          gap: '12px'
        }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid #ddd',
              background: '#fff',
              color: '#666',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Quicksand'
            }}
          >
            Đóng
          </button>
          <button 
            onClick={() => onAddToCart(template.orderid)}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px -6px rgba(216, 27, 96, 0.4)',
              transition: 'all 0.2s',
              fontFamily: 'Quicksand'
            }}
          >
            <FiShoppingCart size={18} />
            Thêm combo này vào giỏ
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ComboDetailModal;
