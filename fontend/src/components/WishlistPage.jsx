import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Loader2, Package } from 'lucide-react';
import DetailedProductCard from './DetailedProductCard';
import { API_URL, BACKEND_ORIGIN } from '../config/api';
import EmptyState from './EmptyState';

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

const WishlistPage = ({ currentUser, onBack, onOpenProduct }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!currentUser) { setLoading(false); return; }
      const token = currentUser.token || localStorage.getItem('greencampus_token');
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        const data = await res.json();
        setItems(data.map(item => ({ ...item, image: resolveImage(item.image) })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [currentUser]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <Heart size={22} className="text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">Sản phẩm yêu thích</h1>
        </div>
        {!loading && (
          <span className="ml-auto text-sm text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
            {items.length} sản phẩm
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-green" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16 text-red-500">
          <p className="font-medium">Không thể tải danh sách yêu thích</p>
          <p className="text-sm mt-1 text-red-400">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="Chưa có sản phẩm yêu thích"
          description="Bạn chưa lưu sản phẩm nào. Nhấn vào icon ❤️ trên sản phẩm để lưu vào đây nhé."
          actionText="Khám phá ngay"
          onAction={onBack}
        />
      )}

      {/* Grid */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
          {items.map(product => (
            <DetailedProductCard
              key={product.id}
              product={product}
              onClick={() => onOpenProduct(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
