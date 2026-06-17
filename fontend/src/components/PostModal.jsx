import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { API_URL } from '../config/api';

const PostModal = ({ isOpen, onClose, onPost, productData = null }) => {
  const [isFree,          setIsFree]         = useState(false);
  const [isLoading,       setIsLoading]      = useState(false);
  const [isAnalyzing,     setIsAnalyzing]    = useState(false);
  const [imagePreviews,   setImagePreviews]  = useState([]); // array of base64
  const [imageFiles,      setImageFiles]     = useState([]); // array of Real files
  const [title,           setTitle]          = useState('');
  const [categoryId,      setCategoryId]     = useState('');
  const [price,           setPrice]          = useState('');
  const [condition,       setCondition]      = useState('');
  const [description,     setDescription]    = useState('');
  const [quantity,        setQuantity]       = useState(1);
  
  const isEditMode = !!productData;

  const [isModerated,     setIsModerated]    = useState(false);
  const [isModerating,    setIsModerating]   = useState(false);
  
  const [categories,      setCategories]     = useState([]);
  const [error,           setError]          = useState('');
  const [success,         setSuccess]        = useState(false);

  const fileInputRef = useRef(null);

  // Reset moderation if user changes content
  useEffect(() => {
    setIsModerated(false);
  }, [title, description, imagePreviews]);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (productData) {
        setTitle(productData.title || '');
        setCategoryId(productData.category_id || '');
        setPrice(productData.price || '');
        setCondition(productData.condition || '');
        setDescription(productData.content || '');
        setIsFree(productData.price === 0);
        setQuantity(productData.quantity || 1);
        if (productData.image) setImagePreviews([productData.image]);
        setIsModerated(false);
      } else {
        resetForm();
      }
    }
  }, [isOpen, productData]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  if (!isOpen) return null;

  // ── image ────────────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const slotsLeft = 5 - imageFiles.length;
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

  const handleAnalyzeImage = async () => {
    if (!imagePreviews.length) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const token = localStorage.getItem('greencampus_token');
      const res = await fetch(`${API_URL}/ai/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imagesBase64: imagePreviews }) // Phân tích tất cả ảnh
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi phân tích');
      
      if (data.title) setTitle(data.title);
      if (data.category_id) {
        const cat = categories.find(c => c.name.toLowerCase().includes(data.category_id.toLowerCase()) || data.category_id.toLowerCase().includes(c.name.toLowerCase()));
        if (cat) setCategoryId(cat.id);
      }
      if (data.condition) setCondition(data.condition);
      if (data.suggested_price) {
        setPrice(data.suggested_price);
        setIsFree(false);
      }
    } catch (err) {
      console.error(err);
      setError('AI không thể nhận diện. Vui lòng tự điền.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModerate = async () => {
    if (!title.trim()) {
      setError('Vui lòng điền tiêu đề trước khi kiểm duyệt.');
      return;
    }
    setIsModerating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('greencampus_token');
      const text = `${title} ${description}`;
      const res = await fetch(`${API_URL}/ai/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, imagesBase64: imagePreviews })
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

  // ── submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title.trim() || !categoryId) {
      setError('Vui lòng điền tiêu đề và chọn danh mục.');
      setIsLoading(false);
      return;
    }
    if (imageFiles.length === 0 && !isEditMode) {
      setError('Vui lòng thêm ít nhất 1 ảnh cho sản phẩm.');
      setIsLoading(false);
      return;
    }
    if (!isFree && (!price || Number(price) <= 0)) {
      setError('Vui lòng nhập mức giá hợp lệ.');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('greencampus_token');
      if (!token) {
        setError('Bạn cần đăng nhập để thực hiện chức năng này.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', categoryId);
      formData.append('price', isFree ? 0 : Number(price));
      formData.append('condition', condition || 'Mới đăng');
      formData.append('description', description);
      formData.append('quantity', quantity);
      
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      const res = await fetch(`${API_URL}/items${isEditMode ? `/${productData.id}` : ''}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Có lỗi xảy ra.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      
      // Trigger instant notification refresh (item_posted notification was created server-side)
      setTimeout(() => window.dispatchEvent(new CustomEvent('greencampus:notif_refresh')), 800);

      setTimeout(() => {
        if (typeof onPost === 'function') {
          onPost(); // Trigger re-fetch in parent
        }
        resetForm();
        onClose();
      }, 1500);

    } catch (err) {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsLoading(false);
    setSuccess(false);
    setTitle('');
    setCategoryId('');
    setPrice('');
    setCondition('');
    setDescription('');
    setIsFree(false);
    setQuantity(1);
    setImagePreviews([]);
    setImageFiles([]);
    setError('');
    setIsModerated(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Đăng tin mới'}</h2>
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} className="text-brand-green" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{isEditMode ? 'Cập nhật thành công!' : 'Đăng tin thành công!'}</h3>
              <p className="text-gray-500 text-sm">{isEditMode ? 'Thông tin sản phẩm đã được thay đổi.' : 'Sản phẩm của bạn đã được đưa lên cửa hàng.'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
            
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-[10px] px-4 py-3">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="grid grid-cols-3 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreviews(prev => prev.filter((_, i) => i !== index));
                    setImageFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X size={16} />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-brand-green/90 text-white text-[10px] py-0.5 text-center font-medium">
                    Ảnh bìa
                  </div>
                )}
              </div>
            ))}
            {imagePreviews.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-brand-green hover:text-brand-green transition-all cursor-pointer"
              >
                <UploadCloud size={24} className="mb-1" />
                <span className="text-xs font-medium text-center px-1">Thêm ảnh<br/>({imagePreviews.length}/5)</span>
              </div>
            )}
          </div>
          
          {imagePreviews.length > 0 && (
            <button 
              type="button" 
              onClick={handleAnalyzeImage}
              disabled={isAnalyzing}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isAnalyzing ? 'AI đang phân tích ảnh bìa...' : 'Điền tự động bằng AI'}
            </button>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Giáo trình Giải tích 1"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all bg-white"
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Free toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giá / Miễn phí</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 h-[50px]">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={isFree}
                  onChange={() => setIsFree(!isFree)}
                  className="w-4 h-4 text-brand-green focus:ring-brand-primary rounded cursor-pointer"
                />
                <label htmlFor="isFree" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Tặng miễn phí
                </label>
              </div>
            </div>
          </div>

          {/* Price field — hidden when free */}
          {!isFree && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mức giá (VNĐ)</label>
              <input
                type="text"
                value={price ? Number(price).toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 9) setPrice(val);
                }}
                placeholder="Ví dụ: 50.000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all"
                required
              />
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tình trạng</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Ví dụ: Mới 95%, đã highlight..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setQuantity('');
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  if (num > 1000) setQuantity(1000);
                  else if (num < 1) setQuantity(1);
                  else setQuantity(num);
                }
              }}
              placeholder="1"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tình trạng, năm học, cách thức giao dịch..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-green transition-all"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-green text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-brand-green/90 transition-colors shadow-soft flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isEditMode ? 'Lưu thay đổi' : 'Đăng đồ ngay')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default PostModal;
