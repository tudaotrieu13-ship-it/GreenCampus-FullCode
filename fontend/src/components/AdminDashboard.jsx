import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, BarChart3, AlertCircle, 
  Search, Filter, CheckCircle, XCircle, Trash2, Edit, FileText, Loader2
} from 'lucide-react';
import { API_URL } from '../config/api';
import EmptyState from './EmptyState';
import { useToast } from './ToastProvider';

const AdminDashboard = ({ currentUser, onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { showToast, confirm } = useToast();
  
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ userCount: 0, itemCount: 0, postCount: 0, transactionCount: 0 });
  
  const [loading, setLoading] = useState(false);
  const token = currentUser?.token || localStorage.getItem('greencampus_token');
  const headers = { Authorization: `Bearer ${token}` };

  const getFirstImage = (urlStr) => {
    if (!urlStr) return null;
    let firstUrl = urlStr;
    try {
      const parsed = JSON.parse(urlStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        firstUrl = parsed[0];
      }
    } catch (e) {
      firstUrl = urlStr.split(',')[0].trim();
    }
    
    if (!firstUrl) return null;
    if (firstUrl.startsWith('http') || firstUrl.startsWith('blob:')) return firstUrl;
    return `${API_URL.replace('/api', '')}${firstUrl}`;
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'dashboard') {
        const res = await fetch(`${API_URL}/admin/stats`, { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/admin/users`, { headers });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'products') {
        const res = await fetch(`${API_URL}/items`); 
        if (res.ok) setItems(await res.json());
      } else if (activeTab === 'posts') {
        const res = await fetch(`${API_URL}/admin/posts`, { headers });
        if (res.ok) setPosts(await res.json());
      } else if (activeTab === 'reports') {
        const res = await fetch(`${API_URL}/admin/reports`, { headers });
        if (res.ok) setReports(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa người dùng này?');
    if (!isConfirmed) return;
    const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers });
    if(res.ok) {
      setUsers(users.filter(u => u.id !== id));
      showToast('Đã xóa người dùng thành công', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || data.error || 'Lỗi khi xóa người dùng', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa sản phẩm này?');
    if (!isConfirmed) return;
    const res = await fetch(`${API_URL}/admin/items/${id}`, { method: 'DELETE', headers });
    if(res.ok) {
      setItems(items.filter(i => i.id !== id));
      showToast('Đã xóa sản phẩm thành công', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || data.error || 'Lỗi khi xóa sản phẩm', 'error');
    }
  };

  const handleDeletePost = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa bài đăng này?');
    if (!isConfirmed) return;
    const res = await fetch(`${API_URL}/admin/posts/${id}`, { method: 'DELETE', headers });
    if(res.ok) {
      setPosts(posts.filter(p => p.id !== id));
      showToast('Đã xóa bài đăng thành công', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || data.error || 'Lỗi khi xóa bài đăng', 'error');
    }
  };

  const dashboardStats = [
    { label: 'Tổng người dùng', value: stats.userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Sản phẩm đang bán', value: stats.itemCount, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Lượt trao đổi', value: stats.transactionCount, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Bài đăng bản tin', value: stats.postCount, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' }
  ];

  const handleUpdateReportStatus = async (id, status) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hoạt động hệ thống</h3>
          <p className="text-gray-500 text-sm">Hiện tại hệ thống đang hoạt động ổn định. Số lượng tương tác tăng 12% so với tuần trước.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Báo cáo chờ xử lý</h3>
          <div className="space-y-4">
            {reports.filter(r => r.status === 'PENDING').slice(0, 5).map(r => (
              <div key={r.id} className="border border-gray-100 p-4 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{r.target_type === 'ITEM' ? 'Sản phẩm: ' : r.target_type === 'POST' ? 'Bài viết: ' : 'Người dùng: '}{r.target_name || r.target_id}</p>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-medium">Chờ xử lý</span>
                </div>
                <p className="text-sm text-gray-600 mb-3"><span className="font-medium">Lý do:</span> {r.reason}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateReportStatus(r.id, 'RESOLVED')} className="flex-1 bg-emerald-50 text-emerald-600 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">Duyệt</button>
                  <button onClick={() => handleUpdateReportStatus(r.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">Bỏ qua</button>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'PENDING').length === 0 && (
              <p className="text-gray-500 text-sm italic">Không có báo cáo chờ xử lý.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý người dùng</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm người dùng..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Người dùng</th>
              <th className="p-4 font-medium">Vai trò</th>
              <th className="p-4 font-medium">Ngày tham gia</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="4" className="p-16"><div className="flex flex-col items-center justify-center text-gray-400 gap-3"><Loader2 size={32} className="animate-spin text-[#2D6A4F]" /><p>Đang tải dữ liệu...</p></div></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" className="p-0 border-b-0"><EmptyState icon={Users} title="Chưa có người dùng" description="Hệ thống hiện tại chưa có người dùng nào đăng ký." /></td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.role_id === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role_id === 2 ? 'Admin' : 'Student'}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteUser(u.id)} disabled={u.role_id === 2} className={`p-1.5 rounded-lg transition-colors ${u.role_id === 2 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý sản phẩm</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm sản phẩm..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Sản phẩm</th>
              <th className="p-4 font-medium">Giá</th>
              <th className="p-4 font-medium">Người đăng</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="4" className="p-16"><div className="flex flex-col items-center justify-center text-gray-400 gap-3"><Loader2 size={32} className="animate-spin text-[#2D6A4F]" /><p>Đang tải dữ liệu...</p></div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="4" className="p-0 border-b-0"><EmptyState icon={ShoppingBag} title="Chưa có sản phẩm" description="Hệ thống chưa có sản phẩm nào được đăng bán." /></td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={getFirstImage(item.image_url || item.image) || 'https://placehold.co/100'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-semibold text-gray-800 line-clamp-2 max-w-[200px]">{item.title}</p>
                </td>
                <td className="p-4 text-emerald-600 font-bold">{Number(item.price).toLocaleString('vi-VN')} ₫</td>
                <td className="p-4 text-gray-600">{item.full_name || 'Người dùng'}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Quản lý bản tin (News Feed)</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm bài viết..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Nội dung bài viết</th>
              <th className="p-4 font-medium">Người đăng</th>
              <th className="p-4 font-medium">Phân loại</th>
              <th className="p-4 font-medium">Ngày đăng</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="5" className="p-16"><div className="flex flex-col items-center justify-center text-gray-400 gap-3"><Loader2 size={32} className="animate-spin text-[#2D6A4F]" /><p>Đang tải dữ liệu...</p></div></td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan="5" className="p-0 border-b-0"><EmptyState icon={FileText} title="Chưa có bài viết" description="Bản tin cộng đồng hiện chưa có nội dung nào." /></td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  {post.image_url && getFirstImage(post.image_url) && (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={getFirstImage(post.image_url)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="font-medium text-gray-800 line-clamp-2 max-w-[250px]">{post.content || '(Chỉ có hình ảnh)'}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <img src={post.avatar_url ? (post.avatar_url.startsWith('http') ? post.avatar_url : `${API_URL.replace('/api', '')}${post.avatar_url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name)}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-gray-700 font-medium">{post.author_name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-lg font-medium ${post.post_type === 'SALE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {post.post_type === 'SALE' ? 'Bán hàng' : 'Thảo luận'}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Xóa bài viết">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 md:min-h-screen">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2 cursor-pointer" onClick={onBack}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Admin Panel</span>
        </div>
        <div className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 size={18} /> Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={18} /> Quản lý người dùng
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ShoppingBag size={18} /> Quản lý sản phẩm
          </button>
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'posts' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText size={18} /> Quản lý bản tin
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <AlertCircle size={18} /> Quản lý báo cáo
          </button>
        </div>
        <div className="p-4 md:mt-auto md:absolute md:bottom-0 md:w-64 border-t border-gray-100">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            Trở về trang chủ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Tổng quan hệ thống' : 
               activeTab === 'users' ? 'Quản lý người dùng' : 
               activeTab === 'products' ? 'Quản lý sản phẩm' : 
               activeTab === 'posts' ? 'Quản lý bản tin' : 'Quản lý báo cáo'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center text-emerald-700 font-bold">
                {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{currentUser?.full_name || 'Quản trị viên'}</p>
                <p className="text-xs text-emerald-600">Admin</p>
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'posts' && renderPosts()}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Quản lý báo cáo</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Đối tượng</th>
                      <th className="p-4 font-medium">Người báo cáo</th>
                      <th className="p-4 font-medium">Lý do</th>
                      <th className="p-4 font-medium">Trạng thái</th>
                      <th className="p-4 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                      <tr><td colSpan="5" className="p-16"><div className="flex flex-col items-center justify-center text-gray-400 gap-3"><Loader2 size={32} className="animate-spin text-[#2D6A4F]" /><p>Đang tải dữ liệu...</p></div></td></tr>
                    ) : reports.length === 0 ? (
                      <tr><td colSpan="5" className="p-0 border-b-0"><EmptyState icon={AlertCircle} title="Không có báo cáo" description="Hiện tại không có báo cáo vi phạm nào cần xử lý." /></td></tr>
                    ) : reports.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-semibold text-gray-800">
                          {r.target_type === 'ITEM' ? 'Sản phẩm' : r.target_type === 'POST' ? 'Bài viết' : 'Người dùng'}: {r.target_name || r.target_id}
                        </td>
                        <td className="p-4 text-gray-600">{r.reporter_name}</td>
                        <td className="p-4 text-gray-600 max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            r.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {r.status === 'PENDING' ? 'Chờ xử lý' : r.status === 'RESOLVED' ? 'Đã duyệt' : 'Bỏ qua'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {r.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdateReportStatus(r.id, 'RESOLVED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Duyệt"><CheckCircle size={18} /></button>
                              <button onClick={() => handleUpdateReportStatus(r.id, 'REJECTED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Bỏ qua"><XCircle size={18} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
