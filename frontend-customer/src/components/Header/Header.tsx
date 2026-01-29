import './Header.css'
import logo from '../../assets/lamtra-logo.png'
import {Link} from 'react-router-dom'
import { FiMenu } from 'react-icons/fi';
import { useState } from 'react';

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
            <span className="nav-item">VỀ LAMTRA</span>
            <span className="nav-item">TIN TỨC</span>
            <span className="nav-item">TUYỂN DỤNG</span>
            <span className="nav-item">CỬA HÀNG</span>
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
            <span className="nav-item">SẢN PHẨM</span>
            <span className="nav-item">FEEDBACKS</span>
          </nav>

          <div className="header-right-icon">
            🧋
          </div>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <span>VỀ LAMTRA</span>
          <span>TIN TỨC</span>
          <span>TUYỂN DỤNG</span>
          <span>CỬA HÀNG</span>
          <span>SẢN PHẨM</span>
          <span>GIAO HÀNG</span>
          <span>FEEDBACKS</span>
        </div>
      )}
    </header>
  )
}

export default Header
