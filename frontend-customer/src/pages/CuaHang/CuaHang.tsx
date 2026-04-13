import React, { useState, useEffect } from "react";
import "./styles/CuaHang.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { FaMapMarkerAlt, FaRegClock, FaChevronDown } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

interface Store {
  branchid: number;
  name: string;
  address: string;
}

interface CityData {
  city: string;
  stores: Store[];
}

const CuaHang: React.FC = () => {
  const [storeData, setStoreData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // State lưu lỗi từ Supabase
  const [openCities, setOpenCities] = useState<Record<string, boolean>>({
    "Hà Nội": true,
    "TP. HCM": false
  });
  const [activeStore, setActiveStore] = useState<Store | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase
          .from("branches")
          .select("branchid, name, address")
          .eq("isactive", true);

        // Xem dữ liệu trả về và lỗi nếu có
        console.log("Dữ liệu thô từ Supabase:", data, error);

        if (error) {
          setFetchError(error.message); // Lưu lỗi vào state
          throw error;
        }

        const hnStores: Store[] = [];
        const hcmStores: Store[] = [];

        if (data) {
          data.forEach((branch: Store) => {
            const addr = branch.address.toLowerCase();
            if (addr.includes("hà nội") || addr.includes("ha noi")) {
              hnStores.push(branch);
            } else if (addr.includes("hồ chí minh") || addr.includes("ho chi minh") || addr.includes("tp. hcm") || addr.includes("tphcm")) {
              hcmStores.push(branch);
            }
          });
        }

        // Kiểm tra logic chia mảng
        console.log("Danh sách Hà Nội:", hnStores);
        console.log("Danh sách HCM:", hcmStores);

        const groupedData: CityData[] = [];
        if (hnStores.length > 0) groupedData.push({ city: "Hà Nội", stores: hnStores });
        if (hcmStores.length > 0) groupedData.push({ city: "TP. HCM", stores: hcmStores });

        setStoreData(groupedData);

        if (groupedData.length > 0 && groupedData[0].stores.length > 0) {
          setActiveStore(groupedData[0].stores[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const toggleCity = (city: string) => {
    setOpenCities(prev => ({
      ...prev,
      [city]: !prev[city]
    }));
  };

  const handleStoreClick = (store: Store) => {
    setActiveStore(store);
  };

  const mapEmbedSrc = activeStore
    ? `https://maps.google.com/maps?q=${encodeURIComponent(activeStore.address + " Lam Trà")}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : "";

  return (
    <main className="store-page">
      <BackgroundDecor />

      <section className="store-section">
        <div className="store-header">
          <span className="store-sub-header">HỆ THỐNG CỬA HÀNG</span>
          <h1 className="store-title">
            <span className="store-decor-line"></span>
            <span className="title-text">LAM TRÀ</span>
            <span className="store-decor-line"></span>
          </h1>
          <p className="store-desc">
            Không gian mang đậm dấu ấn Á Đông kết hợp hiện đại, nơi bạn có thể thưởng thức ly trà mang hương vị tươi mới mỗi ngày.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>Đang tải dữ liệu...</div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "red", fontWeight: "bold" }}>
            Lỗi kết nối database: {fetchError}
          </div>
        ) : storeData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>Hiện chưa có cửa hàng nào được cập nhật.</div>
        ) : (
          <div className="store-container">
            <div className="store-sidebar">
              <div className="sidebar-header">
                <h3>Tìm cửa hàng</h3>
              </div>

              <div className="accordion-container">
                {storeData?.map((data) => (
                  <div key={data.city} className="city-accordion">
                    <div
                      className={`city-accordion-header ${openCities[data.city] ? "open" : ""}`}
                      onClick={() => toggleCity(data.city)}
                    >
                      <span>{data.city} ({data.stores.length})</span>
                      <FaChevronDown className="accordion-icon" />
                    </div>

                    <div className={`city-accordion-content ${openCities[data.city] ? "open" : ""}`}>
                      <div className="store-items-container">
                        {data.stores?.map((store) => (
                          <div
                            key={store.branchid}
                            className={`store-item ${activeStore?.branchid === store.branchid ? "active" : ""}`}
                            onClick={() => handleStoreClick(store)}
                          >
                            <h4 className="store-name">{store.name}</h4>

                            <div className="store-detail-row">
                              <FaMapMarkerAlt className="store-icon" />
                              <span>{store.address}</span>
                            </div>

                            <div className="store-detail-row">
                              <FaRegClock className="store-icon" />
                              <span>Mở cửa: 09:00 - 22:00</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="store-map-area">
              {activeStore && (
                <iframe
                  src={mapEmbedSrc}
                  className="map-iframe"
                  style={{ width: "100%", height: "100%", border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Bản đồ địa chỉ ${activeStore.name}`}
                ></iframe>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default CuaHang;
