import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiUser, FiGift, FiShoppingBag, FiLock, FiLogOut, FiClock } from 'react-icons/fi';
import './styles/Profile.css';

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || '1';
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Tab 1 Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ fullname: '', email: '', phone: '' });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Tab 2 State
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Tab 3 State
  const [orders, setOrders] = useState<any[]>([]);

  // Tab 4 State
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session: currSession } } = await supabase.auth.getSession();
      if (!currSession) {
        navigate('/auth');
        return;
      }
      setSession(currSession);
      fetchCustomer(currSession.user.id);
    };
    fetchSession();
  }, [navigate]);

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (customer) {
      if (activeTab === '2') fetchLoyaltyData(customer.customerid);
      if (activeTab === '3') fetchOrders(customer.customerid);
    }
  }, [activeTab, customer]);

  const fetchCustomer = async (authId: string) => {
    const { data } = await supabase.from('customers').select('*').eq('authid', authId).maybeSingle();
    setCustomer(data);
    if (data) {
      setEditForm({
        fullname: data.fullname || '',
        email: data.email || '',
        phone: data.phone || ''
      });
    }
    setLoadingData(false);
  };

  const fetchLoyaltyData = async (customerId: number) => {
    setLoadingData(true);
    try {
      const [vouchersRes, historyRes] = await Promise.all([
        supabase.from('vouchers').select('*').gt('pointsrequired', 0).eq('is_active', true).order('pointsrequired', { ascending: true }),
        supabase.from('pointhistory').select('*').eq('customerid', customerId).order('createddate', { ascending: false })
      ]);
      setVouchers(vouchersRes.data || []);
      setPointHistory(historyRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  const fetchOrders = async (customerId: number) => {
    setLoadingData(true);
    const { data } = await supabase.from('orders').select('*').eq('customerid', customerId).order('orderdate', { ascending: false });
    setOrders(data || []);
    setLoadingData(false);
  };

  const handleRedeem = async (voucher: any) => {
    if (customer.totalpoints < voucher.pointsrequired) {
      setErrorMsg('Bạn không đủ điểm để đổi phần quà này.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setRedeemLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newPoints = customer.totalpoints - voucher.pointsrequired;
      
      const { error: updateErr } = await supabase.from('customers')
        .update({ totalpoints: newPoints })
        .eq('customerid', customer.customerid);

      if (updateErr) throw updateErr;

      const historyInsert = supabase.from('pointhistory').insert({
        customerid: customer.customerid,
        pointchange: -voucher.pointsrequired,
        type: 'Đổi quà',
        description: `Đổi voucher: ${voucher.title}`
      });

      const voucherInsert = supabase.from('customervouchers').insert({
        customerid: customer.customerid,
        voucherid: voucher.voucherid,
        status: 'Chưa sử dụng',
        reason: 'Đổi điểm',
        receiveddate: new Date().toISOString()
      });

      await Promise.all([historyInsert, voucherInsert]);

      setSuccessMsg(`Đổi thành công: ${voucher.title}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      
      // Refresh user points and history
      await fetchCustomer(session.user.id);
      await fetchLoyaltyData(customer.customerid);

    } catch (e: any) {
      setErrorMsg('Đã có lỗi xảy ra: ' + e.message);
      setTimeout(() => setErrorMsg(''), 3000);
    }
    setRedeemLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu phải từ 6 ký tự.');
      return;
    }
    setIsUpdatingPass(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Đổi mật khẩu thành công!');
      setNewPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setIsUpdatingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullname.trim() || !editForm.phone.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ hoặc Họ tên và Số điện thoại hợp lệ.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setIsSavingInfo(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          fullname: editForm.fullname,
          phone: editForm.phone,
          email: editForm.email
        })
        .eq('customerid', customer.customerid);

      if (error) throw error;
      setCustomer({ ...customer, fullname: editForm.fullname, phone: editForm.phone, email: editForm.email });
      setSuccessMsg('Cập nhật thông tin thành công!');
      setIsEditingInfo(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg('Cập nhật thất bại: ' + e.message);
      setTimeout(() => setErrorMsg(''), 3000);
    }
    setIsSavingInfo(false);
  };

  if (loadingData && !customer) {
    return (
      <div className="profile-page loading-state">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const renderTab1 = () => (
    <div className="tab-pane fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #ffeff3', paddingBottom: '15px' }}>
        <h2 className="tab-head" style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>Thông tin tài khoản</h2>
        {!isEditingInfo ? (
          <button 
            className="btn-edit-profile" 
            onClick={() => setIsEditingInfo(true)}
          >
            Chỉnh sửa thông tin
          </button>
        ) : (
          <div>
            <button 
              className="btn-cancel-edit" 
              onClick={() => {
                setIsEditingInfo(false);
                setEditForm({ fullname: customer?.fullname, email: customer?.email, phone: customer?.phone });
              }}
              disabled={isSavingInfo}
            >
              Hủy
            </button>
            <button 
              className="btn-save-profile" 
              onClick={handleSaveProfile}
              disabled={isSavingInfo}
            >
              {isSavingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>

      <div className="info-cards">
        <div className="info-card">
          <label>Họ và tên</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.fullname || 'Chưa cập nhật'}</div>
          ) : (
            <input type="text" className="profile-edit-input" value={editForm.fullname} onChange={e => setEditForm({...editForm, fullname: e.target.value})} />
          )}
        </div>
        <div className="info-card">
          <label>Email</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.email || 'Chưa cập nhật'}</div>
          ) : (
            <input type="email" className="profile-edit-input" disabled value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} title="Không thể đổi email lấy khóa đăng nhập" />
          )}
        </div>
        <div className="info-card">
          <label>Số điện thoại</label>
          {!isEditingInfo ? (
            <div className="value">{customer?.phone || 'Chưa cập nhật'}</div>
          ) : (
            <input type="tel" className="profile-edit-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
          )}
        </div>
      </div>

      <h2 className="tab-head mt-4">Hạng & Tích điểm</h2>
      <div className="rank-cards-wrapper">
        <div className="rank-card points-card">
          <div className="rank-icon">⭐</div>
          <div className="rank-details">
            <label>Điểm tích luỹ</label>
            <div className="rank-val">{customer?.totalpoints || 0} điểm</div>
          </div>
        </div>
        <div className={`rank-card tier-card tier-${(customer?.membership || 'Bạc').toLowerCase()}`}>
          <div className="rank-icon">💎</div>
          <div className="rank-details">
            <label>Hạng thành viên</label>
            <div className="rank-val">{customer?.membership || 'Bạc'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab2 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Kho quà tặng (Đổi điểm)</h2>
      <p className="tab-desc">Sử dụng điểm tích luỹ <b>{customer?.totalpoints}</b> của bạn để đổi các Voucher giá trị.</p>
      
      <div className="voucher-grid">
        {vouchers.map(v => (
          <div className={`voucher-item ${customer?.totalpoints < v.pointsrequired ? 'disabled' : ''}`} key={v.voucherid}>
            <div className="v-value">Mã: {v.code}</div>
            <div className="v-title">{v.title}</div>
            <div className="v-points">Trị giá: -{v.pointsrequired} điểm</div>
            <button 
              className="btn-redeem"
              onClick={() => handleRedeem(v)}
              disabled={redeemLoading || customer?.totalpoints < v.pointsrequired}
            >
              {customer?.totalpoints < v.pointsrequired ? 'Không đủ điểm' : (redeemLoading ? 'Đang đổi...' : 'Đổi ngay')}
            </button>
          </div>
        ))}
        {vouchers.length === 0 && <p className="empty-text">Hiện chưa có phần quà nào để đổi.</p>}
      </div>

      <h2 className="tab-head mt-4">Lịch sử điểm</h2>
      <div className="history-list">
        {pointHistory.map(h => (
          <div className="history-item" key={h.pointhistoryid}>
            <div className="h-left">
              <div className="h-type">{h.type}</div>
              <div className="h-date">{new Date(h.createddate).toLocaleDateString('vi-VN')} {new Date(h.createddate).toLocaleTimeString('vi-VN')}</div>
              <div className="h-desc">{h.description}</div>
            </div>
            <div className={`h-right ${h.pointchange > 0 ? 'plus' : 'minus'}`}>
              {h.pointchange > 0 ? '+' : ''}{h.pointchange}
            </div>
          </div>
        ))}
        {pointHistory.length === 0 && <p className="empty-text">Chưa có lịch sử giao dịch điểm.</p>}
      </div>
    </div>
  );

  const renderTab3 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Lịch sử đơn hàng</h2>
      <div className="order-list">
        {orders.map(o => {
          const statusClass = `status-${o.status?.split(' ')[0]?.toLowerCase()}`;
          return (
            <div 
              className="order-item" 
              key={o.orderid} 
              onClick={() => navigate(`/order/${o.orderid}`)} 
              style={{ cursor: 'pointer' }}
            >
              <div className="o-header">
                <span className="o-id">#{o.orderid}</span>
                <span className={`o-status ${statusClass}`}>{o.status}</span>
              </div>
              <div className="o-body">
                <div className="o-row">
                  <span>Ngày đặt:</span>
                  <strong>{new Date(o.orderdate).toLocaleString('vi-VN')}</strong>
                </div>
                <div className="o-row">
                  <span>Phương thức:</span>
                  <strong>{o.paymentmethod || o.ordertype}</strong>
                </div>
                <div className="o-row total">
                  <span>Tổng tiền:</span>
                  <strong>{Number(o.finalamount).toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>
              <div className="o-footer">
                <button 
                  className="btn-view-order" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/order/${o.orderid}`);
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="empty-text">Bạn chưa có đơn hàng nào.</p>}
      </div>
    </div>
  );

  const renderTab4 = () => (
    <div className="tab-pane fade-in">
      <h2 className="tab-head">Đổi mật khẩu</h2>
      <form className="password-form" onSubmit={handleUpdatePassword}>
        <div className="input-grp">
          <label>Mật khẩu mới</label>
          <input 
            type="password" 
            placeholder="Nhập ít nhất 6 ký tự" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-savepass" disabled={isUpdatingPass}>
          {isUpdatingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="profile-page">
      {/* Toast Notification */}
      {errorMsg && <div className="toast-msg toast-err">{errorMsg}</div>}
      {successMsg && <div className="toast-msg toast-succ">{successMsg}</div>}

      <div className="profile-container">
        
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="user-brief">
            <div className="avatar">
              {session?.user?.user_metadata?.avatar_url ? (
                 <img src={session.user.user_metadata.avatar_url} alt="Avatar" />
              ) : (
                 customer?.fullname?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <h3>{customer?.fullname || 'Thành viên'}</h3>
            <span className="tier-badge">{customer?.membership || 'Bạc'}</span>
          </div>

          <div className="sidebar-menu">
            <button className={`sidebar-item ${activeTab === '1' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: '1' })}>
              <FiUser /> Thông tin chung
            </button>
            <button className={`sidebar-item ${activeTab === '2' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: '2' })}>
              <FiGift /> Điểm & Quà tặng
            </button>
            <button className={`sidebar-item ${activeTab === '3' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: '3' })}>
              <FiShoppingBag /> Lịch sử đơn hàng
            </button>
            <button className={`sidebar-item ${activeTab === '4' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: '4' })}>
              <FiLock /> Đổi mật khẩu
            </button>
            <button className="sidebar-item logout" onClick={handleLogout}>
              <FiLogOut /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="profile-content">
          {activeTab === '1' && renderTab1()}
          {activeTab === '2' && renderTab2()}
          {activeTab === '3' && renderTab3()}
          {activeTab === '4' && renderTab4()}
        </main>
      </div>
    </div>
  );
};

export default Profile;
