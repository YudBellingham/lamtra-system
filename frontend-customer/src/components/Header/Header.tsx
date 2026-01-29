import "./Header.css";
import logo from "../../assets/lamtra-logo.png";
import { NavLink, Link } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
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
              to="/ve-lamtra"
            >
              VỀ LAMTRA
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
              to="/tuyen-dung"
            >
              TUYỂN DỤNG
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              to="/cua-hang"
            >
              CỬA HÀNG
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
            <span className="nav-item">GIAO HÀNG</span>
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

          <div className="header-right-icon">🧋</div>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/ve-lamtra"
          >
            VỀ LAMTRA
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/tin-tuc"
          >
            TIN TỨC
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/tuyen-dung"
          >
            TUYỂN DỤNG
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/cua-hang"
          >
            CỬA HÀNG
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/san-pham"
          >
            SẢN PHẨM
          </NavLink>
          <span>GIAO HÀNG</span>
          <NavLink
            className={({ isActive }) =>
              isActive ? "mobile-link active" : "mobile-link"
            }
            to="/feedbacks"
          >
            FEEDBACKS
          </NavLink>
        </div>
      )}
    </header>
  );
}

export default Header;
