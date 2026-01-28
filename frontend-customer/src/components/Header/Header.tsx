import './Header.css'
import logo from '../../assets/lamtra-logo.png'
import {Link} from 'react-router-dom'

function Header() {
  return (
    <header className="lamtra-header">
      <div className="header-container">

        <nav className="nav-left">
          <span className="nav-item">VỀ LAMTRA</span>
          <span className="nav-item">TIN TỨC</span>
          <span className="nav-item">TUYỂN DỤNG</span>
          <span className="nav-item">CỬA HÀNG</span>
        </nav>

        <div className="header-logo">
          <Link to="/">
            <img src={logo} alt="Lam Trà" />
          </Link>
        </div>

        <nav className="nav-right">
          <span className="nav-item">GIAO HÀNG</span>
          <span className="nav-item">SẢN PHẨM</span>
          <span className="nav-item">FEEDBACKS</span>
        </nav>

      </div>
    </header>
  )
}

export default Header
