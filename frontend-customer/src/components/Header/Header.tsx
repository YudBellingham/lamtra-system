import "./Header.css";
import logo from "../../assets/lamtra-logo.png";
import { NavLink, Link } from "react-router-dom";
import { FiMenu, FiUser } from "react-icons/fi";
import { useState } from "react";

function Header() {
  const [open, setOpen] = useState(false);

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
            <div className="header-user-icon">
              <FiUser />
            </div>
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
