import React from 'react';

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm w-full animate-in fade-in zoom-in-95 duration-500">
      {Icon && (
        <div className="w-24 h-24 bg-gray-50 text-emerald-500/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">{description}</p>}
      
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-[#2D6A4F] text-white font-semibold rounded-xl hover:bg-[#40916C] transition-colors shadow-sm flex items-center gap-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
