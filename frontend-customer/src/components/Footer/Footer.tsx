import "./Footer.css";
import logo from "../../assets/lamtra-logo.png";
import { Link } from "react-router-dom";
import { FaFacebookF } from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";

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
          <div className="footer-menu">
            <div className="footer-row top">
              <Link to="/ve-lamtra">VỀ LAMTRA</Link>
              <Link to="/tin-tuc">TIN TỨC</Link>
              <Link to="/tuyen-dung">TUYỂN DỤNG</Link>
            </div>

            <div className="footer-row bottom">
              <Link to="/cua-hang">CỬA HÀNG</Link>
              <Link to="/san-pham">SẢN PHẨM</Link>
              <Link to="/feedbacks">FEEDBACKS</Link>
            </div>
          </div>
        </div>

        <div className="footer-right">
          <div className="contact-title">Liên hệ nhà Lam</div>

          <div className="socials">
            <a href="tel:0909123456" className="social-icon phone">
              <FiPhoneCall />
            </a>

            <a
              href="https://www.facebook.com/trasualamtra"
              className="social-icon facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebookF />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
