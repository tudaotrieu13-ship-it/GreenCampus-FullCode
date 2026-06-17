import React from 'react';
import { Leaf, Book, Monitor, Coffee, Package } from 'lucide-react';

const Hero = ({ onSelectCategory }) => {
  return (
    <section className="w-full bg-brand-primary py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="text-5xl md:text-[60px] leading-tight font-bold text-gray-900 font-sans tracking-tight">
            Trao đồ cũ – <br className="hidden md:block" />
            Nhận giá trị mới
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-lg mx-auto md:mx-0">
            Nền tảng mua bán, trao đổi và tặng đồ dùng học tập, đồ điện tử dành riêng cho cộng đồng sinh viên. Nhanh chóng, tiết kiệm và thân thiện với môi trường!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
            <button
              onClick={() => onSelectCategory('Tất cả danh mục')}
              className="bg-transparent border-2 border-brand-green text-brand-green font-semibold py-3 px-8 rounded-[16px] hover:bg-brand-green/10 transition-all duration-300 w-full sm:w-auto"
            >
              Xem đồ cũ
            </button>
          </div>
        </div>

        {/* Right Content - Clean Placeholder Illustration */}
        <div className="flex-1 w-full max-w-md relative">
          <div className="aspect-square bg-white/40 rounded-full absolute -top-10 -right-10 blur-3xl"></div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div 
              onClick={() => onSelectCategory('Sách giáo trình', 1)}
              className="bg-white p-6 rounded-[16px] shadow-soft flex flex-col items-center justify-center aspect-square transform -rotate-3 hover:rotate-0 transition-all duration-300 cursor-pointer"
            >
              <Book size={48} className="text-brand-green mb-3" />
              <span className="font-semibold text-gray-800 text-center">Giáo trình</span>
            </div>
            <div 
              onClick={() => onSelectCategory('Đồ dùng KTX', 2)}
              className="bg-white p-6 rounded-[16px] shadow-soft flex flex-col items-center justify-center aspect-square transform translate-y-6 rotate-3 hover:rotate-0 transition-all duration-300 cursor-pointer"
            >
              <Package size={48} className="text-brand-green mb-3" />
              <span className="font-semibold text-gray-800 text-center">Đồ dùng KTX</span>
            </div>
            <div 
              onClick={() => onSelectCategory('Sống xanh')}
              className="bg-brand-green p-6 rounded-[16px] shadow-soft flex flex-col items-center justify-center aspect-square transform -translate-y-2 -rotate-2 hover:rotate-0 transition-all duration-300 cursor-pointer"
            >
              <Leaf size={48} className="text-brand-primary mb-3" />
              <span className="font-semibold text-white text-center">Sống xanh</span>
            </div>
            <div 
              onClick={() => onSelectCategory('Giao lưu')}
              className="bg-white p-6 rounded-[16px] shadow-soft flex flex-col items-center justify-center aspect-square transform translate-y-4 hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            >
              <Coffee size={48} className="text-brand-green mb-3" />
              <span className="font-semibold text-gray-800 text-center">Giao lưu</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
