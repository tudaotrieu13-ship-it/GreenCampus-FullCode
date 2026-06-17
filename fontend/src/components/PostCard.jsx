import React, { useState } from 'react';
import { Heart, MessageCircle, ShieldCheck, PackageCheck, MessageSquare, Send, Trash2, Loader2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config/api';
import ReportModal from './ReportModal';
import { useToast } from './ToastProvider';

const resolveImage = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const getAvatarUrl = (name, url) => {
  if (url && (url.startsWith('http') || url.startsWith('blob:'))) return url;
  if (url) return `http://localhost:5000${url}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`;
};

const handleAvatarError = (e, name) => {
  e.target.onerror = null;
  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const PostCard = ({ post, onMessage }) => {
  const { showToast, confirm } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSold, setIsSold] = useState(Boolean(post.sold));

  // Comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  let currentUser = null;
  try {
    const s = localStorage.getItem('greencampus_user');
    if (s) currentUser = JSON.parse(s);
  } catch (e) {}

  const isOwner = currentUser && currentUser.id === post.user_id;

  const handleDeletePost = async () => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa bài viết này không?');
    if (!isConfirmed) return;
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Đã xóa bài viết thành công');
        window.location.reload(); // Simple reload for now, or trigger parent refresh if possible
      } else {
        showToast('Có lỗi xảy ra khi xóa bài viết.', 'error');
      }
    } catch {
      showToast('Có lỗi xảy ra khi xóa bài viết.', 'error');
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;

    setIsLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(newLiked ? likesCount + 1 : likesCount - 1);

    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        setLiked(!newLiked);
        setLikesCount(!newLiked ? likesCount + 1 : likesCount - 1);
      }
    } catch {
      setLiked(!newLiked);
      setLikesCount(!newLiked ? likesCount + 1 : likesCount - 1);
    } finally {
      setTimeout(() => setIsLiking(false), 500); // 500ms delay to prevent double-click spam
    }
  };

  const handleToggleSold = async () => {
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/sold`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setIsSold(!isSold);
    } catch { /* ignore */ }
  };

  const handleMessageClick = () => {
    if (isOwner) { showToast('Bạn không thể nhắn tin cho chính mình', 'error'); return; }
    if (onMessage) {
      onMessage({
        id: post.user_id,
        name: post.name || 'Người dùng',
        avatar: getAvatarUrl(post.name, post.avatar_url),
        postReference: { postId: post.id, content: post.content, image: post.image, price: post.price }
      });
    }
  };

  const handleToggleComments = async () => {
    if (!commentsOpen && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`${API_URL}/posts/${post.id}/comments`);
        if (res.ok) setComments(await res.json());
      } catch { /* ignore */ } finally {
        setLoadingComments(false);
      }
    }
    setCommentsOpen(prev => !prev);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const { id } = await res.json();
        setComments(prev => [...prev, {
          id,
          content,
          created_at: new Date().toISOString(),
          user_id: currentUser.id,
          full_name: currentUser.full_name || currentUser.name,
          avatar_url: currentUser.avatar_url || currentUser.avatar
        }]);
        setNewComment('');
      }
    } catch { /* ignore */ } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden mb-6">
      {/* ── Top Bar ── */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-brand-primary border border-gray-100">
            <img 
              src={getAvatarUrl(post.name, post.avatar_url)} 
              onError={(e) => handleAvatarError(e, post.name)}
              alt={post.name} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{post.name}</h3>
              {post.verified && <ShieldCheck size={14} className="text-brand-green flex-shrink-0" />}
              {isOwner && (
                <span className="text-[10px] font-semibold text-brand-green bg-brand-primary px-1.5 py-0.5 rounded-full flex-shrink-0">Bạn</span>
              )}
            </div>
            <p className="text-xs text-gray-500">{formatTime(post.time)}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {post.post_type === 'SALE' && post.price ? (
            <span className={`font-bold text-lg ${isSold ? 'text-gray-400 line-through' : 'text-brand-green'}`}>
              {Number(post.price).toLocaleString('vi-VN')}đ
            </span>
          ) : (
            <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${isSold ? 'bg-gray-100 text-gray-400' : 'bg-brand-primary/30 text-brand-green'}`}>
              {post.post_type === 'SALE' ? 'Miễn phí' : '🎁 Tặng đồ'}
            </span>
          )}
          <div className="relative inline-block ml-2">
            <button onClick={() => setShowOptions(!showOptions)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <MoreHorizontal size={18} />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 overflow-hidden">
                {isOwner ? (
                  <button 
                    onClick={() => { setShowOptions(false); handleDeletePost(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <Trash2 size={16} /> Xóa bài viết
                  </button>
                ) : (
                  <button 
                    onClick={() => { setShowOptions(false); setReportModalOpen(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <AlertTriangle size={16} /> Báo cáo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Text Content ── */}
      <div className={`px-5 ${post.image ? 'pb-3' : 'pb-4'}`}>
        {post.content && (
          <p className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* ── Post Image ── */}
      {(() => {
        if (!post.image) return null;
        let images = [];
        try {
          const parsed = JSON.parse(post.image);
          if (Array.isArray(parsed)) {
            images = parsed;
          } else {
            images = [post.image];
          }
        } catch {
          images = [post.image];
        }

        if (images.length === 0) return null;

        return (
          <div className="relative w-full border-y border-gray-100 bg-gray-50">
            {images.length === 1 ? (
              <img
                src={resolveImage(images[0])}
                alt="Hình ảnh bài viết"
                className={`w-full max-h-[500px] object-contain transition-all duration-300 ${isSold ? 'brightness-50 grayscale-[50%]' : ''}`}
              />
            ) : (
              <div className={`grid gap-0.5 ${images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'} ${isSold ? 'brightness-50 grayscale-[50%]' : ''}`}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={resolveImage(img)}
                    alt="Hình ảnh bài viết"
                    className={`w-full object-cover ${
                      images.length === 3 && idx === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-red-500/90 text-white font-black text-3xl tracking-widest px-8 py-3 rounded-[12px] shadow-2xl rotate-[-8deg] border-4 border-white/30 select-none backdrop-blur-sm">
                  ĐÃ BÁN
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Action Bar ── */}
      <div className="p-2 flex items-center justify-around border-t border-gray-50 text-gray-500">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md transition-colors ${liked ? 'text-brand-green' : 'hover:bg-gray-50 hover:text-gray-600'} ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart size={20} className={liked ? 'fill-brand-green text-brand-green' : ''} />
          <span className="text-sm font-medium">{likesCount > 0 ? likesCount : 'Thích'}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={handleToggleComments}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md transition-colors ${commentsOpen ? 'text-brand-green' : 'hover:bg-gray-50 hover:text-gray-600'}`}
        >
          <MessageSquare size={20} />
          <span className="text-sm font-medium">{comments.length > 0 ? comments.length : 'Bình luận'}</span>
        </button>

        {/* Message */}
        <button
          onClick={handleMessageClick}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md transition-colors ${isOwner ? 'opacity-50 cursor-not-allowed text-gray-300' : 'hover:bg-gray-50 hover:text-brand-green text-gray-500'}`}
          title={isOwner ? 'Bạn không thể nhắn tin cho chính mình' : 'Nhắn tin hỏi đồ'}
        >
          <MessageCircle size={20} />
          <span className="text-sm font-medium">Nhắn tin</span>
        </button>

        {/* Sold Toggle */}
        {post.post_type === 'SALE' && isOwner && (
          <button
            onClick={handleToggleSold}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${isSold ? 'text-red-500 hover:bg-red-50' : 'text-brand-green hover:bg-brand-primary/20'}`}
          >
            <PackageCheck size={18} />
            <span className="text-sm">{isSold ? 'Mở bán lại' : 'Đánh dấu đã bán'}</span>
          </button>
        )}
      </div>

      {/* ── Comments Section ── */}
      {commentsOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              ) : (
                <ul className="space-y-3 mb-3">
                  {comments.map(c => (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <img
                        src={getAvatarUrl(c.full_name, c.avatar_url)}
                        onError={(e) => handleAvatarError(e, c.full_name)}
                        alt={c.full_name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5 border border-gray-100 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl px-3 py-2 shadow-sm border border-gray-100 inline-block max-w-full">
                          <p className="text-xs font-semibold text-gray-800">{c.full_name}</p>
                          <p className="text-sm text-gray-700 break-words">{c.content}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 ml-1">{formatTime(c.created_at)}</p>
                      </div>
                      {currentUser && currentUser.id === c.user_id && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="mt-1 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                          title="Xóa bình luận"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Input */}
              {currentUser ? (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100/50">
                  <img
                    src={getAvatarUrl(currentUser.full_name || currentUser.name, currentUser.avatar_url || currentUser.avatar)}
                    onError={(e) => handleAvatarError(e, currentUser.full_name || currentUser.name)}
                    alt="me"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-green/30">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 text-sm outline-none bg-transparent"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="text-brand-green disabled:text-gray-300 transition-colors"
                    >
                      {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-gray-400 text-center mt-2">Đăng nhập để bình luận</p>
              )}
            </>
          )}
        </div>
      )}

      {!isOwner && (
        <ReportModal 
          isOpen={reportModalOpen} 
          onClose={() => setReportModalOpen(false)} 
          targetType="POST" 
          targetId={post.id} 
        />
      )}
    </div>
  );
};

export default PostCard;
