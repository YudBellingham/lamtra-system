import "./PageBackground.css";
import { useEffect, useState } from "react";
import mountainBg from "../../assets/mountain-bg.png";
import cocTraSua from "../../assets/lamtra-icon1.png";
import lamtraLogo from "../../assets/lamtra-logo.png";

type PageType =
  | "home"
  | "tin-tuc"
  | "ve-lamtra"
  | "tuyen-dung"
  | "cua-hang"
  | "san-pham"
  | "feedbacks";

interface PageBackgroundProps {
  pageType?: PageType;
}

const pageContent: Record<
  PageType,
  { title?: string; subtitle?: string; showCocTraSua?: boolean }
> = {
  home: {
    showCocTraSua: true,
  },
  "tin-tuc": {
    title: "TIN TỨC",
    subtitle:
      "Cập nhật những tin tức mới nhất về Lam Trà, các sản phẩm độc đáo và chương trình khuyến mãi hấp dẫn",
  },
  "ve-lamtra": {
    title: "VỀ LAM TRÀ",
    subtitle: "Khám phá câu chuyện và giá trị cốt lõi của thương hiệu Lam Trà",
  },
  "tuyen-dung": {
    title: "TUYỂN DỤNG",
    subtitle:
      "Gia nhập đội ngũ Lam Trà và cùng chúng tôi tạo nên những ly trà tuyệt vời",
  },
  "cua-hang": {
    title: "CỬA HÀNG",
    subtitle:
      "Tìm cửa hàng Lam Trà gần nhất và thưởng thức trải nghiệm đặc biệt",
  },
  "san-pham": {
    title: "SẢN PHẨM",
    subtitle: "Khám phá bộ sưu tập đa dạng các sản phẩm trà chất lượng cao",
  },
  feedbacks: {
    title: "FEEDBACKS",
    subtitle: "Chia sẻ trải nghiệm của bạn và giúp chúng tôi ngày càng tốt hơn",
  },
};

function PageBackground({ pageType = "home" }: PageBackgroundProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [pageType]);

  const content = pageContent[pageType];
  const { showCocTraSua = false, title, subtitle } = content;

  return (
    <div className="page-background" key={animationKey}>
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
      {title && (
        <div className="page-title-section">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

export default PageBackground;
