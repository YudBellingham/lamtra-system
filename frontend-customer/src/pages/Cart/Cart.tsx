import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiArrowLeft, FiTag, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import './styles/Cart.css';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderType, setOrderType] = useState('Giao hàng');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address_detail: '', // Đây là địa chỉ định vị (Goong)
    manual_address: '', // Đây là địa chỉ nhập tay (Số nhà, tầng...)
    paymentMethod: 'COD'
  });
  const [orderNote, setOrderNote] = useState('');

  // Shipping dynamic states
  const [shippingDistance, setShippingDistance] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Goong Map Autocomplete State
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Phone warning
  const [customerPhone, setCustomerPhone] = useState<string | null>('loading');

  // Location state (Hidden, for logic only)
  const [exactCoords, setExactCoords] = useState<[number, number] | null>(null);

  // Fallback UI State
  const [fallbackLevelWarning, setFallbackLevelWarning] = useState<string>('');

  // Pickup Branch State
  const [pickupCapability, setPickupCapability] = useState<any>(null);
  const [isPickupOverloaded, setIsPickupOverloaded] = useState(false);
  const [pickupOverloadConfirmed, setPickupOverloadConfirmed] = useState(false);

  // Delivery Branches State
  const [deliveryBranchesInfo, setDeliveryBranchesInfo] = useState<any[]>([]);
  const [selectedDeliveryBranchId, setSelectedDeliveryBranchId] = useState<number | string>('');

  // Branches
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | string>('');
  const [branchError, setBranchError] = useState('');

  // Vouchers
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [orderTemplates, setOrderTemplates] = useState<any[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    // load branches
    supabase.from('branches').select('*').eq('isactive', true).then(res => setBranches(res.data || []));

    // fetch vouchers
    const fetchVouchers = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) return;
      try {
        const { data: customer } = await supabase.from('customers').select('customerid').eq('authid', session.user.id).single();
        if (customer) {
          const { data: cv } = await supabase.from('customervouchers').select('*, vouchers(*)').eq('customerid', customer.customerid).or('status.eq.Chưa dùng,status.is.null');
          if (cv) {
            const rawVouchers = cv.map(item => item.vouchers).filter(v => v);
            const grouped: any = {};
            rawVouchers.forEach(v => {
              if (!grouped[v.voucherid]) {
                grouped[v.voucherid] = { ...v, count: 1 };
              } else {
                grouped[v.voucherid].count += 1;
              }
            });
            setVouchers(Object.values(grouped));
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy voucher:", err);
      }
    };
    fetchVouchers();

    // fetch favorite templates
    const fetchTemplates = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      try {
        const res = await axios.get('${import.meta.env.VITE_API_URL}/api/customers/favorites', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        setOrderTemplates(res.data.templates || []);
      } catch (err) {
        console.error("Lỗi fetch templates:", err);
      }
    };
    fetchTemplates();

    const checkPhone = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.user) {
        const { data } = await supabase.from('customers').select('phone, fullname').eq('authid', session.user.id).maybeSingle();
        if (data) {
          setCustomerPhone(data.phone || '');
          if (!formData.fullName && data.fullname) setFormData(prev => ({ ...prev, fullName: data.fullname }));
          if (!formData.phone && data.phone) setFormData(prev => ({ ...prev, phone: data.phone }));
        }
      } else {
        setCustomerPhone(null);
      }
    };
    checkPhone();

    const handleFocus = () => checkPhone();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleReorderTemplate = async (orderId: string) => {
    setIsReordering(true);
    const toastId = toast.loading('Đang xử lý đơn mẫu...');
    try {
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/orders/reorder', { orderid: orderId });
      if (res.data.success) {
        const { reorderCart, hasMissingItems } = res.data;
        let addedCount = 0;
        reorderCart.forEach((item: any) => {
          const effectiveBasePrice = item.saleprice || item.baseprice;
          const toppingsTotal = item.toppings.reduce((sum: number, t: any) => sum + t.price, 0);
          const sizeUpcharge = (item.size === 'L') ? 10000 : 0;
          const itemTotal = effectiveBasePrice + sizeUpcharge + toppingsTotal;

          addToCart({
            id: `${item.productid}-${item.size}-${item.ice}-${item.sugar}-${item.toppings.map((t: any) => t.name).join('-')}-${Date.now()}-${Math.random()}`,
            productid: item.productid,
            name: item.product_name,
            imageurl: item.imageurl,
            baseprice: effectiveBasePrice,
            quantity: item.quantity,
            size: item.size,
            ice: item.ice,
            sugar: item.sugar,
            toppings: item.toppings,
            itemTotal: itemTotal
          });
          addedCount++;
        });

        if (addedCount === 0) {
          toast.error('Các món trong đơn hàng này đã ngừng bán.', { id: toastId });
        } else {
          if (hasMissingItems) {
            toast.success(`Đã thêm ${addedCount} món vào giỏ. Một số món đã ngừng phục vụ.`, { id: toastId });
          } else {
            toast.success('Đã nạp combo yêu thích vào giỏ hàng!', { id: toastId });
          }
        }
      }
    } catch (err: any) {
      toast.error('Lỗi khi nạp đơn mẫu: ' + (err.response?.data?.error || err.message), { id: toastId });
    } finally {
      setIsReordering(false);
    }
  };

  const handleAddressInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    setFormData({ ...formData, address_detail: val });

    if (!val.trim()) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const apiKey = import.meta.env.VITE_GOONG_API_KEY;
      const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=${encodeURIComponent(val)}`);
      if (res.data && res.data.predictions) {
        setAddressSuggestions(res.data.predictions);
        setShowAddressDropdown(true);
      }
    } catch (e) {
      console.error("Goong Autocomplete Error", e);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = async (place_id: string, description: string) => {
    setAddressInput(description);
    setFormData({ ...formData, address_detail: description });
    setShowAddressDropdown(false);

    try {
      const apiKey = import.meta.env.VITE_GOONG_API_KEY;
      const res = await axios.get(`https://rsapi.goong.io/Place/Detail?place_id=${place_id}&api_key=${apiKey}`);
      if (res.data && res.data.result && res.data.result.geometry) {
        const location = res.data.result.geometry.location;
        const newLat = location.lat;
        const newLng = location.lng;
        setExactCoords([newLat, newLng]);
        estimateShipping(newLat, newLng);
      }
    } catch (e) {
      console.error("Goong Place Detail", e);
    }
  };

  const estimateShipping = async (lat?: number, lng?: number) => {
    const targetLat = lat || (exactCoords ? exactCoords[0] : null);
    const targetLng = lng || (exactCoords ? exactCoords[1] : null);

    if (orderType === 'Giao hàng' && targetLat && targetLng) {
      setIsCalculatingShipping(true);
      setShippingError('');
      setFallbackLevelWarning('');

      if (!lat) {
        setShippingDistance(null);
        setShippingFee(0);
        setDeliveryBranchesInfo([]);
        setSelectedDeliveryBranchId('');
      }

      try {
        const payload = {
          cart,
          customerInfo: {
            address_detail: formData.address_detail,
            exactLat: targetLat,
            exactLng: targetLng
          }
        };
        const res = await axios.post('${import.meta.env.VITE_API_URL}/api/estimate-shipping', payload);
        if (res.data.success) {
          const { branchesInfo, fallbackLevel, lat: resLat, lng: resLng } = res.data;
          setDeliveryBranchesInfo(branchesInfo);

          if (fallbackLevel > 1) {
            setFallbackLevelWarning('Đang ước tính khoảng cách dựa trên Phường/Xã do thiếu số nhà.');
          }

          if (!branchesInfo || branchesInfo.length === 0) {
            setShippingError(`Rất tiếc, không có chi nhánh nào khả dụng trong 15km.`);
          } else {
            setSelectedDeliveryBranchId(branchesInfo[0].branch.branchid);
            setShippingDistance(branchesInfo[0].distance);
            setShippingFee(branchesInfo[0].shippingFee);
          }

          if (resLat && resLng && !lat) {
            setExactCoords([parseFloat(resLat), parseFloat(resLng)]);
          }
        }
      } catch (err: any) {
        setShippingError(err.response?.data?.error || 'Lỗi máy chủ khi tính khoảng cách giao hàng');
      } finally {
        setIsCalculatingShipping(false);
      }
    }
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
    setPickupCapability(null);
    setIsPickupOverloaded(false);
    setPickupOverloadConfirmed(false);
    if (!bid) return;

    try {
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/checkout/capability', { branchId: bid, cart });
      if (res.data.success) {
        const cap = res.data.capability;
        setPickupCapability(cap);
        if (!cap.available) {
          setBranchError(`Chi nhánh này hiện đang tạm hết nguyên liệu (${cap.outOfStockItems.join(', ')}). Vui lòng điều chỉnh giỏ hàng hoặc đổi chi nhánh.`);
        } else if (cap.isOverloaded) {
          setIsPickupOverloaded(true);
        }
      }
    } catch (err: any) {
      setBranchError('Lỗi kiểm tra chi nhánh: ' + err.message);
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
      if (!formData.fullName || !formData.phone || !formData.address_detail || !exactCoords) {
        toast.error('Vui lòng chọn địa chỉ giao hàng hợp lệ từ gợi ý của hệ thống!'); return;
      }
      if (shippingError) {
        toast.error('Vui lòng kiểm tra lại địa chỉ giao nhận.'); return;
      }
      if (!selectedDeliveryBranchId) {
        toast.error('Vui lòng chờ tính phí hoặc chọn chi nhánh giao hàng khả dụng.'); return;
      }
    } else {
      if (!formData.fullName || !formData.phone || !selectedBranchId) {
        toast.error('Vui lòng điền thông tin và chọn chi nhánh!'); return;
      }
      if (branchError) {
        toast.error('Không thể đặt vì chi nhánh đang hết nguyên liệu.'); return;
      }
      if (pickupCapability && pickupCapability.available && pickupCapability.isOverloaded && !pickupOverloadConfirmed) {
        toast.error('Vui lòng xác nhận đồng ý đợi lâu.'); return;
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
          address_detail: formData.manual_address ? `${formData.manual_address} - ${formData.address_detail}` : formData.address_detail,
          exactLat: exactCoords ? exactCoords[0] : null,
          exactLng: exactCoords ? exactCoords[1] : null,
          deliveryBranchId: selectedDeliveryBranchId
        }
      };

      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/checkout', payload);
      if (res.data.success) {
        if (formData.paymentMethod === 'COD') {
          toast.success('Đặt hàng thành công!');
          clearCart();
          navigate(`/order/${orderId}`);
        } else {
          const vnpRes = await axios.post('${import.meta.env.VITE_API_URL}/api/create_payment_url', { orderId, amount: finalAmount, orderInfo: `Thanh toan don hang ${orderId}` });
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
      {customerPhone === '' && (
        <div style={{ background: '#fff9e6', color: '#d88b00', padding: '12px 20px', textAlign: 'center', fontWeight: '500', fontSize: '14px', borderBottom: '1px solid #ffe9a6' }}>
          🎁 Lam Trà đang có chương trình tích điểm đổi quà hấp dẫn. Quý khách hãy <Link to="/profile?tab=1" style={{ color: '#d81b60', fontWeight: 'bold', textDecoration: 'underline' }}>cập nhật số điện thoại tại đây</Link> để không bỏ lỡ quyền lợi!
        </div>
      )}
      <div className="cart-container">
        <div className="cart-left">
          {orderTemplates.length > 0 && (
            <div className="quick-order-bar" style={{ marginBottom: '20px', background: '#fff', padding: '12px 15px', borderRadius: '12px', border: '1px solid #ffeff3', boxShadow: '0 4px 12px rgba(216, 27, 96, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#d81b60', fontWeight: 'bold', fontSize: '13px' }}>
                <FiTag /> ĐẶT NHANH COMBO YÊU THÍCH
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '3px' }}>
                {orderTemplates.map(tmp => (
                  <button
                    key={tmp.templateid}
                    onClick={() => handleReorderTemplate(tmp.orderid)}
                    disabled={isReordering}
                    style={{
                      flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
                      border: '1px solid #ffccd5', background: '#fff9fa',
                      color: '#d81b60', fontSize: '12px', cursor: 'pointer',
                      fontWeight: 'bold', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {tmp.templatename} <FiArrowRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}
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
                <input type="text" placeholder="VD: Nguyễn Văn A" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>

              <div className="checkout-group">
                <label>Số điện thoại *</label>
                <input type="tel" placeholder="VD: 0912345678" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              {orderType === 'Giao hàng' && (
                <div className="address-section">
                  <h2 className="checkout-heading">Địa chỉ giao hàng</h2>
                  <div className="checkout-group" style={{ position: 'relative' }}>
                    <label>Nhập địa chỉ nhận hàng *</label>
                    <input
                      type="text"
                      placeholder="VD: Tòa nhà CMC, Số 11 Duy Tân, Cầu Giấy..."
                      value={addressInput}
                      onChange={handleAddressInput}
                      style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}
                    />
                    {isSearchingAddress && <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Đang tìm kiếm...</p>}

                    {showAddressDropdown && addressSuggestions.length > 0 && (
                      <ul style={{ position: 'absolute', top: '75px', left: 0, right: 0, background: '#fff', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, margin: '5px 0 0 0', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                        {addressSuggestions.map(s => (
                          <li
                            key={s.place_id}
                            onClick={() => handleSelectAddress(s.place_id, s.description)}
                            style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: '14px' }}
                          >
                            {s.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {fallbackLevelWarning && (
                    <p style={{ color: '#d88b00', background: '#fff9e6', padding: '10px', borderRadius: '8px', fontSize: '13px', fontStyle: 'italic', marginTop: '5px' }}>{fallbackLevelWarning}</p>
                  )}

                  <div className="checkout-group" style={{ marginTop: '15px' }}>
                    <label>Địa chỉ cụ thể (Số nhà, tầng, ngõ ngách...) *</label>
                    <textarea
                      placeholder="VD: Phòng 402, Nhà A1, Ngõ 123..."
                      rows={2}
                      value={formData.manual_address}
                      onChange={e => setFormData({ ...formData, manual_address: e.target.value })}
                      style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%' }}
                    ></textarea>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      <FiInfo size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Địa chỉ này sẽ giúp Shipper tìm thấy bạn nhanh hơn.
                    </p>
                  </div>
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
                  {pickupCapability && pickupCapability.available && isPickupOverloaded && !pickupOverloadConfirmed && (
                    <div style={{ background: '#fff0f4', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #ffccd5' }}>
                      <p style={{ color: '#d81b60', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ Chi nhánh này đang rất đông đơn, thời gian chuẩn bị dự kiến {pickupCapability.estimatedTime}. Bạn có chấp nhận đợi không?</p>
                      <button onClick={() => setPickupOverloadConfirmed(true)} style={{ padding: '8px 15px', background: '#d81b60', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                        Tôi xác nhận đợi
                      </button>
                    </div>
                  )}
                  {pickupOverloadConfirmed && (
                    <p style={{ color: '#388e3c', marginTop: '10px', fontWeight: 'bold' }}>✅ Bạn đã xác nhận đợi món.</p>
                  )}
                </div>
              )}

              {orderType === 'Giao hàng' && deliveryBranchesInfo.length > 0 && (
                <div className="delivery-branch-options" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', color: '#333' }}>Tùy chọn chi nhánh phục vụ</h3>
                  {deliveryBranchesInfo.map((opt, index) => {
                    const cap = opt.capability;
                    const isSelected = selectedDeliveryBranchId === opt.branch.branchid;

                    let tag = '';
                    let tagColor = '';
                    if (!cap.available) { tag = `Hết hàng (${cap.outOfStockItems.join(', ')})`; tagColor = '#f44336'; }
                    else if (cap.isOverloaded) { tag = `Quá tải (Đợi ${cap.estimatedTime})`; tagColor = '#ff9800'; }
                    else if (index === 0) { tag = 'Gần nhất'; tagColor = '#4caf50'; }

                    return (
                      <div
                        key={opt.branch.branchid}
                        onClick={() => {
                          if (cap.available) {
                            setSelectedDeliveryBranchId(opt.branch.branchid);
                            setShippingDistance(opt.distance);
                            setShippingFee(opt.shippingFee);
                          }
                        }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px', marginBottom: '10px', borderRadius: '8px',
                          border: isSelected ? '2px solid #d81b60' : '1px solid #ddd',
                          background: !cap.available ? '#f5f5f5' : isSelected ? '#fff0f4' : '#fff',
                          cursor: cap.available ? 'pointer' : 'not-allowed',
                          opacity: cap.available ? 1 : 0.6
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>{opt.branch.name} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>({opt.distance.toFixed(1)}km)</span></div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '13px', background: tagColor, color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{tag || 'Còn hàng'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: cap.available ? '#d81b60' : '#999' }}>
                          {formatPrice(opt.shippingFee)} Ship
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="checkout-group" style={{ marginTop: '15px' }}>
                <label>Ghi chú toàn đơn hàng</label>
                <textarea placeholder="Ghi chú (Ví dụ: Gọi điện trước khi giao, giao giờ hành chính...)" rows={2} value={orderNote} onChange={e => setOrderNote(e.target.value)}></textarea>
              </div>

              <h2 className="checkout-heading" style={{ marginTop: '20px' }}>Phương thức thanh toán</h2>
              <div className="payment-methods">
                <label className={`payment-option ${formData.paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input type="radio" value="COD" checked={formData.paymentMethod === 'COD'} onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })} />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className={`payment-option ${formData.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                  <input type="radio" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={() => setFormData({ ...formData, paymentMethod: 'VNPAY' })} />
                  <span>Ví VNPay / Thẻ ATM Trực tuyến</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="cart-right">
          <div className="voucher-section" style={{ background: '#fcfcfc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #d81b60' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
              <FiTag color="#d81b60" /> Ưu đãi & Khuyến mãi
            </h3>
            {selectedVoucher ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffeef2', padding: '10px', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#d81b60', display: 'block' }}>{selectedVoucher.code}</strong>
                  <span style={{ fontSize: '13px', color: '#666' }}>{selectedVoucher.title}</span>
                </div>
                <button onClick={() => { setSelectedVoucher(null); setDiscountAmount(0); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Gỡ</button>
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
              disabled={isSubmitting || !!branchError || !!shippingError || isCalculatingShipping || (orderType === 'Tại chỗ' && pickupCapability && pickupCapability.available && pickupCapability.isOverloaded && !pickupOverloadConfirmed) || (orderType === 'Giao hàng' && !selectedDeliveryBranchId)}
              onClick={handleCheckoutSubmit}
              style={{ background: (isSubmitting || branchError || shippingError || isCalculatingShipping || (orderType === 'Tại chỗ' && pickupCapability && pickupCapability.available && pickupCapability.isOverloaded && !pickupOverloadConfirmed) || (orderType === 'Giao hàng' && !selectedDeliveryBranchId)) ? '#ccc' : '#d81b60' }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {vouchers.sort((a, b) => {
                  const aEligible = cartTotal >= (a.minordervalue || 0);
                  const bEligible = cartTotal >= (b.minordervalue || 0);
                  if (aEligible && !bEligible) return -1;
                  if (!aEligible && bEligible) return 1;
                  return 0;
                }).map((v, i) => {
                  const isEligible = cartTotal >= (v.minordervalue || 0);
                  return (
                    <div key={i} style={{
                      border: isEligible ? '1px solid #ffccd5' : '1px solid #eee',
                      padding: '15px',
                      borderRadius: '10px',
                      textAlign: 'left',
                      position: 'relative',
                      background: isEligible ? '#fffafb' : '#f9f9f9',
                      opacity: isEligible ? 1 : 0.6
                    }}>
                      {v.count > 1 && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: '#ff3d00', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderBottomLeftRadius: '10px', borderTopRightRadius: '10px' }}>
                          x{v.count}
                        </div>
                      )}
                      <h4 style={{ color: '#d81b60', margin: '0 0 5px 0', paddingRight: v.count > 1 ? '30px' : '0', fontSize: '15px' }}>
                        {v.code} - Giảm {v.discounttype === '%' ? v.discountvalue + '%' : formatPrice(v.discountvalue)}
                      </h4>
                      <p style={{ fontSize: '13px', color: '#444', margin: '0 0 8px 0', fontWeight: 500 }}>{v.title}</p>

                      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Đơn tối thiểu:</span>
                          <span style={{ fontWeight: 'bold', color: isEligible ? '#333' : '#d32f2f' }}>{formatPrice(v.minordervalue || 0)}</span>
                        </div>
                        {v.discounttype === '%' && v.maxdiscount && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Giảm tối đa:</span>
                            <span style={{ fontWeight: 'bold' }}>{formatPrice(v.maxdiscount)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Trạng thái:</span>
                          <span style={{ color: '#388e3c', fontWeight: 'bold' }}>Chưa dùng</span>
                        </div>
                      </div>

                      {!isEligible && (
                        <p style={{ color: '#d32f2f', fontSize: '11px', fontWeight: 'bold', marginTop: '10px', background: '#ffebee', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
                          ⚠️ Chưa đủ giá trị đơn hàng tối thiểu
                        </p>
                      )}

                      <button
                        onClick={() => applyVoucher(v)}
                        disabled={!isEligible}
                        style={{
                          width: '100%',
                          background: isEligible ? '#d81b60' : '#ccc',
                          color: '#fff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          cursor: isEligible ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold',
                          marginTop: '12px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isEligible ? 'Áp dụng mã' : 'Không đủ điều kiện'}
                      </button>
                    </div>
                  )
                })}
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
