import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const BACKEND_ORIGIN = 'http://localhost:5000';

/** Normalize image_url: if relative path, prefix with backend origin */
const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

// Skeleton card shown while loading
const SkeletonCard = () => (
  <div className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 flex flex-col gap-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  </div>
);

const ProductGrid = ({ onOpenProductModal, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/items`);
        if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [refreshTrigger]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-8 mb-16">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
        <span className="text-brand-green font-medium text-sm md:text-base">
          {!loading && !error && `${products.length} sản phẩm`}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12 text-red-500 bg-red-50 rounded-[16px] border border-red-100">
          <p className="font-semibold">Không thể tải sản phẩm</p>
          <p className="text-sm mt-1 text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Loading skeletons */}
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Real products */}
        {!loading && !error && products.map((product) => (
          <div
            key={product.id}
            onClick={() => onOpenProductModal(product)}
            className="group bg-white rounded-[16px] overflow-hidden shadow-sm hover:shadow-hover transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer"
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
              <img
                src={resolveImage(product.image)}
                alt={product.title}
                className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-110 transition-transform duration-500"
                onError={(e) => { e.target.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image'; }}
              />
              {product.label && (
                <div className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-bold uppercase rounded-md text-white shadow-sm ${product.label === 'Hot' ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {product.label}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button className="bg-white text-brand-green font-semibold py-2 px-5 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  Xem chi tiết
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-medium text-gray-800 text-sm md:text-base line-clamp-2 leading-snug mb-3 flex-1">
                {product.title}
              </h3>
              <div className="mt-auto flex items-center justify-between">
                {product.isFree ? (
                  <span className="inline-block bg-brand-primary text-brand-green font-bold text-xs md:text-sm px-3 py-1 rounded-lg">
                    FREE
                  </span>
                ) : (
                  <span className="font-bold text-gray-900 text-base md:text-lg">
                    {Number(product.price).toLocaleString('vi-VN')} đ
                  </span>
                )}
                <span className={`text-[10px] font-bold ${product.quantity > 0 ? 'text-brand-green' : 'text-red-500'}`}>
                  SL: {product.quantity}
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-brand-green transition-colors text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="col-span-4 text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Chưa có sản phẩm nào.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;

