import "./Footer.css";
import logo from "../../assets/lamtra-logo.png";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="lamtra-footer">
      <div className="footer-container">
        <div className="footer-left">
          <Link to="/">
            <img src={logo} alt="Lam Trà" />
          </Link>
          <div className="copyright">
            © 2026 | LAM TRA | ALL RIGHTS RESERVED
          </div>
        </div>

        <div className="footer-center">
          <nav className="footer-nav">
            <div className="col">
              <Link to="/">Trang Chủ</Link>
              <Link to="/san-pham">Sản Phẩm</Link>
              <Link to="/tin-tuc">Tin Tức</Link>
            </div>
            <div className="col">
              <Link to="/co-so">Cơ Sở</Link>
              <Link to="/tuyen-dung">Tuyển dụng</Link>
              <Link to="/feedback">Feedback</Link>
            </div>
          </nav>
        </div>

        <div className="footer-right">
          <div className="contact-title">Liên hệ nhà Lam</div>
          <div className="socials">
            <a href="#" aria-label="phone">
              📞
            </a>
            <a href="#" aria-label="google">
              G
            </a>
            <a href="#" aria-label="facebook">
              f
            </a>
            <a href="#" aria-label="tiktok">
              ♪
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
