import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';

const ReportModal = ({ isOpen, onClose, targetType, targetId }) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do báo cáo.');
      return;
    }

    const token = localStorage.getItem('greencampus_token');
    if (!token) {
      setError('Bạn cần đăng nhập để thực hiện chức năng này.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: reason.trim()
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Lỗi khi gửi báo cáo');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <X size={20} />
        </button>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Đã gửi báo cáo</h3>
            <p className="text-gray-500">Cảm ơn bạn đã góp phần xây dựng cộng đồng an toàn. Quản trị viên sẽ xem xét sớm nhất.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Báo cáo vi phạm</h3>
                <p className="text-xs text-gray-500">
                  {targetType === 'ITEM' ? 'Báo cáo sản phẩm này' : targetType === 'POST' ? 'Báo cáo bài viết này' : 'Báo cáo người dùng này'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do báo cáo</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải (ví dụ: lừa đảo, nội dung không phù hợp, hàng giả...)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
                  rows="4"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
