import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronDown, Image as ImageIcon, Tag, MapPin,
  Smile, MoreHorizontal, Globe, Users, ImagePlus, Sparkles
} from 'lucide-react';

const EMOJI_LIST = [
  '😄','😂','🥰','😍','🤩','😎','🥳','😭','😢','😡',
  '👍','👎','🙏','🤝','💪','✌️','🫶','❤️','🔥','✨',
  '🎉','🎊','🍀','📚','💻','🖊️','📱','🛒','💰','🎁',
];

const CreatePostModal = ({ isOpen, onClose, onPost }) => {
  const [content, setContent]               = useState('');
  const [isAnonymous, setIsAnonymous]       = useState(false);
  const [isPosting, setIsPosting]           = useState(false);
  const [selectedImage, setSelectedImage]   = useState(null);   // File
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // string
  const [isEmojiOpen, setIsEmojiOpen]       = useState(false);
  const [isModerated, setIsModerated]       = useState(false);
  const [isModerating, setIsModerating]     = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 120);
    if (!isOpen) resetAll();
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset moderation if user changes content
  useEffect(() => {
    setIsModerated(false);
    setErrorMsg('');
  }, [content, imagePreviewUrl]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!isEmojiOpen) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEmojiOpen]);

  const resetAll = () => {
    setContent('');
    setIsAnonymous(false);
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setIsEmojiOpen(false);
    setIsModerated(false);
    setErrorMsg('');
  };

  const handleModerate = async () => {
    if (!content.trim() && !imagePreviewUrl) return;
    setIsModerating(true);
    setErrorMsg('');
    
    try {
      const token = localStorage.getItem('greencampus_token');
      if (!token) {
        setErrorMsg('Vui lòng đăng nhập để thực hiện chức năng này.');
        setIsModerating(false);
        return;
      }
      const imagesBase64 = imagePreviewUrl ? [imagePreviewUrl] : [];
      
      const res = await fetch(`http://localhost:5000/api/ai/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: content, imagesBase64 })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi kiểm duyệt');
      
      if (data.isSafe === false) {
        setErrorMsg(`Vi phạm: ${data.reason}`);
        setIsModerated(false);
      } else {
        setIsModerated(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Hệ thống kiểm duyệt lỗi. Vui lòng thử lại.');
      setIsModerated(false);
    } finally {
      setIsModerating(false);
    }
  };

  // ── Image handling ───────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  // ── Emoji handling ────────────────────────────────────────────────────────────
  const handleSelectEmoji = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) { setContent(p => p + emoji); return; }
    const start = ta.selectionStart ?? content.length;
    const end   = ta.selectionEnd   ?? content.length;
    const next  = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    });
    setIsEmojiOpen(false);
  };

  // ── Post ─────────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!content.trim() && !imagePreviewUrl) return;
    setIsPosting(true);
    await new Promise(r => setTimeout(r, 600));
    onPost({
      name:     isAnonymous ? 'Sinh viên ẩn danh' : 'Dao Trieu Tu',
      verified: !isAnonymous,
      content:  content.trim(),
      time:     'Vừa xong',
      image:    imagePreviewUrl || null,
      likes:    0,
      comments: 0,
    });
    setIsPosting(false);
    resetAll();
    onClose();
  };

  if (!isOpen) return null;

  const canPost = (content.trim() || imagePreviewUrl) && !isPosting;

  // ── Toolbar item definitions ─────────────────────────────────────────────────
  const toolbarItems = [
    {
      icon: ImageIcon, label: 'Ảnh/Video', color: 'text-green-500',
      onClick: () => fileInputRef.current?.click(),
    },
    { icon: Tag,          label: 'Gắn thẻ',  color: 'text-blue-500',   onClick: () => {} },
    { icon: MapPin,       label: 'Vị trí',   color: 'text-red-500',    onClick: () => {} },
    {
      icon: Smile, label: 'Cảm xúc', color: 'text-yellow-500',
      onClick: () => setIsEmojiOpen(p => !p),
    },
    { icon: MoreHorizontal, label: 'Thêm',   color: 'text-gray-500',   onClick: () => {} },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Modal card */}
      <div className="relative bg-white w-full max-w-[520px] rounded-[16px] shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="relative flex items-center justify-center py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tạo bài viết</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── User info + anonymous toggle ── */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand-primary flex-shrink-0 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Dao+Trieu+Tu&background=E1F0C4&color=2D6A4F"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">
                {isAnonymous ? 'Sinh viên ẩn danh' : 'Dao Trieu Tu'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors">
                  <Globe size={11} /> Nhóm công khai <ChevronDown size={10} />
                </button>
                <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors">
                  <Users size={11} /> Thêm nhóm <ChevronDown size={10} />
                </button>
              </div>
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">Đăng<br />ẩn danh</span>
            <button
              onClick={() => setIsAnonymous(p => !p)}
              aria-label="Toggle anonymous"
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isAnonymous ? 'bg-brand-green' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isAnonymous ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Textarea ── */}
        <div className="px-5 pb-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tạo bài viết công khai..."
            rows={4}
            className="w-full resize-none outline-none text-gray-800 text-base leading-relaxed placeholder-gray-400"
          />
        </div>

        {/* ── Image preview ── */}
        {imagePreviewUrl && (
          <div className="px-5 pb-3">
            <div className="relative w-full aspect-square rounded-[12px] overflow-hidden border border-gray-200 bg-gray-50">
              <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Toolbox ── */}
        <div className="mx-5 mb-4 border border-gray-200 rounded-[12px] overflow-visible relative">
          <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50 rounded-[12px]">
            <span className="text-sm font-semibold text-gray-700">Thêm vào bài viết của bạn</span>
            <div className="flex items-center gap-1">
              {toolbarItems.map(({ icon: Icon, label, color, onClick }) => (
                <button
                  key={label}
                  title={label}
                  onClick={onClick}
                  className={`w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors ${color}`}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Emoji Picker popover ── */}
          {isEmojiOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute right-0 bottom-full mb-2 z-10 bg-white border border-gray-200 rounded-[12px] shadow-xl p-3 w-64"
            >
              <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Chọn biểu cảm</p>
              <div className="grid grid-cols-10 gap-0.5">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Post button ── */}
        <div className="px-5 pb-5">
          {errorMsg && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {!isModerated ? (
            <button
              onClick={handleModerate}
              disabled={!canPost || isModerating}
              className={`w-full py-2.5 rounded-[12px] font-bold text-base transition-all flex items-center justify-center gap-2 ${
                canPost && !isModerating
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isModerating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang kiểm duyệt...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Kiểm duyệt nội dung
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={!canPost || isPosting}
              className={`w-full py-2.5 rounded-[12px] font-bold text-base transition-all flex items-center justify-center gap-2 ${
                canPost && !isPosting
                  ? 'bg-brand-green text-white hover:bg-brand-green/90 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isPosting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang đăng...
                </>
              ) : (
                <>Đăng bài (Đã duyệt)</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
