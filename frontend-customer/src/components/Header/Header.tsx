import "./Header.css";
import logo from "../../assets/lamtra-logo.png";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FiMenu, FiUser, FiLogOut, FiShoppingCart } from "react-icons/fi";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";

function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { totalItems } = useCart();

  useEffect(() => {
    const fetchUser = async (sessionUser: any) => {
       if (!sessionUser) {
         setUser(null);
         return;
       }
       const { data } = await supabase.from('customers').select('fullname').eq('authid', sessionUser.id).maybeSingle();
       setUser({
         ...sessionUser,
         fullname: data?.fullname || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email || 'Thành viên'
       });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUser(session?.user);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser(session?.user);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="lamtra-header">
      <div className="header-container">
        <div className="header-left">
          <div className="hamburger" onClick={() => setOpen(!open)}>
            <FiMenu />
          </div>

          <nav className="nav-left desktop">
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/tuyen-dung"
            >
              TUYỂN DỤNG
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/tin-tuc"
            >
              TIN TỨC
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/ve-lamtra"
            >
              VỀ LAMTRA
            </NavLink>
          </nav>
        </div>

        <div className="header-center">
          <Link to="/">
            <img src={logo} alt="Lam Trà" />
          </Link>
        </div>

        <div className="header-right">
          <nav className="nav-right desktop">
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/cua-hang"
            >
              CỬA HÀNG
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/san-pham"
            >
              SẢN PHẨM
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/feedbacks"
            >
              FEEDBACKS
            </NavLink>
          </nav>

          <div className="header-icons">
            <div className="header-cart-wrapper tooltip-container">
              <Link to="/cart" className="header-cart-icon">
                <FiShoppingCart />
                <span className="cart-badge">{totalItems}</span>
              </Link>
              <span className="tooltip-text">Giỏ hàng</span>
            </div>

            {user ? (
              <div className="header-user-wrapper">
                <div className="header-user-icon active" style={{ overflow: 'hidden', fontWeight: 'bold' }}>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.fullname ? user.fullname.charAt(0).toUpperCase() : <FiUser />
                  )}
                </div>
                <div className="user-dropdown">
                  <div className="user-dropdown-info">
                    <span className="user-email">{user.fullname}</span>
                  </div>
                  <Link to="/profile?tab=1" className="user-dropdown-item">Thông tin chung</Link>
                  <Link to="/profile?tab=2" className="user-dropdown-item">Điểm & Quà tặng</Link>
                  <Link to="/profile?tab=3" className="user-dropdown-item">Lịch sử đơn hàng</Link>
                  <Link to="/profile?tab=4" className="user-dropdown-item">Đổi mật khẩu</Link>
                  <Link to="/profile?tab=5" className="user-dropdown-item">Mục yêu thích</Link>
                  <button onClick={handleLogout} className="logout-btn" style={{ marginTop: '4px' }}>
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="header-user-wrapper tooltip-container">
                <Link to="/auth" className="header-user-icon">
                  <FiUser />
                </Link>
                <span className="tooltip-text">Đăng nhập / Đăng ký</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="mobile-logo">
            <img src={logo} alt="Lam Trà" />
          </Link>
          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="mobile-nav">
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/ve-lamtra"
            onClick={() => setOpen(false)}
          >
            VỀ LAMTRA
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/tin-tuc"
            onClick={() => setOpen(false)}
          >
            TIN TỨC
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/tuyen-dung"
            onClick={() => setOpen(false)}
          >
            TUYỂN DỤNG
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/cua-hang"
            onClick={() => setOpen(false)}
          >
            CỬA HÀNG
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/san-pham"
            onClick={() => setOpen(false)}
          >
            SẢN PHẨM
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/feedbacks"
            onClick={() => setOpen(false)}
          >
            FEEDBACKS
          </NavLink>
        </nav>
      </div>

      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}
    </header>
  );
}

export default Header;
