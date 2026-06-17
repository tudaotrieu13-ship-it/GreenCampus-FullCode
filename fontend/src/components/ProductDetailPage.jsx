import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquare, ShoppingCart, Store, ChevronRight, CheckCircle2, ChevronLeft, Zap, Check, Loader2, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config/api';
import ReportModal from './ReportModal';

const renderStars = (rating) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={14} 
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
        />
      ))}
    </div>
  );
};

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const ProductDetailPage = ({ product, currentUser, onBack, onOpenStore, onMessage, onBuy, onAddToCart }) => {
  const isOwnProduct = currentUser?.id === product?.user_id;
  const [otherProducts, setOtherProducts] = useState([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [images, setImages] = useState([]);
  const [mainImage, setMainImage] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  useEffect(() => {
    if (!product?.id) return;
    
    setMainImage(product.image || product.image_url);
    setImages([product.image || product.image_url]);

    fetch(`${API_URL}/items/${product.id}/images`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setImages(data);
          setMainImage(data[0]);
        }
      })
      .catch(err => console.error(err));

    setLoadingReviews(true);
    fetch(`${API_URL}/ratings/item/${product.id}`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [product?.id]);

  useEffect(() => {
    if (product?.user_id) {
      fetch(`${API_URL}/users/${product.user_id}/items`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const filtered = data.filter(item => item.id !== product.id).slice(0, 4);
            setOtherProducts(filtered.map(item => ({...item, image: resolveImage(item.image)})));
          }
        })
        .catch(err => console.error(err));
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-80px)] py-8 pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={onBack} className="hover:text-brand-green flex items-center gap-1 font-medium transition-colors">
              <ChevronLeft size={16} /> Quay lại
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-bold truncate">Chi tiết sản phẩm</span>
          </div>
          <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
            <AlertTriangle size={14} /> Báo cáo
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Image */}
          <div className="w-full lg:w-5/12">
            <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100 sticky top-24">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative mb-4">
                <img 
                  src={resolveImage(mainImage)} 
                  alt={product.title} 
                  className="w-full h-full object-contain"
                />
                {product.label && (
                  <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase rounded text-white shadow-sm ${product.label === 'Hot' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {product.label}
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        mainImage === img ? 'border-brand-green' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <img src={resolveImage(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Sections */}
          <div className="w-full lg:w-7/12 flex flex-col gap-6">
            
            {/* Main Product Info */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4">
                {product.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-8">
                {product.price === 0 ? (
                  <span className="inline-block bg-brand-primary text-brand-green font-bold text-2xl md:text-3xl px-4 py-1.5 rounded-lg">
                    FREE
                  </span>
                ) : (
                  <span className="font-bold text-brand-green text-3xl md:text-4xl">
                    {Number(product.price).toLocaleString('vi-VN')} đ
                  </span>
                )}
                <span className="text-sm bg-gray-50 text-gray-600 px-3 py-1.5 rounded-md font-medium border border-gray-100">
                  {product.condition || 'Mới 90%'}
                </span>
              </div>

              {!isOwnProduct && (
                <div className="flex flex-col gap-3">
                  {/* Row 1: Nhắn tin */}
                  <button onClick={onMessage} className="w-full bg-brand-primary text-brand-green font-bold py-3.5 px-6 rounded-[16px] hover:bg-[#d0e6ac] transition-colors flex items-center justify-center gap-2 text-sm md:text-base">
                    <MessageSquare size={20} /> Nhắn tin với người bán
                  </button>

                  {/* Row 2: Thêm vào giỏ & Mua ngay */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 || product.status === 'SOLD'}
                      className={`flex-1 font-bold py-3.5 px-4 rounded-[16px] border-2 transition-all flex items-center justify-center gap-2 text-sm ${
                        (product.quantity <= 0 || product.status === 'SOLD')
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : addedToCart
                          ? 'border-brand-green bg-[#E1F0C4] text-brand-green'
                          : 'border-brand-green text-brand-green hover:bg-[#E1F0C4]'
                      }`}
                    >
                      {addedToCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                      {addedToCart ? 'Đã thêm!' : 'Giỏ hàng'}
                    </button>

                    <button
                      onClick={onBuy}
                      disabled={product.quantity <= 0 || product.status === 'SOLD'}
                      className={`flex-1 font-bold py-3.5 px-4 rounded-[16px] transition-colors shadow-sm flex items-center justify-center gap-2 text-sm ${
                        (product.quantity <= 0 || product.status === 'SOLD')
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-brand-green/30'
                      }`}
                    >
                      <Zap size={18} />
                      {product.quantity <= 0 || product.status === 'SOLD' ? 'Hết hàng' : 'Mua ngay'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info Box */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={onOpenStore}
                    className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer"
                  >
                    <img src={resolveImage(product.avatar_url || product.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.full_name || product.sellerName || "Người Bán")}&background=E1F0C4&color=2D6A4F`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base md:text-lg">{product.full_name || "Người Bán"}</h3>
                      <ShieldCheck size={18} className="text-brand-green" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500">
                      <div className="flex items-center text-yellow-500 font-medium">
                        <Star size={14} className="fill-current mr-1" /> 5.0
                      </div>
                      <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                      <span className="text-brand-green font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} /> Đã xác minh
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onOpenStore}
                  className="w-full sm:w-auto border border-gray-200 text-gray-700 font-medium py-2 px-4 rounded-[12px] hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"
                >
                  <Store size={18} /> Xem shop
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1">Đã bán</div>
                  <div className="font-bold text-gray-900 text-sm md:text-base">{product.soldCount || 0}</div>
                </div>
                <div className="border-l border-r border-gray-100">
                  <div className="text-gray-500 text-xs md:text-sm mb-1">Phản hồi</div>
                  <div className="font-bold text-gray-900 text-sm md:text-base">98%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1">Thành viên từ</div>
                  <div className="font-bold text-gray-900 text-sm md:text-base">
                    {product.sellerJoined ? new Date(product.sellerJoined).getFullYear() : 'Gần đây'}
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted Info */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin nổi bật</h3>
              <div className="border border-gray-100 rounded-[12px] overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <div className="w-1/3 bg-gray-50/50 p-3 md:p-4 text-xs md:text-sm font-medium text-gray-600">Danh mục</div>
                  <div className="w-2/3 p-3 md:p-4 text-xs md:text-sm text-gray-800 font-medium">{product.sellerDepartment || product.sellerFaculty || 'Sách giáo trình'}</div>
                </div>
                <div className="flex border-b border-gray-100">
                  <div className="w-1/3 bg-gray-50/50 p-3 md:p-4 text-xs md:text-sm font-medium text-gray-600">Phí vận chuyển</div>
                  <div className="w-2/3 p-3 md:p-4 text-xs md:text-sm text-gray-800 flex items-center gap-2">
                    <span className="bg-brand-primary/50 text-brand-green px-2.5 py-1 rounded-md text-xs font-bold">Freeship KTX</span>
                  </div>
                </div>
                <div className="flex border-b border-gray-100">
                  <div className="w-1/3 bg-gray-50/50 p-3 md:p-4 text-xs md:text-sm font-medium text-gray-600">Tình trạng</div>
                  <div className="w-2/3 p-3 md:p-4 text-xs md:text-sm text-gray-800 font-medium">{product.condition || 'Mới 90%'}</div>
                </div>
                <div className="flex">
                  <div className="w-1/3 bg-gray-50/50 p-3 md:p-4 text-xs md:text-sm font-medium text-gray-600">Số lượng</div>
                  <div className="w-2/3 p-3 md:p-4 text-xs md:text-sm text-gray-800 font-medium">
                    {product.quantity > 0 ? (
                      <span className="text-brand-green font-bold">{product.quantity} sản phẩm có sẵn</span>
                    ) : (
                      <span className="text-red-500 font-bold">Đã hết hàng</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Mô tả sản phẩm</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4 mb-6">
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Tên sản phẩm</span>
                  <span className="font-medium text-gray-900 line-clamp-1">{product.title}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Tình trạng</span>
                  <span className="font-medium text-gray-900">{product.condition || 'Mới 90%'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Người bán</span>
                  <span className="font-medium text-gray-900 line-clamp-1">{product.full_name || 'Người bán'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Ngày đăng</span>
                  <span className="font-medium text-gray-900">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                  </span>
                </div>
              </div>

              <div className="text-gray-700 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
                {product.content || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Đánh giá sản phẩm</h3>
                <span className="text-xs text-gray-400">Đánh giá sau khi hoàn tất giao dịch trong Lịch sử</span>
              </div>

              {loadingReviews ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-brand-green" size={28} />
                </div>
              ) : (
                <>
                  {/* Rating Summary */}
                  {reviews.length > 0 && (() => {
                    const total = reviews.length;
                    const avg = (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
                    return (
                      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-gray-50 rounded-[12px] border border-gray-100">
                        <div className="flex flex-col items-center justify-center sm:w-1/3 border-b sm:border-b-0 sm:border-r border-gray-200 pb-4 sm:pb-0 sm:pr-6">
                          <div className="text-4xl font-bold text-gray-900 mb-2">{avg}<span className="text-xl text-gray-500 font-medium">/5</span></div>
                          {renderStars(Math.round(avg))}
                          <div className="text-sm text-gray-500 mt-2 font-medium">{total} đánh giá</div>
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          {[5, 4, 3, 2, 1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1 w-10 text-gray-600 font-medium">{star} <Star size={12} className="fill-gray-400 text-gray-400" /></div>
                                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="w-8 text-right text-gray-500 text-xs font-medium">{count}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Review List */}
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map(review => (
                        <div key={review.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-primary border border-gray-100 flex-shrink-0">
                              <img
                                src={resolveImage(review.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user_name || 'User')}&background=E1F0C4&color=2D6A4F`}
                                alt={review.user_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{review.user_name}</span>
                                <span className="text-[10px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> Đã mua
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {renderStars(review.rating)}
                                <span className="text-xs text-gray-400 font-medium">
                                  {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-8">Chưa có đánh giá nào cho sản phẩm này.</p>
                  )}
                </>
              )}
            </div>

            {/* Other Products Section */}
            <div className="bg-white p-6 md:p-8 rounded-[16px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Sản phẩm khác của shop</h3>
                <button 
                  onClick={onOpenStore}
                  className="text-brand-green font-semibold hover:underline text-sm flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherProducts.length > 0 ? (
                  otherProducts.map(item => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="relative aspect-square bg-gray-50 rounded-[12px] overflow-hidden mb-3 border border-gray-100">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {item.price === 0 && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase">Freeship</div>}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-green">
                          <Store size={12} />
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-800 text-xs md:text-sm line-clamp-2 mb-1">{item.title}</h4>
                      {item.price === 0 ? (
                        <span className="text-xs font-bold text-brand-green bg-brand-primary px-1.5 py-0.5 rounded">FREE</span>
                      ) : (
                        <span className="font-bold text-gray-900 text-sm">{item.price?.toLocaleString('vi-VN')} đ</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-4 text-center py-6">Shop chưa có sản phẩm nào khác.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetType="ITEM" 
        targetId={product.id} 
      />
    </div>
  );
};

export default ProductDetailPage;
