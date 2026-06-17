import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Rất tiếc, đã có lỗi xảy ra!</h2>
          <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
            Hệ thống đang gặp sự cố khi hiển thị trang này. Bạn có thể tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Tải lại trang
            </button>
            <button 
              onClick={() => { window.location.href = '/'; }} 
              className="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
            >
              Về trang chủ
            </button>
          </div>
          <details className="mt-12 max-w-2xl text-left bg-white p-4 rounded-xl border border-red-100 shadow-sm w-full cursor-pointer">
            <summary className="text-sm font-semibold text-red-600 focus:outline-none">Xem chi tiết lỗi (Dành cho nhà phát triển)</summary>
            <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
