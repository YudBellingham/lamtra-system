import React, { useEffect, useRef, useState } from "react";
import "./styles/HomePage.css";
import "./styles/HeroSection.css";
import "./styles/IngredientsSection.css";
import "./styles/FeatureSection.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import heroVideo from "../../assets/homepage/hero-reel.mp4";
import imgDao from "../../assets/homepage/dao.png";
import imgMatcha from "../../assets/homepage/matcha.png";
import imgHongBi from "../../assets/homepage/hong-bi.png";
import imgHatDe from "../../assets/homepage/hat-de.png";
import imgCoc1 from "../../assets/homepage/coc1.png";
import imgCoc2 from "../../assets/homepage/coc2.png";
import imgCoc3 from "../../assets/homepage/coc3.png";
import imgCoc4 from "../../assets/homepage/coc4.png";
import imgCoc5 from "../../assets/homepage/coc5.png";
import imgCoc6 from "../../assets/homepage/coc6.png";
import lamtraIcon2 from "../../assets/lamtra-icon2.png";
import { Link } from "react-router-dom";
import { FaQuoteLeft, FaLeaf, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GiLotus } from "react-icons/gi";

const HomePage: React.FC = () => {
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const [iconVisible, setIconVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const ingredientsRef = useRef<HTMLDivElement>(null);
  const [ingrVisible, setIngrVisible] = useState(false);
  const spaceRef = useRef<HTMLDivElement>(null);
  const [spaceVisible, setSpaceVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const ingredientsData = [
    {
      id: 1,
      name: "Hồng Bì",
      desc: "Làm từ quả Hồng Bì chín thơm ngọt, mọng nước kết hợp cùng tầng trà hoa thơm dịu",
      image: imgHongBi,
      className: "card-small",
    },
    {
      id: 2,
      name: "Matcha",
      desc: "Lam Trà thu hoạch Matcha Vụ Xuân thanh khiết, chứa hàm lượng chất khoáng và vitamin cao hơn, giúp tạo nên vị umami êm dịu, ít đắng gắt mà vẫn đậm đà",
      image: imgMatcha,
      className: "card-large",
    },
    {
      id: 3,
      name: "Hạt Dẻ",
      desc: "Từng hạt được làm sạch, hấp chín vừa đủ để giữ lại vị ngọt thanh tự nhiên và hương thơm ấm dịu đặc trưng",
      image: imgHatDe,
      className: "card-large",
    },
    {
      id: 4,
      name: "Đào Hồng",
      desc: "Đào mang vị ngọt thanh tự nhiên, hương thơm mềm và rất khẽ , vừa đủ để cảm nhận, nhưng lại không lấn át",
      image: imgDao,
      className: "card-small",
    },
  ];

  const sliderData = [
    {
      id: 1,
      main: imgCoc1,
      sub: imgCoc2,
      alt: "Trà đào hồng",
    },
    {
      id: 2,
      main: imgCoc6, 
      sub: imgCoc4,
      alt: "Trà trái cây tươi",
    },
    {
      id: 3,
      main: imgCoc3,
      sub: imgCoc5,
      alt: "Matcha hạt dẻ",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === sliderData.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? sliderData.length - 1 : prev - 1));
  };

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          sectionObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      sectionObserver.observe(sectionRef.current);
    }

    const iconObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIconVisible(true);
          iconObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );

    if (iconContainerRef.current) {
      iconObserver.observe(iconContainerRef.current);
    }

    const ingrObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIngrVisible(true);
          ingrObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    if (ingredientsRef.current) {
      ingrObserver.observe(ingredientsRef.current);
    }

    const spaceObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSpaceVisible(true);
          spaceObserver.unobserve(entries[0].target);
        }
      },
      { threshold: 0.2 },
    );

    if (spaceRef.current) {
      spaceObserver.observe(spaceRef.current);
    }

    return () => {
      if (sectionRef.current) sectionObserver.disconnect();
      if (iconContainerRef.current) iconObserver.disconnect();
      if (ingredientsRef.current) ingrObserver.disconnect();
      if (spaceRef.current) spaceObserver.disconnect();
    };
  }, []);

  return (
    <main className="home-page">
      <BackgroundDecor />
      <div
        className={`hero-section ${isVisible ? "is-visible" : ""}`}
        ref={sectionRef}
      >
        <div className="side-frame left-frame animate-item">
          <div className="frame-decor-bg left-decor">
            <GiLotus />
          </div>
          <div className="text-content left-align">
            <span className="subtitle">BỘ SƯU TẬP 2026</span>
            <h1 className="main-title">
              SẢN PHẨM <br />
              MỚI GỬI TỚI <br />
              <span className="highlight-text">LAMIANS</span>
            </h1>
            <div className="decorative-line"></div>
          </div>
        </div>

        <div className="video-container animate-item">
          <video
            className="clean-video"
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="video-overlay"></div>
        </div>

        <div className="side-frame right-frame animate-item">
          <div className="frame-decor-bg right-decor">
            <FaLeaf />
          </div>
          <div className="text-content right-align">
            <div className="quote-icon">
              <FaQuoteLeft />
            </div>
            <p className="description-text">
              Thưởng thức thêm những tầng hương mới trong những ngày đầu xuân.
            </p>
            <Link to="/san-pham" className="hero-btn">
              Khám phá ngay
            </Link>
          </div>
        </div>
      </div>

      <div className="floating-icon-container" ref={iconContainerRef}>
        <img
          src={lamtraIcon2}
          alt="Lamtra Decor"
          className={`floating-icon ${iconVisible ? "animate" : ""}`}
        />
      </div>

      <section className="ingredients-section">
        <div className="section-header">
          <span className="sub-header">KHỞI NGUỒN VỊ GIÁC</span>
          <h2 className="section-title">
            <span className="decor-line"></span>
            <span className="title-text">NGUYÊN LIỆU</span>
            <span className="decor-line"></span>
          </h2>
          <p className="section-desc">
            Tuyển chọn khắt khe, kết hợp hài hòa những nguyên liệu tinh túy từ
            thiên nhiên, tạo nên sản phẩm không thể cưỡng lại
          </p>
        </div>

        <div
          className={`ingredients-grid ${ingrVisible ? "start-anim" : ""}`}
          ref={ingredientsRef}
        >
          {ingredientsData.map((item, index) => (
            <div
              key={item.id}
              style={{ animationDelay: `${index * 0.15}s` }}
              className={`ingredient-card ${item.className}`}
            >
              <div className="card-image-wrapper">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="card-overlay">
                <h3 className="ing-name">{item.name}</h3>
                <p className="ing-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ingredients-section" ref={spaceRef}>
        <div className="section-header">
          <span className="sub-header">TỪ TÂM HUYẾT ĐẾN TAY BẠN</span>
          <h2 className="section-title">
            <span className="decor-line"></span>
            <span className="title-text">DẤU ẤN LAM TRÀ</span>
            <span className="decor-line"></span>
          </h2>
          <p className="section-desc">
            Không cầu kỳ hào nhoáng, Lam Trà chinh phục bạn bằng sự chân thật
            trong từng nguyên liệu và sự tỉ mỉ trong từng công đoạn pha chế.
          </p>
        </div>

        <div
          className={`feature-container ${spaceVisible ? "animate-feature" : ""}`}
        >
          <div className="feature-gallery-wrapper">
            <div className="feature-gallery">
              <button className="nav-btn prev-btn" onClick={prevSlide}>
                <FaChevronLeft />
              </button>

              <div className="gallery-content">
                <div className="img-box main-img">
                  <img src={sliderData[currentSlide].main} alt="Main showcase" />
                </div>
                <div className="img-box sub-img">
                  <img src={sliderData[currentSlide].sub} alt="Sub detail" />
                </div>
              </div>
              
              <div className="decor-circle-bg"></div>
              <button className="nav-btn next-btn" onClick={nextSlide}>
                <FaChevronRight />
              </button>
            </div>

            <div className="slider-dots">
              {sliderData.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot-indicator ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                ></span>
              ))}
            </div>
          </div>

          <div className="feature-info">
            <h3 className="feature-subtitle">Tươi Mới & Nguyên Bản</h3>
            <p className="feature-text">
              Tại Lam Trà, chúng mình tin rằng một ly trà ngon được tạo nên từ rất nhiều 
              yếu tố. Nó ngon bởi sự tươi mới mỗi ngày
              của trái cây, vị đậm đà của cốt trà ủ lạnh và niềm vui khi bạn cầm
              nó trên tay đi khắp mọi nẻo đường.
            </p>
            <ul className="feature-features">
              <li>
                <div className="feature-icon-box">
                  <span className="dot"></span>
                </div>
                <div className="feature-content">
                  <strong className="feature-label">Tươi mỗi ngày:</strong>
                  <span className="feature-desc">
                    Trái cây cắt thái tươi mới, không dùng siro công nghiệp.
                  </span>
                </div>
              </li>
              <li>
                <div className="feature-icon-box">
                  <span className="dot"></span>
                </div>
                <div className="feature-content">
                  <strong className="feature-label">Đậm vị trà:</strong>
                  <span className="feature-desc">
                    Quy trình ủ trà nghiêm ngặt giữ trọn hương vị nguyên bản.
                  </span>
                </div>
              </li>
              <li>
                <div className="feature-icon-box">
                  <span className="dot"></span>
                </div>
                <div className="feature-content">
                  <strong className="feature-label">Tiện lợi:</strong>
                  <span className="feature-desc">
                    Đóng gói chỉn chu, sạch sẽ, sẵn sàng cùng bạn xuống phố.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ height: "80px" }}></div>
      </section>
    </main>
  );
};

export default HomePage;
