import React, { useState } from 'react';
import { ShieldCheck, Heart } from 'lucide-react';
import { API_URL } from '../config/api';

const getWishedSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem('greencampus_wished') || '[]')); } catch { return new Set(); }
};
const saveWishedSet = (set) => {
  localStorage.setItem('greencampus_wished', JSON.stringify([...set]));
};

const DetailedProductCard = ({ product, onClick }) => {
  const [wished, setWished] = useState(() => getWishedSet().has(product.id));

  const handleToggleWish = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;

    const next = !wished;
    setWished(next);
    const set = getWishedSet();
    if (next) set.add(product.id); else set.delete(product.id);
    saveWishedSet(set);

    try {
      const res = await fetch(`${API_URL}/wishlist/${product.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        // revert on failure
        setWished(!next);
        const s = getWishedSet();
        if (!next) s.add(product.id); else s.delete(product.id);
        saveWishedSet(s);
      }
    } catch {
      setWished(!next);
    }
  };

  const isLoggedIn = Boolean(localStorage.getItem('greencampus_token'));

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[16px] overflow-hidden shadow-sm hover:shadow-hover border border-gray-100 flex flex-col cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden border-b border-gray-100">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.label && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white shadow-sm ${product.label === 'Hot' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {product.label}
          </div>
        )}
        {isLoggedIn && (
          <button
            onClick={handleToggleWish}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all ${wished ? 'bg-red-500' : 'bg-white/90 hover:bg-red-50'}`}
            title={wished ? 'Bỏ yêu thích' : 'Yêu thích'}
          >
            <Heart size={14} className={wished ? 'fill-white text-white' : 'text-gray-400'} />
          </button>
        )}
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-medium text-gray-800 text-sm md:text-base line-clamp-2 leading-snug mb-2 flex-1">
          {product.title}
        </h3>

        <div className="mt-auto mb-2 flex items-center justify-between">
          {product.isFree ? (
            <span className="inline-block bg-brand-primary text-brand-green font-bold text-xs px-2 py-1 rounded-md">FREE</span>
          ) : (
            <span className="font-bold text-gray-900 text-base md:text-lg">
              {Number(product.price).toLocaleString('vi-VN')} đ
            </span>
          )}
          <span className={`text-[10px] font-bold ${product.quantity > 0 ? 'text-brand-green' : 'text-red-500'}`}>
            SL: {product.quantity}
          </span>
        </div>

        <div className="border-t border-gray-50 pt-2.5 mt-1 flex flex-col gap-1.5 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span className={`truncate max-w-[130px] font-bold ${(() => {
              try {
                const user = JSON.parse(localStorage.getItem('greencampus_user') || 'null');
                return user && user.id === product.user_id;
              } catch { return false; }
            })() ? 'text-brand-green' : 'text-gray-700'}`}>
              {(() => {
                try {
                  const user = JSON.parse(localStorage.getItem('greencampus_user') || 'null');
                  if (user && user.id === product.user_id) return 'Của bạn';
                } catch {}
                return product.full_name || 'Người bán';
              })()}
            </span>
            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap">{product.condition || 'Mới 90%'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-brand-green flex-shrink-0">
              <ShieldCheck size={10} />
            </div>
            <span className="truncate max-w-[150px] font-medium text-gray-500">
              {product.sellerDepartment || product.sellerFaculty || 'Khoa CNTT'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedProductCard;
