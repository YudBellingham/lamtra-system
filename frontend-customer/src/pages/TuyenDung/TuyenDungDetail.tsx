import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./styles/TuyenDungDetail.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaChevronLeft, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface Store {
  branchid: number;
  name: string;
  address: string;
}

const TuyenDungDetail: React.FC = () => {
  const { location } = useParams<{ location: string }>();

  const isHanoi = location === "ha-noi";
  const locationLabel = isHanoi ? "Hà Nội" : "TP.Hồ Chí Minh";

  const [storeList, setStoreList] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // State lưu lỗi database

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [selectedStores, setSelectedStores] = useState<number[]>([]);
  const [canRotate, setCanRotate] = useState("Có");
  const [startDate, setStartDate] = useState("");
  const [otherDesires, setOtherDesires] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("branchid, name, address")
          .eq("isactive", true);

        // Xem giá trị thô và lỗi từ Supabase
        console.log("Dữ liệu thô từ Supabase (Tuyển dụng):", data, error);

        if (error) {
          setFetchError(error.message);
          throw error;
        }

        if (data) {
          const filtered = data?.filter((branch: Store) => {
            const addr = branch.address.toLowerCase();
            if (isHanoi) {
              return addr?.includes("hà nội") || addr?.includes("ha noi");
            } else {
              return addr?.includes("hồ chí minh") || addr?.includes("ho chi minh") || addr?.includes("tp. hcm") || addr?.includes("tphcm");
            }
          });
          setStoreList(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [isHanoi]);

  const handleStoreToggle = (branchid: number) => {
    setSelectedStores(prev =>
      prev?.includes(branchid)
        ? prev?.filter(id => id !== branchid)
        : [...prev, branchid]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!dob) newErrors.dob = "Vui lòng chọn ngày tháng năm sinh";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Vui lòng nhập email hợp lệ";
    if (selectedStores.length < 2) newErrors.stores = "Vui lòng chọn tối thiểu 2 cửa hàng";
    if (!startDate) newErrors.startDate = "Vui lòng chọn thời gian có thể bắt đầu";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const selectedStoreNames = selectedStores?.map(id => {
        const store = storeList.find(s => s.branchid === id);
        return store ? `${store.address} - ${store.name}` : id.toString();
      });

      const response = await fetch("${import.meta.env.VITE_API_URL}/api/send-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          dob,
          email,
          selectedStores: selectedStoreNames,
          canRotate,
          startDate,
          otherDesires,
          location: locationLabel
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setIsSuccess(true);
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại sau: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (location !== "ha-noi" && location !== "hcm") {
    return (
      <main className="career-detail-page">
        <BackgroundDecor />
        <section className="career-detail-section">
          <h2>Khu vực không hợp lệ</h2>
          <Link to="/tuyen-dung" className="career-back-link">
            <FaChevronLeft /> Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="career-detail-page">
      <BackgroundDecor />
      <section className="career-detail-section">

        <Link to="/tuyen-dung" className="career-back-link">
          <FaChevronLeft /> Quay lại
        </Link>

        {isSuccess ? (
          <div className="success-screen">
            <FaCheckCircle className="success-icon" />
            <h2 className="success-title">Ứng tuyển thành công!</h2>
            <p className="success-desc">
              Lamtra đã nhận đơn ứng tuyển của bạn tại khu vực <strong>{locationLabel}</strong>. Vui lòng để ý email & điện thoại trong vòng 2-3 ngày tới để nhận lịch phỏng vấn nhé. Cảm ơn bạn đã lựa chọn Lam Trà! 🍵
            </p>
          </div>
        ) : (
          <>
            <div className="job-header">
              <h1 className="job-title">Khối Cửa Hàng - {locationLabel}</h1>
              <div className="job-meta">
                <span className="meta-badge">Full-time / Part-time</span>
                <span className="meta-badge">Pha Chế • Thu Ngân • Phục Vụ</span>
              </div>
            </div>

            <div className="career-content-wrapper">
              <div className="job-description-section">
                <div className="jd-block">
                  <h3>Mô Tả Công Việc</h3>
                  <ul>
                    <li>Chào đón khách hàng trạm năng lượng tích cực với nụ cười thân thiện.</li>
                    <li>Order, tư vấn đồ uống và chế biến các món trà chuẩn vị Lam Trà.</li>
                    <li>Đảm bảo vệ sinh, không gian quầy bar và cửa hàng luôn sạch sẽ, gọn gàng.</li>
                    <li>Phối hợp cùng team để hoàn thành ca làm việc trơn tru nhất.</li>
                  </ul>
                </div>
                <div className="jd-block">
                  <h3>Yêu Cầu Công Việc</h3>
                  <ul>
                    <li>Nam/Nữ từ đủ 18 tuổi trở lên, tốt nghiệp THPT hoặc sinh viên các trường.</li>
                    <li>Vui vẻ, nhiệt tình, có trách nhiệm và tinh thần học hỏi cao.</li>
                    <li>Sẵn sàng làm việc theo ca xoay linh hoạt (Sáng, Chiều, Tối).</li>
                    <li>Không yêu cầu kinh nghiệm - Bạn sẽ được đào tạo bài bản từ A-Z!</li>
                  </ul>
                </div>
                <div className="jd-block">
                  <h3>Quyền Lợi</h3>
                  <ul>
                    <li>Thu nhập hấp dẫn: Lương cứng + Thưởng hiệu suất + Phụ cấp.</li>
                    <li>Được cấp đồng phục miễn phí và thức uống thoải mái tại quán.</li>
                    <li>Môi trường làm việc GenZ trẻ trung, năng động, sếp siêu tâm lý.</li>
                    <li>Cơ hội thăng tiến lên các vị trí Quản lý, Cửa hàng trưởng nhanh chóng.</li>
                  </ul>
                </div>
              </div>

              <div className="application-form-section">
                <h2 className="form-title">Đơn Ứng Tuyển</h2>

                {loading ? (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <FaSpinner className="fa-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '8px', color: 'var(--primary-color)' }} />
                    Đang tải dữ liệu cửa hàng...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Họ và tên <span className="required-mark">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập họ và tên đầy đủ..."
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                      {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số điện thoại <span className="required-mark">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Nhập số điện thoại liên lạc..."
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ngày tháng năm sinh <span className="required-mark">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                      />
                      {errors.dob && <span className="error-text">{errors.dob}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email <span className="required-mark">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Nhập địa chỉ email cá nhân..."
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cửa hàng mong muốn ứng tuyển <span className="required-mark">*</span></label>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Vui lòng chọn tối thiểu 2 cửa hàng (để linh hoạt sắp xếp nhân sự)</p>

                      {fetchError ? (
                        <p style={{ color: 'red', fontSize: '14px', fontStyle: 'italic', fontWeight: "bold" }}>
                          Lỗi kết nối database: {fetchError}
                        </p>
                      ) : storeList.length === 0 ? (
                        <p style={{ color: '#d81b60', fontSize: '14px', fontStyle: 'italic' }}>Hiện khu vực này chưa có cửa hàng nào được cập nhật.</p>
                      ) : (
                        <div className="checkbox-list">
                          {storeList?.map(store => (
                            <label key={store.branchid} className="checkbox-item">
                              <input
                                type="checkbox"
                                value={store.branchid}
                                checked={selectedStores?.includes(store.branchid)}
                                onChange={() => handleStoreToggle(store.branchid)}
                              />
                              <span>{store.address} - {store.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.stores && <span className="error-text">{errors.stores}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bạn có thể xoay ca được không? <span className="required-mark">*</span></label>
                      <div className="radio-list">
                        <label className="radio-item">
                          <input
                            type="radio"
                            name="rotateShift"
                            value="Có"
                            checked={canRotate === "Có"}
                            onChange={e => setCanRotate(e.target.value)}
                          />
                          <span>Có</span>
                        </label>
                        <label className="radio-item">
                          <input
                            type="radio"
                            name="rotateShift"
                            value="Không"
                            checked={canRotate === "Không"}
                            onChange={e => setCanRotate(e.target.value)}
                          />
                          <span>Không</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Thời gian dự kiến có thể bắt đầu làm việc <span className="required-mark">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                      {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bạn còn mong muốn/nguyện vọng gì khác không?</label>
                      <textarea
                        className="form-control"
                        placeholder="Ví dụ: Mong muốn làm part-time ca sáng, không làm được tối thứ 7..."
                        value={otherDesires}
                        onChange={e => setOtherDesires(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="submit-btn-wrapper">
                      <button type="submit" className="btn-submit" disabled={isSubmitting || storeList.length < 2}>
                        {isSubmitting ? <><FaSpinner className="fa-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Đang gửi...</> : "Nộp đơn ứng tuyển"}
                      </button>
                      <style>
                        {`
                          @keyframes spin {
                            100% { transform: rotate(360deg); }
                          }
                        `}
                      </style>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default TuyenDungDetail;
