import React from 'react';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
                <Leaf size={24} />
              </div>
              <span className="text-2xl font-black text-gray-800 tracking-tight">Green<span className="text-emerald-600">Campus</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Nền tảng giao thương, tái sử dụng và chia sẻ đồ dùng dành riêng cho sinh viên. Cùng nhau xây dựng một môi trường đại học xanh và bền vững.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"><Facebook size={16} /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"><Instagram size={16} /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"><Twitter size={16} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-wider">Khám phá</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Trang chủ</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Thị trường mua bán</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Bản tin cộng đồng</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Sinh viên sống xanh</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-wider">Chính sách</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Hướng dẫn an toàn</a></li>
              <li><a href="#" className="text-gray-500 hover:text-emerald-600 text-sm transition-colors">Quy định đổi trả</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-wider">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-500 text-sm">
                <MapPin size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Khu đô thị Đại học Quốc gia, Thủ Đức, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 text-sm">
                <Phone size={18} className="text-emerald-600 flex-shrink-0" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center gap-3 text-gray-500 text-sm">
                <Mail size={18} className="text-emerald-600 flex-shrink-0" />
                <span>support@greencampus.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} GreenCampus. Đồ án tốt nghiệp.
          </p>
          <div className="flex gap-4">
            <span className="text-gray-400 text-sm hover:text-gray-600 cursor-pointer">Tiếng Việt</span>
            <span className="text-gray-400 text-sm hover:text-gray-600 cursor-pointer">English</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
