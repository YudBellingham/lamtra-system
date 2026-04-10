import React, { useState } from "react";
import "./styles/VeLamtra.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaLeaf, FaHeart, FaStar, FaSeedling, FaSpa } from "react-icons/fa";

const VeLamtra: React.FC = () => {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  
  const observeElement = (id: string) => {
    return (node: HTMLDivElement | null) => {
      if (node) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              setVisibleSections(prev => ({...prev, [id]: true}));
              observer.disconnect();
            }
          },
          { threshold: 0.2 }
        );
        observer.observe(node);
      }
    };
  };

  return (
    <main className="velamtra-page">
      <BackgroundDecor />
      
      <section className="velamtra-hero" ref={observeElement("hero")}>
        <div className={`velamtra-hero-content ${visibleSections["hero"] ? "fade-in-up" : "opacity-0"}`}>
          <h1 className="velamtra-headline">LAMTRA – NƠI CÂU CHUYỆN BẮT ĐẦU TỪ HƯƠNG TRÀ VÀ HOA</h1>
        </div>
      </section>

      <section className="velamtra-story" ref={observeElement("story")}>
        <div className={`velamtra-story-container ${visibleSections["story"] ? "fade-in-up" : "opacity-0"}`}>
          <div className="story-text-wrapper">
            <h2 className="story-title">Câu Chuyện Thương Hiệu</h2>
            <div className="story-content">
              <p>Lamtra là một thương hiệu trà sữa Việt Nam mang trong mình khát khao kết nối những giá trị thủ công truyền thống với nhịp sống hiện đại. Khởi nguồn từ những đồi chè xanh mướt và những mùa hoa đơm bông, chúng mình mang đến từng ly trà đậm đà hương vị tự nhiên nhất.</p>
              <br/>
              <p>Thấu hiểu nhu cầu tìm kiếm sự cân bằng của giới trẻ ngày nay, Lamtra không chỉ tạo ra một thức uống giải khát, mà còn là một trạm dừng chân bình yên. Từng lá chè, từng nhành hoa bưởi, hoa nhài đều được chắt lọc khắt khe, kết hợp tinh tế để giữ lại trọn vẹn hương vị nguyên bản, xoa dịu tâm hồn bạn mỗi ngày.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="velamtra-values" ref={observeElement("values")}>
        <div className={`values-grid ${visibleSections["values"] ? "fade-in-up" : "opacity-0"}`}>
          
          <div className="value-card card-mission">
            <div className="card-icon-wrapper"><FaSeedling /></div>
            <h3 className="card-title">Sứ mệnh</h3>
            <p className="card-text">Mang đến những trải nghiệm trà sữa tinh tế, đánh thức mọi giác quan bằng hương vị tự nhiên và không gian thưởng trà đầy cảm hứng dành cho thế hệ trẻ.</p>
          </div>

          <div className="value-card card-promise">
            <div className="card-icon-wrapper"><FaHeart /></div>
            <h3 className="card-title">Lời hứa</h3>
            <p className="card-text">Lamtra cam kết mang đến những sản phẩm được chăm chút tỉ mỉ từ nguyên liệu sạch, an toàn, không ngừng sáng tạo nhưng vẫn tôn trọng giá trị cốt lõi văn hóa trà Việt.</p>
          </div>

          <div className="value-card card-core">
            <div className="card-icon-wrapper"><FaSpa /></div>
            <h3 className="card-title">Giá trị cốt lõi</h3>
            <ul className="core-list">
              <li><FaLeaf className="li-icon"/> Tự nhiên</li>
              <li><FaStar className="li-icon"/> Tinh tế</li>
              <li><FaHeart className="li-icon"/> Chân thật</li>
            </ul>
          </div>
          
        </div>
      </section>
      <div style={{ height: "80px" }}></div>
    </main>
  );
};
export default VeLamtra;
