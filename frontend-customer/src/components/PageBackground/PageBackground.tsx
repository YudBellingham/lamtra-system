import "./PageBackground.css";
import mountainBg from "../../assets/mountain-bg.png";
import cocTraSua from "../../assets/lamtra-coctrasua.png";
import lamtraLogo from "../../assets/lamtra-logo.png";

interface PageBackgroundProps {
  showCocTraSua?: boolean;
}

function PageBackground({ showCocTraSua = false }: PageBackgroundProps) {
  return (
    <div className="page-background">
      <div className="background-mountain">
        <img
          src={mountainBg}
          alt="Mountain Background"
          className="mountain-img"
        />
        <div className="gradient-overlay"></div>
      </div>
      {showCocTraSua && (
        <>
          <img src={lamtraLogo} alt="Lamtra Logo" className="lamtra-logo-img" />
          <p className="lamtra-tagline">
            Lam Trà được tạo nên từ niềm tin với hương vị chân thật nhất luôn
            đến từ sự giản dị và tinh khiết. Lấy cảm hứng từ những loài hoa đậm
            nét phương Đông, kết hợp cùng lá trà tuyển chọn kỹ lưỡng và ủ chậm,
            mỗi ly trà là một bản hòa ca giữa các tầng hương dịu dàng và nền vị
            thanh sâu.
          </p>
          <img
            src={cocTraSua}
            alt="Lamtra Cà Phê Trà Sữa"
            className="coctrasua-img"
          />
        </>
      )}
    </div>
  );
}

export default PageBackground;
