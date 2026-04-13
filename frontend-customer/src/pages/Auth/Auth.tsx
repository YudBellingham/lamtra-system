import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { FiChevronLeft } from 'react-icons/fi';
import axios from 'axios';
import './styles/Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');

  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const isRecoveryHash = window.location.hash.includes('type=recovery');
    if (isRecoveryHash) {
      setIsRecovery(true);
    }

    const syncUserAndRedirect = async () => {
      if (window.location.hash.includes('type=recovery')) return;
      if (sessionStorage.getItem('isRegistering') === 'true') return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: existing, error: fetchError } = await supabase
            .from('customers')
            .select('customerid')
            .eq('authid', session.user.id)
            .maybeSingle();

          if (!fetchError && !existing) {
            const { data: newCust, error: oError } = await supabase.from('customers').insert({
              authid: session.user.id,
              fullname: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Thành viên',
              email: session.user.email,
              phone: null,
              birthday: null,
              totalpoints: 0,
              membership: 'Bạc'
            }).select().single();

            if (!oError && newCust) {
              const { data: welcomeVouchers } = await supabase.from('vouchers').select('*').eq('iswelcome', true);
              if (welcomeVouchers && welcomeVouchers.length > 0) {
                const insertVouchers = welcomeVouchers.map(v => ({
                  customerid: newCust.customerid,
                  voucherid: v.voucherid,
                  status: 'Chưa dùng',
                  reason: 'Quà tặng thành viên mới (OAuth)',
                  receiveddate: new Date().toISOString()
                }));
                await supabase.from('customervouchers').insert(insertVouchers);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
        navigate('/');
      }
    };

    if (!isRecoveryHash) {
      syncUserAndRedirect();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || window.location.hash.includes('type=recovery')) {
        setIsRecovery(true);
      } else if (event === 'SIGNED_IN') {
        if (!window.location.hash.includes('type=recovery')) {
          syncUserAndRedirect();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(?!(gmai|yaho|hotmai)\.com$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) {
      setErrorMsg('Email không hợp lệ. Vui lòng kiểm tra định dạng và chính tả (vd: @gmail.com).');
      setLoading(false);
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg('Số điện thoại không hợp lệ (phải có đủ 10 chữ số và bắt đầu bằng số 0).');
      setLoading(false);
      return;
    }

    // Gọi API Backend để kiểm tra trùng lặp chi tiết
    try {
      const checkRes = await axios.post('${import.meta.env.VITE_API_URL}/api/auth/check-existence', {
        email: regEmail,
        phone: phone
      });

      const { emailExists, phoneExists } = checkRes.data;

      if (emailExists && phoneExists) {
        setErrorMsg('Email và Số điện thoại đã tồn tại trong hệ thống.');
        setLoading(false); return;
      } else if (emailExists) {
        setErrorMsg('Email đã tồn tại trong hệ thống.');
        setLoading(false); return;
      } else if (phoneExists) {
        setErrorMsg('Số điện thoại đã tồn tại trong hệ thống.');
        setLoading(false); return;
      }
    } catch (err) {
      console.error("Lỗi check existence:", err);
    }

    if (!birthday) {
      setErrorMsg('Vui lòng chọn ngày sinh.');
      setLoading(false); return;
    }

    sessionStorage.setItem('isRegistering', 'true');
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          fullname,
          phone,
        }
      }
    });

    if (error) {
      sessionStorage.removeItem('isRegistering');
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: insertedCustomer, error: dbError } = await supabase.from('customers').insert({
        authid: data.user.id,
        fullname,
        phone,
        email: regEmail,
        birthday: birthday || null,
        totalpoints: 0,
        membership: 'Bạc'
      }).select().single();

      if (!dbError && insertedCustomer) {
        const { data: welcomeVouchers } = await supabase.from('vouchers').select('*').eq('iswelcome', true);
        if (welcomeVouchers && welcomeVouchers.length > 0) {
          const insertVouchers = welcomeVouchers.map(v => ({
            customerid: insertedCustomer.customerid,
            voucherid: v.voucherid,
            status: 'Chưa dùng',
            reason: 'Quà tặng đăng ký mới',
            receiveddate: new Date().toISOString()
          }));
          await supabase.from('customervouchers').insert(insertVouchers);
        }
      }

      await supabase.auth.signOut();
      sessionStorage.removeItem('isRegistering');

      if (dbError) {
        setErrorMsg('Lỗi khi tạo hồ sơ: ' + dbError.message);
      } else {
        setSuccessMsg('Đăng ký thành công! Hãy đăng nhập ngay.');

        setIsLogin(true);
        setLoginEmail('');
        setLoginPassword('');
        setRegEmail('');
        setRegPassword('');
        setFullname('');
        setPhone('');
        setBirthday('');
        setGender('');

        setTimeout(() => setSuccessMsg(''), 1500);
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      setErrorMsg('Vui lòng nhập Email để khôi phục mật khẩu.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo: window.location.origin + '/auth' });
    if (error) {
      setErrorMsg('Lỗi gửi email khôi phục: ' + error.message);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg('Đã gửi email khôi phục mật khẩu.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Cập nhật thành công! Vui lòng đăng nhập lại.');
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        setIsRecovery(false);
        setIsLogin(true);
        setSuccessMsg('');
        setNewPassword('');
        setLoginPassword('');
      }, 2000);
    }
    setLoading(false);
  };

  if (isRecovery) {
    return (
      <div className="auth-page">
        <div className="auth-blur-overlay"></div>
        <Link to="/" className="back-home-btn">
          <FiChevronLeft /> Quay lại Trang chủ
        </Link>
        <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={handleUpdatePassword} style={{ width: '100%', padding: '0 40px', maxWidth: '450px' }}>
            <h1 className="form-title">Mật Khẩu Mới</h1>
            <p style={{ fontFamily: 'Quicksand', fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '20px' }}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
            <div className="input-wrapper" style={{ margin: '0 auto 15px auto' }}>
              <label>Mật khẩu mới <span className="req">*</span></label>
              <input type="password" placeholder="Mật khẩu (từ 6 ký tự)" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            {errorMsg && <div className="error-text">{errorMsg}</div>}
            {successMsg && <div className="success-text">{successMsg}</div>}
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Đang xử lý...' : 'Cập Nhật'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-blur-overlay"></div>

      <Link to="/" className="back-home-btn">
        <FiChevronLeft /> Quay lại Trang chủ
      </Link>

      <div className={`auth-container ${!isLogin ? 'right-panel-active' : ''}`}>

        {/* Sign Up Container */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegister}>
            <h1 className="form-title">Tạo Tài Khoản</h1>

            <div className="form-fields-scroll">
              <div className="input-wrapper">
                <label>Họ và tên <span className="req">*</span></label>
                <input type="text" placeholder="Họ và tên của bạn" required value={fullname} onChange={e => setFullname(e.target.value)} />
              </div>
              <div className="input-wrapper">
                <label>Email <span className="req">*</span></label>
                <input type="email" placeholder="Email của bạn" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="input-wrapper">
                <label>Số điện thoại <span className="req">*</span></label>
                <input type="tel" placeholder="Số điện thoại" required value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="input-wrapper">
                <label>Mật khẩu <span className="req">*</span></label>
                <input type="password" placeholder="Mật khẩu (từ 6 ký tự)" required value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <label>Ngày sinh <span className="req">*</span></label>
                  <input type="date" required value={birthday} onChange={e => setBirthday(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <label>Giới tính</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">Chọn giới tính</option>
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                    <option value="khac">Khác</option>
                  </select>
                </div>
              </div>
            </div>

            {errorMsg && !isLogin && <div className="error-text" style={{ color: '#d32f2f', fontSize: '13px', marginTop: '10px', background: '#ffebee', padding: '8px', borderRadius: '5px', fontWeight: 600 }}>{errorMsg}</div>}
            {successMsg && !isLogin && <div className="success-text" style={{ color: '#2e7d32', fontSize: '13px', marginTop: '10px', background: '#e8f5e9', padding: '8px', borderRadius: '5px', fontWeight: 600 }}>{successMsg}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !regEmail || !phone || !fullname || regPassword.length < 6 || !birthday}
              style={{ opacity: (loading || !regEmail || !phone || !fullname || regPassword.length < 6 || !birthday) ? 0.6 : 1 }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>
        </div>

        {/* Sign In Container */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1 className="form-title">Đăng Nhập</h1>
            <div className="social-container">
              <button type="button" className="social-btn" onClick={() => handleOAuth('facebook')}><FaFacebook /></button>
              <button type="button" className="social-btn" onClick={() => handleOAuth('google')}><FaGoogle /></button>
            </div>
            <span className="divider">hoặc sử dụng tài khoản của bạn</span>

            <div className="input-wrapper">
              <label>Tài khoản <span className="req">*</span></label>
              <input type="text" placeholder="Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="input-wrapper">
              <label>Mật khẩu <span className="req">*</span></label>
              <input type="password" placeholder="Mật khẩu của bạn" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>

            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); handleResetPassword(); }}>Quên mật khẩu?</a>

            {errorMsg && isLogin && <div className="error-text">{errorMsg}</div>}
            {successMsg && isLogin && <div className="success-text">{successMsg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng Nhập'}</button>
          </form>
        </div>

        {/* Overlay Container (Sliding door) */}
        <div className="overlay-container">
          <button
            className={`overlay-trigger ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
            type="button"
          >
            ĐĂNG KÝ
          </button>
          <button
            className={`overlay-trigger ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
            type="button"
          >
            ĐĂNG NHẬP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
