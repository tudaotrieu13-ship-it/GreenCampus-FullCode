import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { API_URL } from '../config/api';

const getAvatarUrl = (name, url) => {
  if (url && (url.startsWith('http') || url.startsWith('blob:'))) return url;
  if (url) return `http://localhost:5000${url}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`;
};

const CreatePostBox = ({ onPostSuccess }) => {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSale, setIsSale] = useState(false);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isModerated, setIsModerated] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  
  const fileInputRef = useRef(null);

  // Parse user info safely
  let user = null;
  try {
    const s = localStorage.getItem('greencampus_user');
    if (s) user = JSON.parse(s);
  } catch (e) {}

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const slotsLeft = 4 - imageFiles.length;
    const filesToAdd = files.slice(0, slotsLeft);
    
    const validFiles = filesToAdd.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        setError('Kích thước một số ảnh vượt quá 5MB và bị loại bỏ');
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;

    setImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
    if (!error.includes('Kích thước')) setError('');
  };

  useEffect(() => {
    setIsModerated(false);
    setError('');
  }, [content, imagePreviews]);

  const formatPrice = (val) => {
    const numericValue = val.replace(/\D/g, '');
    if (!numericValue) return '';
    // Limit to 9 digits (max ~999 million)
    const limitedValue = numericValue.substring(0, 9);
    return parseInt(limitedValue).toLocaleString('vi-VN');
  };

  const handlePriceChange = (e) => {
    setPrice(formatPrice(e.target.value));
  };

  const handleModerate = async (e) => {
    e.preventDefault();
    if (!content.trim() && imagePreviews.length === 0) return;
    
    setIsModerating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('greencampus_token');
      if (!token) {
        setError('Vui lòng đăng nhập để thực hiện chức năng này.');
        setIsModerating(false);
        return;
      }
      const res = await fetch(`http://localhost:5000/api/ai/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: content, imagesBase64: imagePreviews })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi kiểm duyệt');
      
      if (data.isSafe === false) {
        setError(`Vi phạm: ${data.reason}`);
        setIsModerated(false);
      } else {
        setIsModerated(true);
      }
    } catch (err) {
      console.error(err);
      setError('Hệ thống kiểm duyệt lỗi. Vui lòng thử lại.');
      setIsModerated(false);
    } finally {
      setIsModerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0) return;

    const token = localStorage.getItem('greencampus_token');
    if (!token) {
      setError('Vui lòng đăng nhập để đăng bài.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content);
      
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      if (isSale) {
        formData.append('post_type', 'SALE');
        if (price) {
          const rawPrice = price.replace(/\D/g, '');
          formData.append('price', rawPrice);
        }
      } else {
        formData.append('post_type', 'NORMAL');
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi đăng bài');
      }

      setContent('');
      setImageFiles([]);
      setImagePreviews([]);
      setIsSale(false);
      setPrice('');
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      if (onPostSuccess) onPostSuccess(data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 z-50 whitespace-nowrap">
          <CheckCircle size={18} /> Đăng bài thành công!
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-brand-primary rounded-full overflow-hidden flex-shrink-0">
          <img
            src={getAvatarUrl(user?.full_name || user?.name, user?.avatar_url || user?.avatar)}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="Bạn đang nghĩ gì?"
          rows={1}
          style={{ minHeight: '44px' }}
          className="flex-1 resize-none bg-gray-50 border border-transparent hover:border-gray-200 focus:border-brand-primary focus:bg-white rounded-2xl px-4 py-2.5 text-sm md:text-base text-gray-800 transition-all outline-none"
        />
      </div>

      {imagePreviews.length > 0 && (
        <div className="mt-3 ml-13 flex flex-wrap gap-2">
          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative w-24 h-24 sm:w-32 sm:h-32">
              <img src={preview} alt="Preview" className="w-full h-full rounded-lg object-cover border border-gray-200" />
              <button
                onClick={() => {
                  setImageFiles(prev => prev.filter((_, i) => i !== idx));
                  setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                }}
                className="absolute -top-2 -right-2 bg-white text-gray-600 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {isSale && (
        <div className="mt-3 ml-13 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Giá bán (VNĐ):</label>
          <input
            type="text"
            value={price}
            onChange={handlePriceChange}
            placeholder="Ví dụ: 50.000"
            className="border border-brand-green/40 focus:border-brand-green bg-green-50/30 rounded-lg px-3 py-1.5 outline-none text-sm w-48 transition-all"
          />
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 ml-13">
        <div className="flex items-center gap-1 sm:gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex items-center gap-1.5 text-gray-500 hover:text-brand-green hover:bg-brand-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <ImagePlus size={18} className="text-brand-green" />
            <span className="font-medium text-sm hidden sm:inline">
              Ảnh ({imageFiles.length}/4)
            </span>
          </button>

          <button
            onClick={() => setIsSale(!isSale)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors border ${
              isSale ? 'bg-brand-primary/20 text-brand-green border-brand-green/30' : 'text-gray-500 border-transparent hover:bg-gray-50'
            }`}
          >
            <span className="font-medium text-sm">Bạn muốn bán đồ?</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isModerated ? (
            <button
              onClick={handleModerate}
              disabled={isModerating || (!content.trim() && imageFiles.length === 0)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-1.5 px-4 rounded-full hover:opacity-90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isModerating ? <Loader2 size={16} className="animate-spin" /> : 'Kiểm duyệt'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && imageFiles.length === 0)}
              className="bg-brand-green text-white font-semibold py-1.5 px-5 rounded-full hover:bg-brand-green/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Đăng (Đã duyệt)'} <Send size={14} />
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-3 ml-13 flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
