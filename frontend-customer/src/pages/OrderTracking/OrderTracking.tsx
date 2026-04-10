import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiChevronLeft, FiCheck } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './styles/OrderTracking.css';

const STEPS = ['Chờ xác nhận', 'Đang làm', 'Đang giao', 'Hoàn thành'];

const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('orderid', id)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: detailsData, error: detailsError } = await supabase
          .from('orderdetails')
          .select('*, products(name, imageurl)')
          .eq('orderid', id);

        if (detailsError) throw detailsError;
        setDetails(detailsData || []);

        const { data: revData } = await supabase.from('reviews').select('reviewid').eq('orderid', id);
        if (revData && revData.length > 0) {
          setHasReviewed(true);
        }
      } catch (error) {
        toast.error('Không tìm thấy thông tin đơn hàng!');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel(`public:orders:orderid=eq.${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `orderid=eq.${id}` }, payload => {
        setOrder(payload.new);
        toast.success(`Đơn hàng của bạn đã chuyển sang trạng thái: ${payload.new.status}`);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleReceived = async () => {
    try {
      const { error } = await supabase.from('orders').update({ status: 'Hoàn thành' }).eq('orderid', id);
      if (error) throw error;
      setOrder({ ...order, status: 'Hoàn thành' });
      toast.success('Cảm ơn bạn đã xác nhận nhận hàng!');
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + e.message);
    }
  };

  const handleCancelOrder = async () => {
    setIsCanceling(true);
    try {
      const { error } = await supabase.from('orders').update({ status: 'Hủy' }).eq('orderid', id);
      if (error) throw error;
      
      setOrder({ ...order, status: 'Hủy' });
      setShowCancelModal(false);
      
      if (order.paymentmethod === 'VNPAY') {
        toast('Đã hủy đơn hàng. Số tiền bạn đã thanh toán qua VNPay sẽ được quán liên hệ hoàn trả trong vòng 24h.', {
          duration: 5000,
          position: 'bottom-center',
          icon: 'ℹ️',
          style: { background: '#fff0f4', color: '#d81b60', border: '1px solid #ffccd5', fontWeight: 600 }
        });
      } else {
        toast.success('Đã hủy đơn hàng thành công');
      }
    } catch (e: any) {
      toast.error('Lỗi khi hủy đơn hàng: ' + e.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOpenReviewModal = () => {
    // 1. Đánh giá chung cho toàn bộ đơn hàng (productid = null)
    const generalReview = {
      type: 'order',
      detailid: 0, // dummy
      productid: null,
      name: `Đánh giá Đơn hàng #${order.orderid}`,
      rating: 5,
      comment: ''
    };

    // 2. Đánh giá cho từng sản phẩm (Group by productid)
    const productMap = new Map();
    details.forEach(d => {
      if (!productMap.has(d.productid)) {
        productMap.set(d.productid, {
          type: 'product',
          detailid: d.orderdetailid,
          productid: d.productid,
          name: d.products?.name,
          rating: 5,
          comment: ''
        });
      }
    });

    const productsReviews = Array.from(productMap.values());
    
    setReviewsData([generalReview, ...productsReviews]);
    setShowReviewModal(true);
  };

  const handleUpdateReview = (index: number, key: string, value: any) => {
    setReviewsData(prev => prev.map((r, idx) => idx === index ? { ...r, [key]: value } : r));
  };

  const handleSubmitReview = async () => {
    if (reviewsData.some(r => !r.comment.trim())) {
      toast.error('Vui lòng nhập nhận xét đầy đủ.');
      return;
    }
    setIsSubmittingReview(true);
    try {
       const userSession = await supabase.auth.getSession();
       const authUserId = userSession.data.session?.user?.id;
       if (!authUserId) throw new Error("Chưa đăng nhập");

       // Quy đổi UUID sang CustomerID (int8)
       const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('customerid')
        .eq('authid', authUserId)
        .single();
       
       if (customerError || !customerData) {
         throw new Error("Không tìm thấy thông tin khách hàng trong hệ thống.");
       }

       const customerId = customerData.customerid;

       const payload = reviewsData.map(r => ({
          customerid: customerId,
          orderid: id,
          productid: r.productid,
          rating: r.rating,
          comment: r.comment,
          createdat: new Date().toISOString()
       }));
       
       const { error } = await supabase.from('reviews').insert(payload);
       if (error) throw error;
       toast.success('Gửi đánh giá thành công! Cảm ơn bạn rất nhiều!');
       setHasReviewed(true);
       setShowReviewModal(false);
    } catch (e: any) {
       toast.error('Gửi đánh giá thất bại: ' + e.message);
    } finally {
       setIsSubmittingReview(false);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === 'Hủy') return -1;
    if (status === 'Chờ thanh toán') return -1;
    const idx = STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  if (loading) return <div className="tracking-page"><div className="loader"></div></div>;
  if (!order) return <div className="tracking-page"><h2>Đơn hàng không tồn tại</h2></div>;

  const currentStep = getStepIndex(order.status);
  const isCanceled = order.status === 'Hủy';
  const isPendingPay = order.status === 'Chờ thanh toán';

  return (
    <main className="tracking-page">
      <div className="tracking-card">
        <Link to="/" className="back-link"><FiChevronLeft /> Quay lại trang chủ</Link>
        
        <div className="tracking-header">
          <div>
            <h2>Đơn hàng #{order.orderid}</h2>
            <p className="order-date">{new Date(order.orderdate).toLocaleString('vi-VN')}</p>
          </div>
          <div className={`status-badge ${isCanceled ? 'canceled' : isPendingPay ? 'pending' : 'active'}`}>
            {order.status}
          </div>
        </div>

        {(!isCanceled && !isPendingPay) && (
          <div className="stepper-wrapper">
            {STEPS.map((step, index) => {
              const isActive = index <= currentStep;
              return (
                <div key={step} className={`stepper-item ${isActive ? 'active' : ''}`}>
                  <div className="step-counter">
                    {isActive ? <FiCheck /> : index + 1}
                  </div>
                  <div className="step-name">{step}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="order-items-list">
          <h3>Món đã đặt</h3>
          {details.map((item) => (
            <div key={item.orderdetailid} className="tracking-item">
              <img src={item.products?.imageurl || 'https://via.placeholder.com/60'} alt="product" />
              <div className="tracking-item-info">
                <h4>{item.quantity}x {item.products?.name}</h4>
                <p>Size {item.sizeid === 2 ? 'L' : 'M'}, {item.sugarlevel} Đường, {item.icelevel} Đá</p>
                {item.note && <p className="item-note">Lưu ý: {item.note}</p>}
              </div>
              <div className="tracking-item-price">
                {(item.subtotal || item.priceatorder * item.quantity).toLocaleString('vi-VN')}đ
              </div>
            </div>
          ))}
        </div>

        <div className="tracking-footer">
          <div className="total-row">
            <span>Tổng thanh toán</span>
            <span className="total-price">{order.finalamount?.toLocaleString('vi-VN')}đ</span>
          </div>
          
          <button 
            className="btn-received" 
            disabled={order.status !== 'Đang giao'} 
            onClick={handleReceived}
          >
            ĐÃ NHẬN ĐƯỢC HÀNG
          </button>
          
          {order.status !== 'Đang giao' && order.status !== 'Hoàn thành' && !isCanceled && (
            <p className="received-hint">Bạn có thể xác nhận khi đơn hàng chuyển sang trạng thái "Đang giao".</p>
          )}

          {order.status === 'Chờ xác nhận' && (
            <button 
              className="btn-cancel-order"
              onClick={() => setShowCancelModal(true)}
            >
              Hủy đơn hàng
            </button>
          )}

          {order.status === 'Hoàn thành' && (
            <button 
              className="btn-review-order"
              disabled={hasReviewed}
              onClick={handleOpenReviewModal}
              style={{ background: hasReviewed ? '#ccc' : '#d81b60', color: 'white', padding: '14px 20px', border: 'none', borderRadius: '12px', cursor: hasReviewed ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%', marginTop: '15px', fontFamily: 'Quicksand' }}
            >
              {hasReviewed ? 'ĐÃ ĐÁNH GIÁ' : 'ĐÁNH GIÁ SẢN PHẨM'}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="cart-confirm-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="cart-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận hủy đơn</h3>
            <p>Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setShowCancelModal(false)}>Không</button>
              <button 
                className="btn-confirm" 
                disabled={isCanceling} 
                onClick={handleCancelOrder}
                style={{ background: '#c62828' }}
              >
                {isCanceling ? 'Đang xử lý...' : 'Đồng ý hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="cart-confirm-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="cart-confirm-modal review-modal" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Đánh giá Đơn hàng #{order.orderid}</h3>
            
            <div className="review-items-container" style={{ textAlign: 'left', marginTop: '20px' }}>
              {reviewsData.map((rev, index) => (
                <div key={index} className="review-item-box" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: index < reviewsData.length - 1 ? '1px dashed #ccc' : 'none' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: rev.productid ? '#d81b60' : '#222', fontSize: rev.productid ? '16px' : '18px' }}>
                    {rev.productid ? `Món ăn: ${rev.name}` : rev.name}
                  </h4>
                  
                  <div className="star-rating" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar 
                        key={star} 
                        size={28} 
                        color={star <= rev.rating ? "#ffc107" : "#e4e5e9"} 
                        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                        onClick={() => handleUpdateReview(index, 'rating', star)}
                      />
                    ))}
                  </div>

                  <textarea 
                    rows={3} 
                    placeholder={rev.productid ? "Nhập nhận xét của bạn về món này..." : "Nhập nhận xét chung về chất lượng phục vụ và đơn hàng..."}
                    value={rev.comment}
                    onChange={(e) => handleUpdateReview(index, 'comment', e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>

            <div className="confirm-modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Trở về</button>
              <button 
                className="btn-confirm" 
                disabled={isSubmittingReview} 
                onClick={handleSubmitReview}
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default OrderTracking;
