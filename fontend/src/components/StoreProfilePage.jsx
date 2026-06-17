import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, ChevronLeft, MapPin, Calendar, Share2, MoreHorizontal, Info, AlertTriangle, Package } from 'lucide-react';
import DetailedProductCard from './DetailedProductCard';
import { API_URL } from '../config/api';
import ReportModal from './ReportModal';

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const mockStoreReviews = [
  {
    id: 1,
    name: 'Nguyễn Thu Hà',
    avatar: 'https://ui-avatars.com/api/?name=Thu+Ha&background=E1F0C4&color=2D6A4F',
    rating: 5,
    date: '17/10/2025',
    content: 'Shop rất nhiệt tình, sách còn mới như trong hình. Mình mua combo 3 cuốn giáo trình và được freeship tận phòng KTX. Chắc chắn sẽ quay lại ủng hộ shop!',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop',
    product: 'Combo Sách Toán Cao Cấp'
  },
  {
    id: 2,
    name: 'Trần Minh Khoa',
    avatar: 'https://ui-avatars.com/api/?name=Minh+Khoa&background=dbeafe&color=1e40af',
    rating: 5,
    date: '02/11/2025',
    content: 'Giao dịch nhanh, đúng hẹn. Sách TOEIC format mới 2024 đúng như mô tả, không bị gạch hay highlight. Bạn chủ shop còn tặng thêm bộ từ vựng photo nữa, siêu tốt!',
    image: null,
    product: 'Tài liệu Tiếng Anh Toeic'
  },
  {
    id: 3,
    name: 'Phạm Lan Anh',
    avatar: 'https://ui-avatars.com/api/?name=Lan+Anh&background=fce7f3&color=9d174d',
    rating: 4,
    date: '15/11/2025',
    content: 'Sách Marketing căn bản còn tương đối mới, bìa có hơi cong góc xíu xiu nhưng không ảnh hưởng nội dung. Giá rẻ hơn nhà sách 60%, rất đáng để mua cho sinh viên.',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&h=200&fit=crop',
    product: 'Sách Marketing căn bản'
  },
  {
    id: 4,
    name: 'Lê Quốc Bảo',
    avatar: 'https://ui-avatars.com/api/?name=Quoc+Bao&background=fef9c3&color=713f12',
    rating: 5,
    date: '28/11/2025',
    content: 'Đây là lần thứ 3 mình mua đồ của shop này rồi. Chưa bao giờ thất vọng. Sách luôn đúng tình trạng, đóng gói cẩn thận và giao hàng đúng giờ. 5 sao xứng đáng!',
    image: null,
    product: 'Giáo trình Kỹ năng mềm'
  },
  {
    id: 5,
    name: 'Võ Thị Mai',
    avatar: 'https://ui-avatars.com/api/?name=Thi+Mai&background=dcfce7&color=14532d',
    rating: 5,
    date: '05/12/2025',
    content: 'Shop chủ nhắn tin phản hồi cực kỳ nhanh, dưới 5 phút. Giáo trình Triết học còn nguyên, mình hỏi thêm về nội dung bạn ấy cũng giải thích nhiệt tình. Rất recommend cho các bạn khóa dưới!',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=200&fit=crop',
    product: 'Giáo trình Triết học'
  }
];

const renderStars = (rating) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={14}
        className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
      />
    ))}
  </div>
);

const mockStoreProducts = [
  { id: 201, title: 'Combo Sách Toán Cao Cấp', price: 90000, isFree: false, label: 'Hot', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop', sellerFaculty: 'Take\'s Book', condition: 'Mới 95%' },
  { id: 202, title: 'Tài liệu Tiếng Anh Toeic Format mới', price: 0, isFree: true, label: null, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop', sellerFaculty: 'Take\'s Book', condition: 'Bản photo' },
  { id: 203, title: 'Giáo trình Kỹ năng mềm', price: 30000, isFree: false, label: null, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop', sellerFaculty: 'Take\'s Book', condition: 'Cũ' },
  { id: 204, title: 'Sách Marketing căn bản', price: 55000, isFree: false, label: 'New', image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=400&fit=crop', sellerFaculty: 'Take\'s Book', condition: 'Đã highlight' },
];

const StoreProfilePage = ({ storeData, currentUser, onBack, onOpenProductModal, onMessage }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullStoreData, setFullStoreData] = useState(storeData);
  const [showOptions, setShowOptions] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleToggleFollow = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('greencampus_token');
      const res = await fetch(`${API_URL}/users/${storeData.id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFullStoreData(prev => ({
          ...prev, 
          followerCount: data.isFollowing ? (prev.followerCount || 0) + 1 : Math.max(0, (prev.followerCount || 1) - 1)
        }));
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Real Stats from Backend
  const numFollowers = fullStoreData?.followerCount || 0;
  const ratingAvg = fullStoreData?.ratingAvg || "0.0";
  const responseRate = fullStoreData?.responseRate || 100;

  // Real data for reviews
  const reviews = fullStoreData?.reviews || [];
  const numReviews = reviews.length;

  const isOwnStore = currentUser?.id === storeData?.id;

  useEffect(() => {
    if (storeData?.id) {
      setLoading(true);
      const token = localStorage.getItem('greencampus_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      Promise.all([
        fetch(`${API_URL}/users/${storeData.id}/items`, { headers }).then(res => res.json()),
        fetch(`${API_URL}/users/${storeData.id}`, { headers }).then(res => res.json())
      ])
        .then(([itemsData, userData]) => {
          if (Array.isArray(itemsData)) {
            setProducts(itemsData.map(item => ({...item, image: resolveImage(item.image)})));
          }
          if (userData && !userData.message) {
            setFullStoreData(prev => ({ ...prev, ...userData }));
            if (userData.isFollowing !== undefined) {
              setIsFollowing(userData.isFollowing);
            }
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [storeData?.id]);

  if (!storeData) return null;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Banner */}
      <div className="h-48 md:h-64 w-full relative bg-brand-green/10 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop" 
          alt="Store banner" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBack} 
            className="bg-white/80 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm hover:bg-white transition-colors flex items-center justify-center w-10 h-10"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
           <button className="bg-white/80 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm hover:bg-white transition-colors flex items-center justify-center w-10 h-10">
            <Share2 size={20} />
          </button>
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="bg-white/80 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm hover:bg-white transition-colors flex items-center justify-center w-10 h-10">
              <MoreHorizontal size={20} />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button 
                  onClick={() => { setShowOptions(false); setReportModalOpen(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle size={16} /> Báo cáo người dùng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative -mt-16 md:-mt-20 z-20">
        
        {/* Profile Card */}
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-6 md:items-end">
          <div className="relative">
             <div className="w-24 h-24 md:w-32 md:h-32 bg-brand-primary rounded-full overflow-hidden border-4 border-white shadow-sm flex-shrink-0">
              <img src={resolveImage(fullStoreData?.avatar_url || fullStoreData?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullStoreData?.full_name || fullStoreData?.name || "Người Bán")}&background=E1F0C4&color=2D6A4F`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-brand-green text-white p-1 rounded-full border-2 border-white shadow-sm">
              <ShieldCheck size={16} />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  {fullStoreData?.full_name || fullStoreData?.name || "Người Bán"}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                   {fullStoreData?.university && (
                     <span className="flex items-center gap-1.5"><MapPin size={16}/> {fullStoreData.university}</span>
                   )}
                   <span className="flex items-center gap-1.5"><Package size={16}/> {fullStoreData?.department || 'Chưa cập nhật khoa'}</span>
                   <span className="flex items-center gap-1.5"><Calendar size={16}/> Tham gia {fullStoreData?.created_at ? new Date(fullStoreData.created_at).toLocaleDateString('vi-VN') : 'Gần đây'}</span>
                </div>
              </div>
              
              {!isOwnStore && (
                <div className="flex gap-3 mt-4 md:mt-0">
                  <button 
                    onClick={onMessage}
                    className="flex-1 md:flex-none border-2 border-brand-green text-brand-green font-bold py-2.5 px-6 rounded-[16px] hover:bg-brand-primary/20 transition-colors"
                  >
                    Nhắn tin
                  </button>
                  <button 
                    onClick={handleToggleFollow}
                    className={`flex-1 md:flex-none font-bold py-2.5 px-6 rounded-[16px] transition-colors shadow-sm ${
                      isFollowing 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-brand-green text-white hover:bg-brand-green/90'
                    }`}
                  >
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-6 md:gap-8 pt-6 border-t border-gray-50">
               <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1 font-medium">Người theo dõi</div>
                  <div className="font-bold text-gray-900 text-base md:text-lg">{numFollowers}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1 font-medium">Đánh giá ({numReviews})</div>
                  <div className="font-bold text-gray-900 text-base md:text-lg flex items-center gap-1">
                    {ratingAvg} <Star size={16} className="fill-yellow-500 text-yellow-500" />
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1 font-medium">Tỉ lệ phản hồi</div>
                  <div className="font-bold text-gray-900 text-base md:text-lg">{responseRate}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1 font-medium">Đang bán</div>
                  <div className="font-bold text-gray-900 text-base md:text-lg">{products.length}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs md:text-sm mb-1 font-medium">Đã bán</div>
                  <div className="font-bold text-gray-900 text-base md:text-lg">{fullStoreData?.soldCount || 0}</div>
                </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-4 px-6 font-semibold text-sm md:text-base transition-all relative ${activeTab === 'products' ? 'text-brand-green' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Tất cả sản phẩm
            {activeTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-green rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-6 font-semibold text-sm md:text-base transition-all relative ${activeTab === 'reviews' ? 'text-brand-green' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Đánh giá
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-green rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' ? (
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {products.map(product => (
                <DetailedProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => onOpenProductModal(product)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[16px] border border-gray-100">
              <Info size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Người dùng này chưa có sản phẩm nào đang bán.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {/* Rating summary bar */}
            <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6 mb-2">
              <div className="flex flex-col items-center sm:border-r sm:border-gray-100 sm:pr-6">
                <span className="text-5xl font-bold text-gray-900">{ratingAvg}</span>
                <div className="flex gap-0.5 mt-2 mb-1">{renderStars(Math.round(parseFloat(ratingAvg)))}</div>
                <span className="text-sm text-gray-500 font-medium">{numReviews} đánh giá</span>
              </div>
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const starCount = reviews.filter(r => r.rating === star).length;
                  const percentage = numReviews > 0 ? (starCount / numReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 w-8 text-gray-500 font-medium text-xs">{star} <Star size={10} className="fill-gray-400 text-gray-400" /></div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-6 text-right text-xs text-gray-400 font-medium">{starCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards */}
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                {/* Card Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={resolveImage(review.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=E1F0C4&color=2D6A4F`} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{review.name}</p>
                    <p className="text-xs text-gray-400 font-medium truncate">Đánh giá cửa hàng {storeData.name || "Người Bán"}</p>
                    <p className="text-xs text-gray-400 mt-0.5 italic truncate">Sản phẩm: {review.itemName || "Sản phẩm không rõ"}</p>
                  </div>
                </div>

                {/* Review content */}
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">{review.content || 'Người dùng không để lại bình luận.'}</p>

                {/* Review image */}
                {review.image && (
                  <div className="w-24 h-24 rounded-[10px] overflow-hidden border border-gray-100 flex-shrink-0">
                    <img src={resolveImage(review.image)} alt="Review" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-400 font-medium">{new Date(review.date).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-white rounded-[16px] border border-gray-100">
                <Star size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">Chưa có đánh giá nào.</p>
              </div>
            )}
          </div>
        )}

      </div>
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetType="USER" 
        targetId={fullStoreData?.id || storeData?.id} 
      />
    </div>
  );
};

export default StoreProfilePage;
