import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TinTucDetail.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaChevronLeft, FaCalendarAlt } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface NewsItem {
  newsid: number;
  title: string;
  excerpt: string;
  content: string;
  type: string;
  status: string;
  publisheddate: string;
  thumbnail: string;
}

const TinTucDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error("Không tìm thấy ID bài viết");

        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("newsid", parseInt(id))
          .single();

        if (error) throw error;
        setNewsItem(data as NewsItem);
      } catch (err: any) {
        setError(err.message || "Không thể tải bài viết.");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (loading) {
    return (
      <main className="news-detail-page">
        <BackgroundDecor />
        <section className="news-detail-section error-section">
          <h2>Đang tải bài viết...</h2>
        </section>
      </main>
    );
  }

  if (error || !newsItem) {
    return (
      <main className="news-detail-page">
        <BackgroundDecor />
        <section className="news-detail-section error-section">
          <h2>Không tìm thấy bài viết</h2>
          <button className="btn-back" onClick={() => navigate("/tin-tuc")}>
            <FaChevronLeft /> Quay lại danh sách
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="news-detail-page">
      <BackgroundDecor />
      
      <section className="news-detail-section">
        <button className="btn-back" onClick={() => navigate("/tin-tuc")}>
          <FaChevronLeft /> Quay lại tin tức
        </button>

        <article className="news-detail-article">
          <div className="article-header">
            <span className={`news-type-badge ${newsItem.type?.trim() === 'Khuyến mãi' ? 'promo' : newsItem.type?.trim() === 'Câu chuyện' ? 'story' : 'news'}`}>
              {newsItem.type?.trim()}
            </span>
            <h1 className="article-title">{newsItem.title}</h1>
            <div className="article-meta">
              <FaCalendarAlt className="meta-icon" />
              <span>Đăng ngày: {formatDate(newsItem.publisheddate)}</span>
            </div>
          </div>

          <div className="article-hero-image">
            <img src={newsItem.thumbnail} alt={newsItem.title} />
          </div>

          <div className="article-content">
            <p className="article-lead">{newsItem.excerpt}</p>
            <div 
              className="article-body" 
              dangerouslySetInnerHTML={{ __html: newsItem.content }} 
            />
          </div>
        </article>
      </section>
    </main>
  );
};

export default TinTucDetail;
