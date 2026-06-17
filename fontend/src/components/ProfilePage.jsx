import React, { useState, useEffect } from 'react';
import { User, Package, MessageSquare, Trash2, Edit, Loader2, MapPin, Mail, CreditCard } from 'lucide-react';
import { API_URL } from '../config/api';
import DetailedProductCard from './DetailedProductCard';
import PostCard from './PostCard';
import { useToast } from './ToastProvider';

const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url}`;
};

const ProfilePage = ({ currentUser, onOpenProduct, onOpenChat, onEdit, refreshTrigger, onLogout = null }) => {
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'posts'
  const [loading, setLoading] = useState(true);
  const { showToast, confirm } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, [refreshTrigger]);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('greencampus_token');
    if (!token) return;

    setLoading(true);
    try {
      const [profRes, itemsRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/users/my-items`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/users/my-posts`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (profRes.status === 401 || itemsRes.status === 401 || postsRes.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      if (profRes.ok) setProfile(await profRes.json());
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.map(item => ({ ...item, image: resolveImage(item.image) })));
      }
      if (postsRes.ok) setPosts(await postsRes.json());
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa đồ này không? Hành động này không thể hoàn tác.');
    if (!isConfirmed) return;

    const token = localStorage.getItem('greencampus_token');
    try {
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
        showToast('Đã xóa đồ thành công');
      } else {
        showToast('Có lỗi xảy ra khi xóa đồ.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleDeletePost = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa bài viết này không?');
    if (!isConfirmed) return;

    const token = localStorage.getItem('greencampus_token');
    try {
      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(posts.filter(post => post.id !== id));
        showToast('Đã xóa bài viết');
      } else {
        showToast('Có lỗi xảy ra khi xóa bài viết.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-green" size={40} />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20 text-gray-500">Vui lòng đăng nhập để xem hồ sơ.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      {/* ── Profile Header ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-primary/40 to-brand-green/20"></div>
        
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white z-10">
          <img 
            src={resolveImage(profile.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=E1F0C4&color=2D6A4F&bold=true&size=128`} 
            alt={profile.full_name} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left z-10 pt-2 md:pt-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.full_name}</h1>
          <div className="mt-4 flex flex-wrap gap-3 md:gap-4 text-sm text-gray-600 justify-center md:justify-start">
            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <CreditCard size={16} className="text-brand-green" /> 
              {profile.account_type === 'Giảng viên / Cán bộ' ? 'MCB' : 'MSSV'}: {profile.student_id}
            </span>
            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Mail size={16} className="text-brand-green" /> {profile.email}
            </span>
            {profile.university && (
              <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <MapPin size={16} className="text-brand-green" /> {profile.university}
              </span>
            )}
            {profile.department && (
              <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Package size={16} className="text-brand-green" /> {profile.department}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'items' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Package size={18} /> Đồ đang bán ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'posts' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MessageSquare size={18} /> Bài viết cộng đồng ({posts.length})
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-green" size={32} /></div>
        ) : activeTab === 'items' ? (
          /* ITEMS TAB */
          items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map(item => (
                <div key={item.id} className="relative group">
                  <DetailedProductCard product={item} />
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => onEdit(item)}
                      className="bg-white p-2 rounded-full shadow hover:bg-blue-50 text-blue-600 transition-colors" title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-white p-2 rounded-full shadow hover:bg-red-50 text-red-600 transition-colors" title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p>Bạn chưa đăng bán món đồ nào.</p>
            </div>
          )
        ) : (
          /* POSTS TAB */
          posts.length > 0 ? (
            <div className="max-w-[700px] mx-auto flex flex-col gap-6">
              {posts.map(post => (
                <div key={post.id} className="relative group">
                  <PostCard post={post} onMessage={onOpenChat} />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button className="bg-white/80 backdrop-blur border border-gray-100 p-2 rounded-full shadow-sm hover:bg-blue-50 text-blue-600 transition-colors" title="Sửa (UI)">
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-white/80 backdrop-blur border border-gray-100 p-2 rounded-full shadow-sm hover:bg-red-50 text-red-600 transition-colors" title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed max-w-[700px] mx-auto">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p>Bạn chưa có bài viết nào trên cộng đồng.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
