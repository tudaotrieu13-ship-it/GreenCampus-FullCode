import React from 'react';
import { BookOpen, Package, PenTool, Gift } from 'lucide-react';

const categories = [
  { id: 1, name: 'Sách giáo trình', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
  { id: 2, name: 'Đồ dùng KTX', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
  { id: 3, name: 'Đồ dùng học tập', icon: PenTool, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
  { id: 'free', name: 'Đồ miễn phí', icon: Gift, color: 'text-brand-green', bg: 'bg-brand-primary hover:bg-[#d0e6ac]' },
];

const QuickActions = ({ onSelectCategory }) => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Khám phá danh mục</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.name, category.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-[16px] transition-colors duration-300 shadow-sm border border-transparent hover:border-gray-100 ${category.bg}`}
            >
              <Icon size={36} className={`${category.color} mb-3`} />
              <span className="font-semibold text-gray-800 text-center">{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActions;
