import React, { useState } from 'react';
import {
  ShoppingCart, Trash2, ChevronLeft, ShoppingBag,
  Plus, Minus, CheckCircle2, Package
} from 'lucide-react';

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const CartPage = ({ cartItems, onUpdateCart, onRemoveItem, onBack, onCheckout, onContinueShopping }) => {
  const [selected, setSelected] = useState(cartItems.map(item => item.cartId));

  const toggleSelect = (cartId) => {
    setSelected(prev =>
      prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === cartItems.length) {
      setSelected([]);
    } else {
      setSelected(cartItems.map(i => i.cartId));
    }
  };

  const handleQtyChange = (cartId, delta) => {
    const item = cartItems.find(i => i.cartId === cartId);
    if (!item) return;
    const newQty = (item.qty || 1) + delta;
    if (newQty < 1) return;
    onUpdateCart(cartId, newQty);
  };

  const selectedItems = cartItems.filter(i => selected.includes(i.cartId));
  const subtotal = selectedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const selectedCount = selectedItems.reduce((s, i) => s + (i.qty || 1), 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-gray-50">
        <div className="w-24 h-24 bg-[#E1F0C4] rounded-full flex items-center justify-center mb-4 mx-auto">
          <ShoppingCart size={40} className="text-[#2D6A4F]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm.</p>
        <button
          onClick={onContinueShopping}
          className="bg-[#2D6A4F] hover:bg-[#40916C] text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2"
        >
          <ShoppingBag size={18} /> Khám phá sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2D6A4F] font-medium transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
            <span className="bg-[#2D6A4F] text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {cartItems.length}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {/* Select all */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.length === cartItems.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#2D6A4F] rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Chọn tất cả ({cartItems.length} sản phẩm)</span>
            </div>

            {/* Items */}
            {cartItems.map(item => (
              <div
                key={item.cartId}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                  selected.includes(item.cartId) ? 'border-[#2D6A4F]/30' : 'border-gray-100'
                }`}
              >
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.cartId)}
                    onChange={() => toggleSelect(item.cartId)}
                    className="w-4 h-4 accent-[#2D6A4F] mt-1 flex-shrink-0 rounded"
                  />

                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                    <img
                      src={resolveImage(item.image || item.image_url)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Người bán: {item.full_name || 'Người bán'}</p>
                        {item.condition && (
                          <span className="inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-1 font-medium">
                            {item.condition}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty control */}
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleQtyChange(item.cartId, -1)}
                          disabled={item.qty <= 1}
                          className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm text-gray-600 hover:text-[#2D6A4F] disabled:opacity-40 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold text-gray-900 w-6 text-center">{item.qty || 1}</span>
                        <button
                          onClick={() => handleQtyChange(item.cartId, 1)}
                          className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm text-gray-600 hover:text-[#2D6A4F] transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.price === 0 ? (
                          <span className="font-bold text-[#2D6A4F] text-sm">Miễn phí</span>
                        ) : (
                          <span className="font-bold text-[#2D6A4F] text-base">
                            {((item.price || 0) * (item.qty || 1)).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Tổng đơn hàng</h3>

              <div className="space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sản phẩm đã chọn</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-[#2D6A4F]">Miễn phí</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-[#2D6A4F] text-xl">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button
                onClick={() => onCheckout(selectedItems)}
                disabled={selectedItems.length === 0}
                className="w-full bg-[#2D6A4F] hover:bg-[#40916C] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#2D6A4F]/20"
              >
                <CheckCircle2 size={18} />
                Mua hàng ({selectedItems.length})
              </button>

              <button
                onClick={onContinueShopping}
                className="w-full mt-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Package size={16} /> Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs text-gray-500">Tổng ({selectedCount} sp)</p>
          <p className="font-bold text-[#2D6A4F] text-lg">{subtotal.toLocaleString('vi-VN')}đ</p>
        </div>
        <button
          onClick={() => onCheckout(selectedItems)}
          disabled={selectedItems.length === 0}
          className="bg-[#2D6A4F] hover:bg-[#40916C] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          Mua hàng ({selectedItems.length})
        </button>
      </div>
    </div>
  );
};

export default CartPage;
