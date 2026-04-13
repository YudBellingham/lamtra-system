import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/SanPhamDetail.css";
import BackgroundDecor from "../../components/PageBackground/BackgroundDecor";
import { supabase } from "../../lib/supabase";
import { FaChevronLeft, FaShoppingCart, FaTimes, FaMinus, FaPlus, FaStar } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

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

const SanPhamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart Modal State
  const { addToCart } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'M' | 'L'>('M');
  const [selectedSugar, setSelectedSugar] = useState<'0%' | '50%' | '100%'>('100%');
  const [selectedIce, setSelectedIce] = useState<'0%' | '50%' | '100%'>('100%');
  const [selectedToppings, setSelectedToppings] = useState<{name: string, price: number}[]>([]);
  const [toppingsList, setToppingsList] = useState<{toppingid: number, name: string, price: number}[]>([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: currentProduct, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("productid", id)
          .single();

        if (productError || !currentProduct) {
          throw new Error("Sản phẩm không tồn tại hoặc đã bị xóa.");
        }

        setProduct(currentProduct);

        const { data: catData } = await supabase
          .from("categories")
          .select("name")
          .eq("categoryid", currentProduct.categoryid)
          .single();

        if (catData) {
          setCategoryName(catData.name);
        }

        const { data: toppingsData } = await supabase
          .from("toppings")
          .select("toppingid, name, price")
          .eq("isavailable", true);
          
        setToppingsList(toppingsData || []);

        const { data: relatedData } = await supabase
          .from("products")
          .select("productid, name, subtitle, description, baseprice, saleprice, imageurl, categoryid, label, has_size_l")
          .eq("categoryid", currentProduct.categoryid)
          .neq("productid", currentProduct.productid)
          .limit(4);

        setRelatedProducts(relatedData || []);

        try {
          const revRes = await fetch(`http://localhost:8000/api/reviews/product/${id}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData || []);
          }
        } catch (revErr) {
          console.error("Error fetching reviews:", revErr);
          // Fallback to supabase if API fails? No, user asked for API so we use it.
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const maskName = (name: string) => {
    if (!name) return "Khách hàng ẩn danh";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
       const firstWord = parts[0];
       const lastWord = parts[parts.length - 1];
       return `${firstWord.charAt(0)}***${lastWord}`;
    }
    return `${name.charAt(0)}***`;
  };

  const getInitials = (name: string) => {
    if (!name) return "L";
    return name.charAt(0).toUpperCase();
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const isSale = product?.saleprice && product.saleprice < product.baseprice;
  const effectiveBasePrice = isSale ? product!.saleprice! : (product?.baseprice || 0);

  const currentItemPrice = effectiveBasePrice
    + (selectedSize === 'L' && product?.has_size_l ? 10000 : 0)
    + selectedToppings.reduce((sum, t) => sum + t.price, 0);

  const handleToppingToggle = (topping: {name: string, price: number}) => {
    setSelectedToppings(prev => 
      prev.some(t => t.name === topping.name)
        ? prev.filter(t => t.name !== topping.name)
        : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: `${product.productid}-${selectedSize}-${selectedSugar}-${selectedIce}-${selectedToppings.map(t => t.name).join('-')}-${Date.now()}`,
      productid: product.productid,
      name: product.name,
      imageurl: product.imageurl,
      baseprice: effectiveBasePrice,
      quantity,
      size: selectedSize,
      sugar: selectedSugar,
      ice: selectedIce,
      toppings: selectedToppings,
      itemTotal: currentItemPrice,
      note: note.trim()
    });
    
    setShowModal(false);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <main className="product-detail-page">
      <BackgroundDecor />
      
      <section className="product-detail-section">
        <button className="back-btn" onClick={() => navigate("/san-pham")}>
          <FaChevronLeft /> Quay lại menu
        </button>

        {loading ? (
          <div className="status-container shimmer-bg">
            <h2 className="shimmer-text">Đang tải thông tin sản phẩm...</h2>
          </div>
        ) : error || !product ? (
          <div className="status-container error-container">
            <h2>Oops! Không tìm thấy sản phẩm!</h2>
            <p>{error || "Sản phẩm này hiện không còn khả dụng."}</p>
          </div>
        ) : (
          <>
            <div className="detail-layout">
              <div className="detail-image-col">
                <div className="main-image-wrapper">
                  {product.imageurl ? (
                    <img src={product.imageurl} alt={product.name} className="main-image" />
                  ) : (
                    <div className="main-image-fallback" />
                  )}
                </div>
              </div>
              
              <div className="detail-info-col">
                <div className="detail-badges-row">
                  <span className="detail-category-badge">{categoryName || "Đồ uống"}</span>
                  {product.label && product.label.trim() !== "" && (
                    <span className={`detail-product-badge ${product.label.toLowerCase().replace(' ', '-')}`}>
                      {product.label}
                    </span>
                  )}
                </div>
                <h1 className="detail-product-name">{product.name}</h1>
                
                {product.subtitle && (
                  <h3 className="detail-product-subtitle">{product.subtitle}</h3>
                )}
                
                <div className="detail-price-tag">
                  {product.saleprice && product.saleprice < product.baseprice ? (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'baseline' }}>
                       <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '0.7em', fontWeight: 'normal' }}>
                         {product.has_size_l 
                           ? `${formatPrice(product.baseprice)} - ${formatPrice(product.baseprice + 10000)}` 
                           : formatPrice(product.baseprice)}
                       </span>
                       <span style={{ color: '#d81b60' }}>
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
                
                <div className="detail-description">
                  {product.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <p>Hương vị tuyệt hảo đang chờ bạn khám phá. Tại Lamtra, mỗi thức uống đều được chuẩn bị với trọn vẹn sự tận tâm và nguyên liệu thượng hạng.</p>
                  )}
                </div>

                <button className="btn-order-now" onClick={() => {
                  setSelectedSize('M');
                  setSelectedSugar('100%');
                  setSelectedIce('100%');
                  setSelectedToppings([]);
                  setNote('');
                  setQuantity(1);
                  setShowModal(true);
                }}>
                  <FaShoppingCart /> Thêm vào giỏ
                </button>
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div className="related-products-container">
                <div className="related-header">
                  <span className="related-sub">KHÁM PHÁ THÊM</span>
                  <h2>SẢN PHẨM TƯƠNG TỰ</h2>
                  <div className="related-line"></div>
                </div>

                <div className="related-grid">
                  {relatedProducts.map(relProd => (
                    <div 
                      key={relProd.productid} 
                      className="rel-product-card"
                      onClick={() => navigate(`/san-pham/${relProd.productid}`)}
                    >
                      <div className="rel-image-wrapper">
                        {relProd.imageurl ? (
                          <img src={relProd.imageurl} alt={relProd.name} className="rel-image" />
                        ) : (
                          <div className="rel-image-fallback" />
                        )}
                      </div>
                      <div className="rel-info">
                        {relProd.label && relProd.label.trim() !== "" && (
                          <div className="detail-badges-row">
                            <span className={`detail-product-badge ${relProd.label.toLowerCase().replace(' ', '-')}`}>
                              {relProd.label}
                            </span>
                          </div>
                        )}
                        <h3 className="rel-name">{relProd.name}</h3>
                        <p className="rel-desc">{relProd.subtitle || relProd.description}</p>
                        <div className="rel-price">
                          {relProd.has_size_l 
                            ? `${formatPrice(relProd.baseprice)} - ${formatPrice(relProd.baseprice + 10000)}` 
                            : formatPrice(relProd.baseprice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="reviews-container" style={{ marginTop: '50px', borderTop: '2px dashed #ffeff3', paddingTop: '40px' }}>
              <div className="related-header">
                <span className="related-sub">CỘNG ĐỒNG</span>
                <h2>ĐÁNH GIÁ TỪ KHÁCH HÀNG</h2>
                <div className="related-line"></div>
              </div>

              <div className="reviews-summary" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', background: '#fff0f4', padding: '20px', borderRadius: '15px' }}>
                <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#d81b60' }}>
                  {averageRating} <span style={{ fontSize: '24px', color: '#666' }}>/ 5</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', gap: '5px', color: '#ffc107', fontSize: '20px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar key={star} color={star <= Math.round(Number(averageRating)) ? "#ffc107" : "#e4e5e9"} />
                    ))}
                  </div>
                  <div style={{ color: '#666', fontWeight: 600 }}>{reviews.length} lượt đánh giá</div>
                </div>
              </div>

              <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '30px', background: 'white', borderRadius: '10px' }}>
                    Chưa có đánh giá nào cho sản phẩm này, hãy là người đầu tiên trải nghiệm!
                  </p>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.reviewid} className="review-card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: '1px solid #ffeff3', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', gap: '15px' }}>
                      <div className="review-avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#d81b60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                        {getInitials(rev.customers?.fullname)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <strong style={{ color: '#333' }}>{maskName(rev.customers?.fullname)}</strong>
                          <span style={{ fontSize: '12px', color: '#bbb' }}>{new Date(rev.createdat).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="star-rating" style={{ display: 'flex', gap: '4px', marginBottom: '10px', fontSize: '12px' }}>
                           {[1, 2, 3, 4, 5].map(star => (
                             <FaStar key={star} color={star <= rev.rating ? "#ffc107" : "#e4e5e9"} />
                           ))}
                        </div>
                        <p style={{ margin: 0, color: '#555', lineHeight: '1.6', fontSize: '14px' }}>{rev.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Modal */}
            {showModal && (
              <div className="cart-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="cart-modal" onClick={e => e.stopPropagation()}>
                  <button className="close-modal-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
                  
                  <div className="modal-header">
                    <img src={product.imageurl || ''} alt={product.name} />
                    <div className="modal-header-info">
                      <h3>{product.name}</h3>
                      <p>{formatPrice(product.baseprice)}</p>
                    </div>
                  </div>

                  <div className="modal-body scrollable">
                    <div className="option-section">
                      <h4 className="option-title">Chọn Size {product.has_size_l && <span>(Bắt buộc)</span>}</h4>
                      <div className="option-flex">
                        <button className={`pill-btn ${selectedSize === 'M' ? 'active' : ''}`} onClick={() => setSelectedSize('M')}>
                          Size M
                        </button>
                        {product.has_size_l && (
                          <button className={`pill-btn ${selectedSize === 'L' ? 'active' : ''}`} onClick={() => setSelectedSize('L')}>
                            Size L (+10.000đ)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="option-section">
                      <h4 className="option-title">Lượng Đường</h4>
                      <div className="option-flex">
                        {['0%', '50%', '100%'].map(sugar => (
                          <button key={sugar} className={`pill-btn ${selectedSugar === sugar ? 'active' : ''}`} onClick={() => setSelectedSugar(sugar as any)}>
                            {sugar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="option-section">
                      <h4 className="option-title">Lượng Đá</h4>
                      <div className="option-flex">
                        {['0%', '50%', '100%'].map(ice => (
                          <button key={ice} className={`pill-btn ${selectedIce === ice ? 'active' : ''}`} onClick={() => setSelectedIce(ice as any)}>
                            {ice}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="option-section">
                      <h4 className="option-title">Thêm Topping <span>(Tùy chọn)</span></h4>
                      <div className="topping-list">
                        {toppingsList.map(topping => {
                          const isSelected = selectedToppings.some(t => t.name === topping.name);
                          return (
                            <label key={topping.toppingid} className={`topping-checkbox ${isSelected ? 'active' : ''}`}>
                              <input type="checkbox" checked={isSelected} onChange={() => handleToppingToggle(topping)} />
                              <span className="topping-name">{topping.name}</span>
                              <span className="topping-price">+{formatPrice(topping.price)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="option-section">
                      <h4 className="option-title">Ghi chú thêm <span>(Tùy chọn)</span></h4>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Quán ơi, ít ngọt, không lấy ống hút nhé..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid #e0e0e0',
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '14px',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div className="option-section quantity-section">
                      <h4 className="option-title">Số lượng</h4>
                      <div className="qty-wrapper">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><FaMinus /></button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)}><FaPlus /></button>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="confirm-add-btn" onClick={handleAddToCart}>
                      Thêm vào giỏ hàng - Tổng: {formatPrice(currentItemPrice * quantity)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default SanPhamDetail;
