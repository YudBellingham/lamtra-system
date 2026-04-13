import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import "./styles/SanPham.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { supabase } from "../../lib/supabase";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  categoryid: number;
  name: string;
}

interface Product {
  productid: number;
  name: string;
  subtitle: string;
  description: string;
  baseprice: number;
  saleprice: number | null;
  imageurl: string;
  categoryid: number;
  label?: string;
  has_size_l?: boolean;
}

const SanPham: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '');
  };

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [sortType, setSortType] = useState<string>("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [currentPage, setCurrentPage] = useState(1);
  const [favProductIds, setFavProductIds] = useState<number[]>([]);
  const ITEMS_PER_PAGE = 12;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCategoryChange = (cat: string | number) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLabelToggle = (label: string) => {
    setFilterLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*"),
          supabase.from("products").select("productid, name, subtitle, description, baseprice, saleprice, imageurl, categoryid, label, has_size_l")
        ]);

        if (catRes.error) throw catRes.error;
        if (prodRes.error) throw prodRes.error;

        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await axios.get('http://localhost:8000/api/customers/favorites', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setFavProductIds(res.data.products.map((p: any) => p.productid));
    } catch (err) {
      console.error("Lỗi fetch favorites:", err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Vui lòng đăng nhập để thả tim món ăn!");
        navigate('/auth');
        return;
      }
      const res = await axios.post('http://localhost:8000/api/favorites/toggle', 
        { productId },
        { headers: { Authorization: `Bearer ${session.access_token}` }}
      );
      if (res.data.success) {
        if (res.data.isFavorite) {
          setFavProductIds([...favProductIds, productId]);
          toast.success("Đã thêm vào yêu thích!");
        } else {
          setFavProductIds(favProductIds.filter(id => id !== productId));
          toast("Đã bỏ yêu thích");
        }
      }
    } catch (err) {
      console.error("Lỗi toggle favorite:", err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  let result = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.categoryid === selectedCategory);

  if (searchQuery.trim() !== "") {
    const query = removeAccents(searchQuery);
    result = result.filter(p => removeAccents(p.name).includes(query));
  }

  if (filterLabels.length > 0) {
    result = result.filter(p => p.label && filterLabels.includes(p.label.toLowerCase()));
  }

  result = result.filter(p => p.baseprice >= minPrice && p.baseprice <= maxPrice);

  if (sortType) {
    result = [...result].sort((a, b) => {
      if (sortType === "asc") return a.baseprice - b.baseprice;
      if (sortType === "desc") return b.baseprice - a.baseprice;
      return 0;
    });
  }

  const totalPages = Math.ceil(result.length / ITEMS_PER_PAGE);
  const paginatedProducts = result.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <main className="menu-page">
      <BackgroundDecor />
      <section className="menu-section">
        <div className="menu-header">
          <span className="menu-sub-header">TỪ NHỮNG NGUYÊN LIỆU ĐỈNH CAO</span>
          <h1 className="menu-title">
            <span className="menu-decor-line"></span>
            <span className="title-text">THỰC ĐƠN CỦA LAMTRA</span>
            <span className="menu-decor-line"></span>
          </h1>
        </div>

        {loading ? (
          <div className="menu-status shimmer-text">Đang tải thực đơn...</div>
        ) : error ? (
          <div className="menu-status error-status">Lỗi kết nối database: {error}</div>
        ) : (
          <>
            <div className="category-scroll-wrapper">
              <div className="category-tabs">
                <button
                  className={`category-pill ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => handleCategoryChange("all")}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.categoryid}
                    className={`category-pill ${selectedCategory === cat.categoryid ? "active" : ""}`}
                    onClick={() => handleCategoryChange(cat.categoryid)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-search-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '0 20px' }}>
              <input 
                type="text" 
                placeholder="Tìm trái cây, trà xanh, matcha..." 
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
                style={{ width: '100%', maxWidth: '500px', padding: '12px 20px', borderRadius: '30px', border: '1px solid #ffccd5', fontSize: '15px', outline: 'none', fontFamily: 'Quicksand', boxShadow: '0 4px 12px rgba(216, 27, 96, 0.05)' }}
              />
            </div>

            <div className="advanced-filter-wrapper">
              <button 
                className={`filter-toggle-btn ${showAdvancedFilter ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              >
                <FaFilter /> Bộ Lọc Nâng Cao
                {(filterLabels.length > 0 || sortType || minPrice > 0 || maxPrice < 150000) && <span className="filter-dot"></span>}
              </button>

              {showAdvancedFilter && (
                <div className="filter-dropdown-panel">
                  <div className="filter-group">
                    <h4 className="filter-title">Theo Nhãn</h4>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={filterLabels.includes("bestseller")} 
                        onChange={() => handleLabelToggle("bestseller")} 
                      /> Sản phẩm bán chạy
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={filterLabels.includes("new")} 
                        onChange={() => handleLabelToggle("new")} 
                      /> Sản phẩm mới
                    </label>
                  </div>

                  <div className="filter-group">
                    <h4 className="filter-title">Sắp xếp giá</h4>
                    <select 
                      className="filter-select" 
                      value={sortType} 
                      onChange={(e) => { setSortType(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="">Không sắp xếp</option>
                      <option value="asc">Giá tăng dần</option>
                      <option value="desc">Giá giảm dần</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <h4 className="filter-title">Khoảng giá</h4>
                    <div className="dual-slider-container">
                      <div className="slider-track-bg"></div>
                      <div 
                        className="slider-track" 
                        style={{ 
                          left: `${(minPrice / 150000) * 100}%`, 
                          right: `${100 - (maxPrice / 150000) * 100}%` 
                        }}
                      ></div>
                      <input 
                        type="range" 
                        min="0" 
                        max="150000" 
                        step="5000" 
                        value={minPrice} 
                        onChange={(e) => {
                          const val = Math.min(Number(e.target.value), maxPrice - 5000);
                          setMinPrice(val);
                          setCurrentPage(1);
                        }} 
                      />
                      <input 
                        type="range" 
                        min="0" 
                        max="150000" 
                        step="5000" 
                        value={maxPrice} 
                        onChange={(e) => {
                          const val = Math.max(Number(e.target.value), minPrice + 5000);
                          setMaxPrice(val);
                          setCurrentPage(1);
                        }} 
                      />
                    </div>
                    <div className="price-display">Từ {formatPrice(minPrice)} - {formatPrice(maxPrice)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="product-grid">
              {paginatedProducts.map(product => (
                <div 
                  key={product.productid} 
                  className="product-card"
                  onClick={() => navigate(`/san-pham/${product.productid}`)}
                >
                  <div className="product-image-wrapper">
                    {product.label && (
                      <span className={`product-badge ${product.label.toLowerCase()}`}>
                        {product.label}
                      </span>
                    )}
                    {product.imageurl ? (
                      <img src={product.imageurl} alt={product.name} className="product-image" />
                    ) : (
                      <div className="product-image-fallback" />
                    )}
                    <button 
                      className={`fav-btn ${favProductIds.includes(product.productid) ? 'active' : ''}`}
                      onClick={(e) => handleToggleFavorite(e, product.productid)}
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(255,255,255,0.8)', border: 'none',
                        borderRadius: '50%', width: '35px', height: '35px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: favProductIds.includes(product.productid) ? '#d81b60' : '#bbb',
                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 5
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <FiHeart fill={favProductIds.includes(product.productid) ? '#d81b60' : 'none'} style={{ fontSize: '18px' }} />
                    </button>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.subtitle || product.description}</p>
                    <div className="product-price">
                      {product.saleprice && product.saleprice < product.baseprice ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '0.9em', fontWeight: 'normal' }}>
                            {product.has_size_l 
                              ? `${formatPrice(product.baseprice)} - ${formatPrice(product.baseprice + 10000)}` 
                              : formatPrice(product.baseprice)}
                          </span>
                          <span style={{ color: '#d81b60', fontWeight: 'bold' }}>
                            {product.has_size_l 
                              ? `${formatPrice(product.saleprice)} - ${formatPrice(product.saleprice + 10000)}` 
                              : formatPrice(product.saleprice)}
                          </span>
                        </div>
                      ) : (
                        product.has_size_l 
                          ? `${formatPrice(product.baseprice)} - ${formatPrice(product.baseprice + 10000)}` 
                          : formatPrice(product.baseprice)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {result.length === 0 && (
              <div className="menu-status empty-status">Không tìm thấy sản phẩm phù hợp.</div>
            )}

            {totalPages > 1 && (
              <div className="pagination-wrapper">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
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

export default SanPham;
