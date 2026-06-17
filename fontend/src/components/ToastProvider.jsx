import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirmAction = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}
      
      {/* Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[20px] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận</h3>
            <p className="text-gray-600 mb-6">{confirmState.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleConfirmAction(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleConfirmAction(true)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-brand-green hover:bg-brand-green/90 shadow-lg shadow-brand-green/20 transition-colors"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="animate-in slide-in-from-right-full fade-in duration-300 flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 min-w-[280px]"
          >
            {t.type === 'success' ? (
              <CheckCircle2 size={20} className="text-[#2D6A4F] flex-shrink-0" />
            ) : (
              <XCircle size={20} className="text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold text-gray-800 flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
