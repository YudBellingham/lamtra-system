import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { FiCheckCircle, FiXCircle, FiShoppingBag, FiMap } from 'react-icons/fi';
import './styles/PaymentResult.css';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');

    if (!txnRef) {
      navigate('/');
      return;
    }

    processedRef.current = true;
    setOrderId(txnRef);

    const updateOrder = async () => {
      try {
        if (responseCode === '00') {
          await supabase.from('orders').update({ status: 'Chờ xác nhận' }).eq('orderid', txnRef);
          clearCart();
          setStatus('success');
          
          setTimeout(() => {
            navigate(`/order/${txnRef}`);
          }, 3000);
        } else {
          await supabase.from('orders').update({ status: 'Đã hủy' }).eq('orderid', txnRef);
          setStatus('failed');
        }
      } catch (error) {
        console.error('Error updating order:', error);
        setStatus('failed');
      }
    };

    updateOrder();
  }, [searchParams, navigate, clearCart]);

  if (status === 'loading') {
    return (
      <main className="payment-result-page">
        <div className="payment-card loading">
          <div className="spinner"></div>
          <h2>Đang xử lý kết quả...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-result-page">
      <div className="payment-card">
        {status === 'success' ? (
          <>
            <FiCheckCircle className="result-icon success" />
            <h2 className="success-text">Thanh toán thành công!</h2>
            <p>Đơn hàng <strong>{orderId}</strong> của bạn đang được xử lý. Bạn sẽ được chuyển hướng sau 3 giây...</p>
            <div className="result-actions">
              <Link to={`/order/${orderId}`} className="btn-primary">
                <FiMap /> Theo dõi đơn hàng
              </Link>
              <Link to="/" className="btn-secondary">
                Về trang chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            <FiXCircle className="result-icon failed" />
            <h2 className="failed-text">Thanh toán thất bại</h2>
            <p>Giao dịch của <strong>{orderId}</strong> đã bị hủy hoặc có lỗi xảy ra. Vui lòng quay lại giỏ hàng để sửa đổi hoặc thử lại phương thức khác.</p>
            <div className="result-actions">
              <Link to="/cart" className="btn-primary">
                <FiShoppingBag /> Quay lại giỏ hàng
              </Link>
              <Link to="/" className="btn-secondary">
                Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default PaymentResult;
