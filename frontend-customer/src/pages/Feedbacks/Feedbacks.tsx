import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { FiHeart, FiSend, FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import "./styles/Feedbacks.css";

const FeedbackCard = ({ fb }: { fb: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight > contentRef.current.clientHeight) {
        setIsOverflowing(true);
      }
    }
  }, [fb.content]);

  return (
    <div className="fb-note-card">
      <div className="fb-quote-icon">
        <FiMessageCircle />
      </div>
      <p
        className={`fb-content ${expanded ? "expanded" : ""}`}
        ref={contentRef}
      >
        "{fb.content}"
      </p>

      {isOverflowing && !expanded && (
        <button onClick={() => setExpanded(true)} className="fb-read-more">
          Xem thêm
        </button>
      )}
      {expanded && (
        <button onClick={() => setExpanded(false)} className="fb-read-more">
          Thu gọn
        </button>
      )}

      <div className="fb-meta">
        <span className="fb-author">- {fb.displayname}</span>
        <span className="fb-date">
          {new Date(fb.createdat).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </div>
  );
};

const Feedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ displayname: "", content: "" });

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("is_visible", true)
        .order("createdat", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayname.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      let customerid = null;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        customerid = session.user.id;
      }

      const { error } = await supabase.from("feedbacks").insert({
        customerid,
        displayname: formData.displayname,
        content: formData.content,
        is_visible: false,
      });

      if (error) throw error;

      toast.success(
        "Gửi yêu thương thành công! Cảm ơn bạn rất nhiều 💌 Quản trị viên sẽ duyệt trong thời gian sớm nhất",
      );
      setFormData({ displayname: "", content: "" });
      fetchFeedbacks(); // Auto reload immediately
    } catch (e: any) {
      toast.error("Gửi thất bại: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="feedbacks-page">
      <BackgroundDecor />
      <div className="feedbacks-container">
        {/* Left Side: Form */}
        <section className="feedbacks-form-section">
          <div className="fb-form-card">
            <h1 className="fb-title">
              Góc Nhỏ Tâm Tình{" "}
              <FiHeart
                style={{
                  color: "#d81b60",
                  fill: "#d81b60",
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginLeft: "8px",
                }}
              />
            </h1>
            <p className="fb-desc">
              Nơi Lam Trà lắng nghe những yêu thương và góp ý từ bạn để ngày một
              hoàn thiện hơn...
            </p>

            <form onSubmit={handleSubmit} className="fb-form">
              <div className="fb-input-group">
                <label>Chúng tôi nên gọi bạn là gì? *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="VD: Lam Trà Lover"
                  value={formData.displayname}
                  onChange={(e) =>
                    setFormData({ ...formData, displayname: e.target.value })
                  }
                />
              </div>
              <div className="fb-input-group">
                <label>Những lời bạn muốn nói... *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Hôm nay đồ uống thế nào? Bạn có góp ý gì không?"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="fb-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  "Đang gửi..."
                ) : (
                  <>
                    <FiSend /> Gửi yêu thương
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Masonry List */}
        <section className="feedbacks-list-section">
          {loading ? (
            <div className="fb-loader">
              <div
                className="spinner"
                style={{
                  borderColor: "#ffeff3",
                  borderTopColor: "#ff8fa3",
                  margin: "0 auto 10px auto",
                }}
              ></div>
              Đang tải góc nhỏ tâm tình...
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="fb-empty">
              Chưa có lời tâm tình nào. Hãy là người đầu tiên bóc tem nhé!
            </div>
          ) : (
            <div className="fb-masonry">
              {feedbacks?.map((fb) => (
                <FeedbackCard key={fb.id} fb={fb} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Feedbacks;
