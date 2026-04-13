import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/TuyenDung.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaMapMarkerAlt, FaChevronRight } from "react-icons/fa";

interface JobData {
  id: string;
  locationTarget: string;
  locationLabel: string;
  title: string;
  desc: string;
  image: string;
}

const jobsData: JobData[] = [
  {
    id: "ha-noi",
    locationTarget: "ha-noi",
    locationLabel: "Hà Nội",
    title: "Lamtra",
    desc: "Tuyển dụng nhân sự Khối Cửa Hàng (Pha chế, Phục vụ, Thu ngân) full-time và part-time khu vực Hà Nội.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800" 
  },
  {
    id: "hcm",
    locationTarget: "hcm",
    locationLabel: "TP.HCM",
    title: "Lamtra",
    desc: "Tuyển dụng nhân sự Khối Cửa Hàng (Pha chế, Phục vụ, Thu ngân) full-time và part-time khu vực TP.Hồ Chí Minh.",
    image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=800" 
  }
];

const TuyenDung: React.FC = () => {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const filteredJobs = jobsData.filter(job => filter === "all" || job.locationTarget === filter);

  return (
    <main className="career-page">
      <BackgroundDecor />
      <section className="career-section">
        <div className="career-header">
           <span className="career-sub-header">GIA NHẬP ĐỘI NGŨ</span>
           <h1 className="career-title">
             <span className="career-decor-line"></span>
             <span className="title-text">TUYỂN DỤNG</span>
             <span className="career-decor-line"></span>
           </h1>
           <p className="career-desc">
             Trở thành một phần của Lam Trà, cùng chúng mình mang đến những ly trà tươi mát, không gian tuyệt vời và năng lượng tích cực mỗi ngày!
           </p>
        </div>

        <div className="career-filter-container">
          <label htmlFor="location-filter">Khu vực làm việc:</label>
          <div className="select-wrapper">
             <select 
               id="location-filter" 
               value={filter} 
               onChange={(e) => setFilter(e.target.value)}
             >
               <option value="all">Tất cả khu vực</option>
               <option value="ha-noi">Hà Nội</option>
               <option value="hcm">TP. Hồ Chí Minh</option>
             </select>
          </div>
        </div>

        <div className="career-grid">
          {filteredJobs.map(job => (
             <div 
               key={job.id} 
               className="career-card"
               onClick={() => navigate(`/tuyen-dung/${job.locationTarget}`)}
             >
               <div className="career-card-img">
                 <img src={job.image} alt={job.title} />
                 <div className="career-location-badge">
                   <FaMapMarkerAlt /> {job.locationLabel}
                 </div>
               </div>
               <div className="career-card-content">
                 <h3 className="career-card-title">{job.title}</h3>
                 <p className="career-card-desc">{job.desc}</p>
                 <button className="career-btn-apply">
                   Ứng tuyển ngay <FaChevronRight />
                 </button>
               </div>
             </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default TuyenDung;
