import React, { useRef } from 'react';
import { Leaf, Recycle, Wind, Droplets, Zap, Truck, Users, Building2, ShieldCheck, Utensils, ShoppingCart, Globe, ArrowRight } from 'lucide-react';

const GreenLifePage = ({ onGoToFeed }) => {
  const guideRef = useRef(null);

  const scrollToGuide = () => {
    guideRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const principles = [
    { icon: <Recycle size={32} />, title: "Quản lý rác thải", desc: "Tăng cường phân loại, tái chế và giảm thiểu rác thải nhựa tại nguồn." },
    { icon: <Droplets size={32} />, title: "Quản lý nguồn nước", desc: "Tối ưu hóa hệ thống sử dụng nước, thu gom nước mưa và giảm rò rỉ." },
    { icon: <Zap size={32} />, title: "Năng lượng hiệu quả", desc: "Sử dụng các thiết bị tiết kiệm năng lượng và nguồn năng lượng tái tạo." },
    { icon: <Truck size={32} />, title: "Giao thông xanh", desc: "Khuyến khích đi bộ, đi xe đạp và sử dụng phương tiện công cộng." },
    { icon: <Users size={32} />, title: "Bất bình đẳng & Công bằng", desc: "Đảm bảo môi trường học tập và làm việc công bằng cho tất cả mọi người." },
    { icon: <Building2 size={32} />, title: "Tòa nhà & Cảnh quan", desc: "Thiết kế và vận hành các tòa nhà xanh, tăng diện tích cây xanh." },
    { icon: <ShieldCheck size={32} />, title: "An toàn & Sức khỏe", desc: "Tạo dựng môi trường an toàn, lành mạnh cho thể chất và tinh thần." },
    { icon: <Users size={32} />, title: "Dịch vụ hỗ trợ", desc: "Hỗ trợ người khuyết tật và các nhóm yếu thế trong cộng đồng." },
    { icon: <Utensils size={32} />, title: "Ăn uống bền vững", desc: "Cung cấp thực phẩm xanh, sạch và giảm thiểu lãng phí thức ăn." },
    { icon: <ShoppingCart size={32} />, title: "Hoạt động thu mua", desc: "Ưu tiên các sản phẩm thân thiện với môi trường và bền vững." }
  ];

  const pillars = [
    { title: "KHUÔN VIÊN XANH", desc: "Bao gồm các yếu tố cải tiến mỗi ngày như: các tòa nhà xanh, lớp học xanh, lối sống xanh, mua sắm xanh, giao thông xanh...", icon: <Building2 className="text-brand-green" size={40} /> },
    { title: "VẬN HÀNH BỀN VỮNG", desc: "Thông qua 10 khía cạnh chủ đạo của một chiến lược vận hành đại học bền vững toàn diện.", icon: <Recycle className="text-brand-green" size={40} /> },
    { title: "TRUNG HÒA CARBON", desc: "Hành động để giảm lượng phát thải carbon và thực hiện các biện pháp nhằm giảm tổng lượng khí thải nhà kính.", icon: <Wind className="text-brand-green" size={40} /> },
    { title: "NET ZERO CARBON", desc: "Đạt được sự cân bằng giữa nhu cầu sử dụng và giới hạn sinh thái. Cung cấp các giải pháp bền vững cho cộng đồng.", icon: <Globe className="text-brand-green" size={40} /> }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-brand-primary/30 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-primary text-brand-green px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Leaf size={16} /> SỐNG XANH TẠI GREENCAMPUS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Nâng tầm lối sống bền vững <br /> trong cộng đồng sinh viên
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            GreenCampus không chỉ là một sàn thương mại điện tử, mà còn là một dự án "Living Lab" nhằm thúc đẩy các nguyên tắc bền vững vào học tập, nghiên cứu và vận hành đại học.
          </p>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">GreenCampus Living Lab là gì?</h2>
            <div className="h-1 w-20 bg-brand-green mx-auto rounded-full"></div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Chúng tôi thực hiện 10 khía cạnh môi trường nhằm mục đích tổng hợp các nguyên tắc bền vững vào 5 khía cạnh: đào tạo, nghiên cứu, vận hành, quản trị và kết nối cộng đồng.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {principles.map((p, i) => (
              <div key={i} className="flex flex-col items-center text-center group cursor-help">
                <div className="w-20 h-20 rounded-full border-2 border-brand-green flex items-center justify-center text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all duration-300 mb-4 shadow-sm">
                  {p.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-xs md:text-sm leading-tight uppercase">{p.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 px-6 bg-gray-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <img src="https://www.transparenttextures.com/patterns/leaf.png" alt="" className="w-full h-full object-cover" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">FROM CIRCULAR TO NET ZERO CAMPUS</h2>
            <p className="text-gray-600">Lộ trình chuyển đổi từ mô hình kinh tế tuần hoàn đến khuôn viên trung hòa carbon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <div key={i} className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                <div className="mb-6 p-4 bg-brand-primary/20 rounded-2xl group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <h3 className="font-bold text-brand-green text-lg mb-4">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                  {p.desc}
                </p>
                <div className="text-brand-green font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tìm hiểu thêm <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-brand-green rounded-[32px] p-8 md:p-12 text-center text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold">Hãy bắt đầu hành động xanh ngay hôm nay!</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Bằng cách trao đổi món đồ cũ trên GreenCampus, bạn đang góp phần giảm thiểu rác thải và kéo dài vòng đời sản phẩm. Mỗi giao dịch là một bước tiến tới tương lai bền vững.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
             <button 
                onClick={onGoToFeed}
                className="bg-white text-brand-green font-bold py-4 px-10 rounded-2xl hover:bg-brand-primary transition-all shadow-lg"
             >
                Đăng tin ngay
             </button>
             <button 
                onClick={scrollToGuide}
                className="bg-brand-green border-2 border-white/30 text-white font-bold py-4 px-10 rounded-2xl hover:bg-white/10 transition-all"
              >
                Xem hướng dẫn
              </button>
          </div>
        </div>
      </section>
      {/* Instructions Section (Ảnh 2 Style) */}
      <section ref={guideRef} className="py-24 px-6 bg-[#1a1a1a] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Hướng dẫn đăng bán hiệu quả</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Lựa chọn phương thức phù hợp với nhu cầu của bạn để bắt đầu hành trình kinh doanh xanh.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1: Cá nhân */}
            <div className="bg-[#242424] p-10 rounded-[32px] space-y-6 border border-white/5 hover:border-brand-green/30 transition-all group relative overflow-hidden">
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Users size={40} />
              </div>
              <div className="space-y-2">
                <span className="text-brand-green font-bold text-sm uppercase tracking-widest">Cách 1</span>
                <h3 className="text-2xl font-bold group-hover:text-brand-primary transition-colors">Đăng tin cá nhân (Bán nhanh)</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Phù hợp cho các bạn sinh viên muốn thanh lý giáo trình, đồ dùng cũ với số lượng ít. Thủ tục nhanh gọn, hiển thị ngay lập tức trên bản tin cộng đồng.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Không cần đăng ký cửa hàng</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Thao tác chỉ mất 30 giây</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Tiếp cận khách hàng nhanh chóng</li>
              </ul>
            </div>

            {/* Step 2: Cửa hàng */}
            <div className="bg-[#242424] p-10 rounded-[32px] space-y-6 border border-white/5 hover:border-brand-green/30 transition-all group relative overflow-hidden">
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity text-brand-green">
                <Zap size={40} />
              </div>
              <div className="space-y-2">
                <span className="text-brand-green font-bold text-sm uppercase tracking-widest">Cách 2</span>
                <h3 className="text-2xl font-bold group-hover:text-brand-primary transition-colors">Tạo cửa hàng (Kinh doanh lâu dài)</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Dành cho các bạn có nhiều mặt hàng, muốn xây dựng thương hiệu cá nhân và quản lý chuyên nghiệp. Shop của bạn sẽ có trang cá nhân riêng và danh mục sản phẩm rõ ràng.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Quản lý kho hàng tập trung</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Tăng độ uy tín với khách hàng</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div> Theo dõi doanh thu và lượt xem</li>
              </ul>
            </div>
          </div>

          {/* Step 3: Wide Card */}
          <div className="bg-gradient-to-br from-[#242424] to-[#1e1e1e] p-10 md:p-12 rounded-[40px] border border-white/5 flex flex-col md:flex-row items-center gap-12 group">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <span className="text-brand-green font-bold text-sm uppercase tracking-widest">Bước cuối</span>
                <h3 className="text-3xl font-bold group-hover:text-brand-primary transition-colors">Hoàn thiện hồ sơ & Bắt đầu</h3>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                Dù bạn chọn cách nào, việc cung cấp đầy đủ thông tin mô tả, ảnh thật rõ nét và giá cả hợp lý sẽ giúp sản phẩm của bạn thu hút hơn 80% so với tin đăng thông thường.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button className="bg-brand-green text-white font-bold py-3 px-8 rounded-xl hover:bg-brand-green/80 transition-all flex items-center gap-2">
                  <Leaf size={18} /> Bắt đầu ngay
                </button>
                <button className="bg-white/10 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/20 transition-all">
                  Chính sách bán hàng
                </button>
              </div>
            </div>
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <img 
                        src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop" 
                        alt="Sustainable" 
                        className="rounded-3xl shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-brand-green/20 rounded-3xl mix-blend-overlay"></div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GreenLifePage;
