import React from 'react';
import { X, MessageCircle, Bookmark, MapPin, ShieldCheck, User } from 'lucide-react';

const ProductModal = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur text-gray-800 p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center relative min-h-[300px]">
          <img 
            src={product.image.replace('400x400', '800x800')} 
            alt={product.title} 
            className="w-full h-full object-cover mix-blend-multiply"
          />
          {product.label && (
            <div className={`absolute top-4 left-4 px-3 py-1.5 text-sm font-bold uppercase rounded-lg text-white shadow-md ${product.label === 'Hot' ? 'bg-red-500' : 'bg-blue-500'}`}>
              {product.label}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h2>
            <div className="flex items-center gap-4 mb-4">
              {product.isFree ? (
                <span className="inline-block bg-brand-primary text-brand-green font-bold text-lg px-4 py-1.5 rounded-xl">
                  FREE
                </span>
              ) : (
                <span className="font-bold text-brand-green text-3xl">
                  {product.price.toLocaleString('vi-VN')} đ
                </span>
              )}
              <span className="text-gray-400 text-sm flex items-center gap-1"><MapPin size={16}/> Khu vực KTX</span>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Thông tin người bán</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-brand-green">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Nguyễn Văn A</p>
                  <p className="text-sm text-gray-500">Khoa CNTT - Sinh viên năm 3</p>
                </div>
              </div>
              <div className="text-brand-green flex items-center gap-1 text-sm bg-brand-primary/50 px-2 py-1 rounded-md">
                <ShieldCheck size={16} /> <span className="font-medium">Đã xác thực</span>
              </div>
            </div>
          </div>

          <div className="flex-1 mb-8">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider">Mô tả chi tiết</h3>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Đây là mô tả chi tiết của sản phẩm "{product.title}". Sản phẩm vẫn còn hoạt động tốt, hình thức đẹp. 
              Giao dịch trực tiếp tại khuôn viên trường đại học hoặc Khu Ký túc xá sinh viên. Liên hệ qua tin nhắn để ép giá hoặc hỏi thêm thông tin.
            </p>
          </div>

          <div className="flex gap-3 mt-auto pt-4">
            <button className="flex-1 bg-brand-green text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-brand-green/90 transition-colors shadow-soft flex items-center justify-center gap-2">
              <MessageCircle size={20} /> Nhắn tin ngay
            </button>
            <button className="bg-white border-2 border-gray-200 text-gray-600 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center">
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
