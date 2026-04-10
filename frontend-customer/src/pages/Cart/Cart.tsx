import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiArrowLeft, FiTag, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/Cart.css';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to center map
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
}

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [orderType, setOrderType] = useState('Giao hàng');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address_detail: '',
    paymentMethod: 'COD'
  });
  const [orderNote, setOrderNote] = useState('');

  // Shipping dynamic states
  const [shippingDistance, setShippingDistance] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Provinces API
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<{code: string, name: string} | null>(null);
  const [selectedWard, setSelectedWard] = useState<{code: string, name: string} | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.762622, 106.660172]); // Default HCM
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Fallback UI State
  const [fallbackLevelWarning, setFallbackLevelWarning] = useState<string>('');

  // Branches
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | string>('');
  const [branchError, setBranchError] = useState('');

  // Vouchers
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    // load provinces
    axios.get('https://provinces.open-api.vn/api/p/').then(res => setProvinces(res.data)).catch(console.error);
    // load branches
    supabase.from('branches').select('*').eq('isactive', true).then(res => setBranches(res.data || []));
    
    // fetch vouchers
    const fetchVouchers = async () => {
       const session = (await supabase.auth.getSession()).data.session;
       if (session?.user?.id) {
           const {data: cust} = await supabase.from('customers').select('customerid').eq('authid', session.user.id).single();
           if (cust) {
               const {data: myVouchers} = await supabase.from('customervouchers').select('*, vouchers(*)').eq('customerid', cust.customerid).eq('status', 'Chưa sử dụng');
               if (myVouchers) {
                   setVouchers(myVouchers.map(v => ({ ...v.vouchers, cvId: v.custvoucherid })));
               }
           }
       }
    };
    fetchVouchers();
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedProvince({code, name});
    setSelectedWard(null); setWards([]);
    if(code) {
       axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=3`).then(res => {
           let allWards: any[] = [];
           res.data.districts.forEach((d: any) => {
               d.wards.forEach((w: any) => {
                   allWards.push({ code: w.code, name: `${d.name} - ${w.name}` });
               });
           });
           setWards(allWards);
       });
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedWard({code, name});
  };

  const estimateShipping = async (manualLat?: number, manualLng?: number) => {
     if (orderType === 'Giao hàng' && selectedProvince && selectedWard && formData.address_detail) {
         setIsCalculatingShipping(true);
         setShippingError('');
         setFallbackLevelWarning('');
         
         // Only reset distance/fee if not a manual drag to keep results stable while computing
         if (!manualLat) {
            setShippingDistance(null);
            setShippingFee(0);
         }

         try {
             const payload = {
                 cart,
                 customerInfo: {
                     city: selectedProvince.name,
                     ward: selectedWard.name,
                     address_detail: formData.address_detail,
                     exactLat: manualLat,
                     exactLng: manualLng
                 }
             };
             const res = await axios.post('http://localhost:8000/api/estimate-shipping', payload);
             if (res.data.success) {
                 const { distance, shippingFee, fallbackLevel, lat, lng } = res.data;
                 setShippingDistance(Number(distance));
                 
                 if (fallbackLevel > 1) {
                     setFallbackLevelWarning('Đang ước tính khoảng cách dựa trên khu vực Phường/Thành phố của bạn do không tìm thấy chính xác số nhà.');
                 }

                 if (shippingFee === -1) {
                     setShippingError(`Dạ, Lam Trà rất tiếc vì địa chỉ của bạn hiện đang cách cửa hàng gần nhất ${distance} km. Để đảm bảo chất lượng đồ uống tốt nhất, quán tạm thời chưa thể giao hàng với khoảng cách trên 15km. Mong bạn thông cảm và hẹn gặp bạn ở dịp gần nhất nhé!`);
                 } else {
                     setShippingFee(shippingFee);
                 }

                 // Update Map
                 if (lat && lng) {
                    const newCoords: [number, number] = [parseFloat(lat), parseFloat(lng)];
                    if (!manualLat) {
                       setMapCenter(newCoords);
                       setMarkerPos(newCoords);
                       setIsMapVisible(true);
                    }
                 }
             }
         } catch(err: any) {
             setShippingError(err.response?.data?.error || 'Lỗi máy chủ khi tính khoảng cách giao hàng');
         } finally {
             setIsCalculatingShipping(false);
         }
     }
  };

  const handleMarkerDragEnd = (event: any) => {
      const marker = event.target;
      const position = marker.getLatLng();
      const newLat = position.lat;
      const newLng = position.lng;
      setMarkerPos([newLat, newLng]);
      estimateShipping(newLat, newLng);
  };

  useEffect(() => {
     if (orderType === 'Tại chỗ') {
         setShippingFee(0);
         setShippingError('');
         setShippingDistance(null);
     }
  }, [orderType]);

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const bid = e.target.value;
      setSelectedBranchId(bid);
      setBranchError('');
      if (!bid) return;
      
      const { data: bStatus } = await supabase.from('branchproductstatus').select('*').eq('branchid', bid);
      let missingItem = null;
      for (const item of cart) {
         const prodStatus = bStatus?.find(s => s.productid === item.productid);
         if (!prodStatus || prodStatus.status !== 'Còn món') {
            missingItem = item.name;
            break;
         }
      }
      if (missingItem) {
          setBranchError(`Chi nhánh này hiện đang tạm hết món [${missingItem}]. Vui lòng xóa món khỏi giỏ hoặc chọn chi nhánh khác.`);
      }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const getOptionsSummary = (item: any) => {
    let summary = `Size ${item.size}, ${item.sugar} Đường, ${item.ice} Đá`;
    if (item.toppings && item.toppings.length > 0) summary += `, + ${item.toppings.map((t: any) => t.name).join(', ')}`;
    if (item.note) summary += `\nLưu ý: ${item.note}`;
    return summary;
  };

  const applyVoucher = (v: any) => {
      if (cartTotal < (v.minordervalue || 0)) {
          toast.error(`Đơn hàng tối thiểu ${formatPrice(v.minordervalue || 0)} để sử dụng mã này.`);
          return;
      }
      setSelectedVoucher(v);
      let discount = 0;
      if (v.discounttype === '%') {
          discount = (cartTotal * v.discountvalue) / 100;
          if (v.maxdiscount && discount > v.maxdiscount) discount = v.maxdiscount;
      } else {
          discount = v.discountvalue;
      }
      setDiscountAmount(discount);
      setShowVoucherModal(false);
      toast.success('Áp dụng mã thành công!');
  };

  const finalAmount = Math.max(0, cartTotal - discountAmount) + shippingFee;

  const handleCheckoutSubmit = async () => {
    if (orderType === 'Giao hàng') {
       if (!formData.fullName || !formData.phone || !formData.address_detail || !selectedProvince || !selectedWard) {
         toast.error('Vui lòng điền đầy đủ thông tin giao hàng!'); return;
       }
       if (shippingError) {
         toast.error('Vui lòng kiểm tra lại địa chỉ giao nhận.'); return;
       }
    } else {
       if (!formData.fullName || !formData.phone || !selectedBranchId) {
         toast.error('Vui lòng điền thông tin và chọn chi nhánh!'); return;
       }
       if (branchError) {
         toast.error('Không thể đặt vì chi nhánh đang hết món.'); return;
       }
    }

    setIsSubmitting(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const statusToSave = formData.paymentMethod === 'COD' ? 'Chờ xác nhận' : 'Chờ thanh toán';
      const session = (await supabase.auth.getSession()).data.session;
      let customerId = null;
      if (session?.user?.id) {
          const { data } = await supabase.from('customers').select('customerid').eq('authid', session.user.id).single();
          customerId = data?.customerid;
      }

      const payload = {
          orderId,
          cart,
          customerId,
          totalAmount: cartTotal,
          discountAmount: discountAmount,
          voucherId: selectedVoucher?.voucherid || null,
          paymentMethod: formData.paymentMethod,
          status: statusToSave,
          isDelivery: orderType === 'Giao hàng',
          orderNote: orderNote,
          customerInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            branchid: selectedBranchId,
            city: selectedProvince?.name,
            ward: selectedWard?.name,
            address_detail: formData.address_detail,
            exactLat: markerPos ? markerPos[0] : null,
            exactLng: markerPos ? markerPos[1] : null
          }
      };

      const res = await axios.post('http://localhost:8000/api/checkout', payload);
      if (res.data.success) {
         if (formData.paymentMethod === 'COD') {
           toast.success('Đặt hàng thành công!');
           clearCart();
           navigate(`/order/${orderId}`);
         } else {
           const vnpRes = await axios.post('http://localhost:8000/api/create_payment_url', { orderId, amount: finalAmount, orderInfo: `Thanh toan don hang ${orderId}` });
           if (vnpRes.data.url) window.location.href = vnpRes.data.url;
         }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="empty-cart">
          <FiShoppingBag className="empty-cart-icon" />
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Dường như bạn chưa chọn món nào. Hãy khám phá menu của Lam Trà nhé!</p>
          <Link to="/san-pham" className="btn-continue">Quay lại cửa hàng</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <div className="cart-left">
          {!isCheckout ? (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.imageurl || 'https://via.placeholder.com/100'} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-options">{getOptionsSummary(item)}</div>
                  <div className="cart-item-price">{formatPrice(item.itemTotal)}</div>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}><FiMinus /></button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}><FiPlus /></button>
                  </div>
                  <button className="remove-btn" onClick={() => setItemToDelete(item)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="checkout-form-container">
              <button className="back-cart-btn" onClick={() => setIsCheckout(false)}>
                <FiArrowLeft /> Quay lại giỏ hàng
              </button>
              
              <div className="order-type-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                 <button 
                   className={`type-tab ${orderType === 'Giao hàng' ? 'active' : ''}`}
                   onClick={() => setOrderType('Giao hàng')}
                   style={{ flex: 1, padding: '12px', border: '1px solid #d81b60', borderRadius: '8px', background: orderType === 'Giao hàng' ? '#d81b60' : 'transparent', color: orderType === 'Giao hàng' ? '#fff' : '#d81b60', fontWeight: 'bold', cursor: 'pointer' }}
                 >Giao hàng tận nơi</button>
                 <button 
                   className={`type-tab ${orderType === 'Tại chỗ' ? 'active' : ''}`}
                   onClick={() => setOrderType('Tại chỗ')}
                   style={{ flex: 1, padding: '12px', border: '1px solid #d81b60', borderRadius: '8px', background: orderType === 'Tại chỗ' ? '#d81b60' : 'transparent', color: orderType === 'Tại chỗ' ? '#fff' : '#d81b60', fontWeight: 'bold', cursor: 'pointer' }}
                 >Đến lấy tại quán</button>
              </div>

              <h2 className="checkout-heading">Thông tin người nhận</h2>
              <div className="checkout-group">
                <label>Tên người nhận *</label>
                <input type="text" placeholder="VD: Nguyễn Văn A" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              
              <div className="checkout-group">
                <label>Số điện thoại *</label>
                <input type="tel" placeholder="VD: 0912345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              {orderType === 'Giao hàng' && (
                  <div className="address-section">
                     <h2 className="checkout-heading">Địa chỉ giao hàng</h2>
                     <div className="checkout-group double">
                        <select onChange={handleProvinceChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', marginBottom: '10px' }}>
                           <option value="">Chọn Tỉnh/Thành phố *</option>
                           {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>
                        <select onChange={e => { handleWardChange(e); }} onBlur={() => estimateShipping()} disabled={!selectedProvince} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}>
                           <option value="">Chọn Quận/Huyện - Phường/Xã *</option>
                           {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                        </select>
                     </div>
                     <div className="checkout-group">
                        <label>Số nhà, tên đường chi tiết *</label>
                        <textarea placeholder="VD: Tòa nhà CMC, Số 11 Duy Tân" rows={2} value={formData.address_detail} onBlur={() => estimateShipping()} onChange={e => setFormData({...formData, address_detail: e.target.value})}></textarea>
                     </div>
                     {fallbackLevelWarning && (
                        <p style={{ color: '#d88b00', background: '#fff9e6', padding: '10px', borderRadius: '8px', fontSize: '13px', fontStyle: 'italic', marginTop: '5px' }}>{fallbackLevelWarning}</p>
                     )}

                     {isMapVisible && markerPos && (
                        <div style={{ marginTop: '15px' }}>
                           <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiInfo size={14} color="#d81b60" /> 
                              <strong>Mẹo:</strong> Kéo thả Ghim đỏ vào chính xác vị trí nhận hàng của bạn để tính phí chính xác nhất.
                           </p>
                           <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
                              <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                 <ChangeView center={mapCenter} />
                                 <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                 />
                                 <Marker 
                                    position={markerPos} 
                                    draggable={true}
                                    eventHandlers={{
                                       dragend: handleMarkerDragEnd,
                                    }}
                                 >
                                 </Marker>
                              </MapContainer>
                           </div>
                        </div>
                     )}
                  </div>
              )}

              {orderType === 'Tại chỗ' && (
                  <div className="branch-section">
                     <h2 className="checkout-heading">Chọn chi nhánh</h2>
                     <select onChange={handleBranchChange} value={selectedBranchId} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}>
                        <option value="">Chọn chi nhánh mà bạn muốn đến lấy *</option>
                        {branches.map(b => <option key={b.branchid} value={b.branchid}>{b.name} - {b.address}</option>)}
                     </select>
                     {branchError && (
                        <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '8px', marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>{branchError}</p>
                     )}
                  </div>
              )}
              
              <div className="checkout-group" style={{ marginTop: '15px' }}>
                 <label>Ghi chú toàn đơn hàng</label>
                 <textarea placeholder="Ghi chú (Ví dụ: Gọi điện trước khi giao, giao giờ hành chính...)" rows={2} value={orderNote} onChange={e => setOrderNote(e.target.value)}></textarea>
              </div>

              <h2 className="checkout-heading" style={{ marginTop: '20px' }}>Phương thức thanh toán</h2>
              <div className="payment-methods">
                <label className={`payment-option ${formData.paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input type="radio" value="COD" checked={formData.paymentMethod === 'COD'} onChange={() => setFormData({...formData, paymentMethod: 'COD'})} />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className={`payment-option ${formData.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                  <input type="radio" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={() => setFormData({...formData, paymentMethod: 'VNPAY'})} />
                  <span>Ví VNPay / Thẻ ATM Trực tuyến</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="cart-right">
          <div className="voucher-section" style={{ background: '#fcfcfc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #d81b60' }}>
             <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
                <FiTag color="#d81b60"/> Ưu đãi & Khuyến mãi
             </h3>
             {selectedVoucher ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffeef2', padding: '10px', borderRadius: '8px' }}>
                   <div>
                       <strong style={{ color: '#d81b60', display: 'block' }}>{selectedVoucher.code}</strong>
                       <span style={{ fontSize: '13px', color: '#666' }}>{selectedVoucher.title}</span>
                   </div>
                   <button onClick={() => {setSelectedVoucher(null); setDiscountAmount(0);}} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Gỡ</button>
                </div>
             ) : (
                <button onClick={() => setShowVoucherModal(true)} style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #ffccd5', borderRadius: '8px', color: '#d81b60', fontWeight: 'bold', cursor: 'pointer' }}>
                   Chọn mã khuyến mãi
                </button>
             )}
          </div>

          <h3 className="summary-title">Tổng quan đơn hàng</h3>
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="summary-row" style={{ color: '#d81b60', fontWeight: 'bold' }}>
              <span>Voucher giảm giá</span>
              <span>- {formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="summary-row">
            <span style={{ display: 'flex', alignItems: 'center' }}>
               Phí giao hàng
               <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '6px' }} 
                    onMouseEnter={() => setShowTooltip(true)} 
                    onMouseLeave={() => setShowTooltip(false)}>
                  <FiInfo size={15} color="#999" style={{ cursor: 'pointer' }} />
                  {showTooltip && (
                     <div style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '12px', width: '220px', zIndex: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                        <ul style={{ margin: '0 0 10px 0', paddingLeft: '15px' }}>
                           <li>≤ 1 km: 0đ</li>
                           <li>1 km - 3 km: 10k</li>
                           <li>3 km - 6 km: 15k</li>
                           <li>6 km - 10 km: 18k</li>
                           <li>10 km - 15 km: 22k</li>
                        </ul>
                        <strong style={{ display: 'block', borderTop: '1px solid #555', paddingTop: '8px', color: '#fff' }}>
                           Khoảng cách đơn hàng của bạn: {shippingDistance !== null ? `${shippingDistance} km` : '...'}
                        </strong>
                        <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #333' }}></div>
                     </div>
                  )}
               </div>
            </span>
            <span>{isCalculatingShipping ? 'Đang tính...' : formatPrice(shippingFee)}</span>
          </div>
          <div className="summary-row total">
            <span>Tổng cộng</span>
            <span style={{ fontSize: '24px', color: '#d81b60' }}>{formatPrice(finalAmount)}</span>
          </div>

          {shippingError && (
             <div style={{ background: '#fff5f5', border: '1px solid #ffccd5', color: '#d32f2f', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', margin: '15px 0', fontWeight: '500' }}>
                 <p style={{ margin: 0 }}>{shippingError}</p>
             </div>
          )}

          {!isCheckout ? (
            <>
              <button className="checkout-btn" onClick={() => setIsCheckout(true)}>
                Tiến hành thanh toán <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
              </button>
              <button className="continue-shopping-btn" onClick={() => navigate('/san-pham')}>
                Tiếp tục mua sắm
              </button>
            </>
          ) : (
             <button 
               className="checkout-btn bg-confirm" 
               disabled={isSubmitting || !!branchError || !!shippingError || isCalculatingShipping} 
               onClick={handleCheckoutSubmit}
               style={{ background: (isSubmitting || branchError || shippingError || isCalculatingShipping) ? '#ccc' : '#d81b60' }}
             >
               {isSubmitting ? 'Đang đẩy đơn...' : 'Xác nhận đặt hàng'} <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
             </button>
          )}
        </div>
      </div>

      {showVoucherModal && (
        <div className="cart-confirm-overlay" onClick={() => setShowVoucherModal(false)}>
           <div className="cart-confirm-modal" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
              <h3>Kho Voucher Của Bạn</h3>
              {vouchers.length === 0 ? (
                 <p>Bạn không có mã khuyến mãi nào khả dụng.</p>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                    {vouchers.map((v, i) => (
                       <div key={i} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '10px', textAlign: 'left' }}>
                          <h4 style={{ color: '#d81b60', margin: '0 0 5px 0' }}>{v.code} - Giảm {v.discounttype === '%' ? v.discountvalue + '%' : formatPrice(v.discountvalue)}</h4>
                          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px 0' }}>{v.title}</p>
                          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 10px 0' }}>Đơn tối thiểu {formatPrice(v.minordervalue || 0)}</p>
                          <button 
                             onClick={() => applyVoucher(v)}
                             style={{ width: '100%', background: '#d81b60', color: '#fff', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                          >Áp dụng mã</button>
                       </div>
                    ))}
                 </div>
              )}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                 <button onClick={() => setShowVoucherModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Đóng lại</button>
              </div>
           </div>
        </div>
      )}

      {itemToDelete && (
        <div className="cart-confirm-overlay" onClick={() => setItemToDelete(null)}>
          <div className="cart-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa món <strong>"{itemToDelete.name}"</strong> khỏi giỏ hàng không?</p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setItemToDelete(null)}>Hủy</button>
              <button className="btn-confirm" onClick={() => {
                removeFromCart(itemToDelete.id);
                setItemToDelete(null);
              }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
