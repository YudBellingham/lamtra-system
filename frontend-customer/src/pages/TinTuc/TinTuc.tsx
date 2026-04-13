import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TinTuc.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaCalendarAlt } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

export interface NewsItem {
  newsid: number;
  title: string;
  excerpt: string;
  content: string;
  type: string;
  status: string;
  publisheddate: string;
  thumbnail: string;
}

const TinTuc: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>("Tất cả");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filters = ["Tất cả", "Khuyến mãi", "Câu chuyện", "Tin tức", "Tuyển dụng"];
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("status", "Hiện")
          .order("publisheddate", { ascending: false });

        if (error) throw error;
        setNewsData(data as NewsItem[]);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải tin tức.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleChangeFilter = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const filteredNews = activeFilter === "Tất cả"
    ? newsData
    : newsData?.filter(item => item.type?.trim() === activeFilter);

  const featuredNews = filteredNews.length > 0 ? filteredNews[0] : null;
  const remainingNews = featuredNews ? filteredNews.slice(1) : [];

  const totalPages = Math.ceil(remainingNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const gridNews = remainingNews.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <main className="news-page">
      <BackgroundDecor />

      <section className="news-section">
        <div className="news-header">
          <span className="news-sub-header">CÂU CHUYỆN THƯƠNG HIỆU</span>
          <h1 className="news-title">
            <span className="news-decor-line"></span>
            <span className="title-text">TIN TỨC LAM TRÀ</span>
            <span className="news-decor-line"></span>
          </h1>
        </div>

        {loading && <div className="loading-state">Đang tải tin tức...</div>}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && featuredNews && (
          <div
            className="featured-news-card"
            onClick={() => navigate(`/tin-tuc/${featuredNews.newsid}`)}
          >
            <div className="featured-image-wrapper">
              <img src={featuredNews.thumbnail} alt={featuredNews.title} className="featured-image" />
              <div className="featured-overlay"></div>
            </div>
            <div className="featured-content">
              <span className={`news-type-badge ${featuredNews.type?.trim() === 'Khuyến mãi' ? 'promo' : featuredNews.type?.trim() === 'Câu chuyện' ? 'story' : 'news'}`}>
                {featuredNews.type?.trim()}
              </span>
              <h2 className="featured-title">{featuredNews.title}</h2>
              <p className="featured-excerpt">{featuredNews.excerpt}</p>
              <div className="featured-meta">
                <FaCalendarAlt className="meta-icon" />
                <span>{formatDate(featuredNews.publisheddate)}</span>
              </div>
              <button className="btn-read-more">Đọc ngay</button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="news-filter-container" ref={gridRef}>
              {filters?.map(filter => (
                <button
                  key={filter}
                  className={`news-filter-btn ${activeFilter === filter ? "active" : ""}`}
                  onClick={() => handleChangeFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="news-grid">
              {gridNews?.map(news => (
                <div
                  key={news.newsid}
                  className="news-card"
                  onClick={() => navigate(`/tin-tuc/${news.newsid}`)}
                >
                  <div className="news-image-wrapper">
                    <img src={news.thumbnail} alt={news.title} className="news-image" />
                    <span className={`news-type-badge ${news.type?.trim() === 'Khuyến mãi' ? 'promo' : news.type?.trim() === 'Câu chuyện' ? 'story' : 'news'}`}>
                      {news.type?.trim()}
                    </span>
                  </div>
                  <div className="news-info">
                    <h3 className="news-card-title">{news.title}</h3>
                    <p className="news-excerpt">{news.excerpt}</p>
                    <div className="news-meta">
                      <FaCalendarAlt className="meta-icon" />
                      <span>{formatDate(news.publisheddate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {gridNews.length === 0 && featuredNews === null && (
              <div className="empty-news-msg">Hiện chưa có bài viết nào trong chuyên mục này.</div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages })?.map((_, idx) => (
                  <button
                    key={idx}
                    className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default TinTuc;
