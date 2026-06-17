import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf, User, ShoppingBag,
  Settings, LogOut, ShoppingCart, Search, X, Heart, Bell, Shield,
  MessageCircle, Menu
} from 'lucide-react';
import { API_URL } from '../config/api';
import NotificationDropdown from './NotificationDropdown';

const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url}`;
};



const Header = ({
  currentPage,
  setCurrentPage,
  onPostAndGoToCategories,
  onSelectCategory,
  currentUser,
  onLogout,
  onGoToLogin,
  onGoToRegister,
  onNavigate,
  onSearch,
  cartCount = 0,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('greencampus_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q && onSearch) {
      const newHistory = [q, ...searchHistory.filter(term => term !== q)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('greencampus_search_history', JSON.stringify(newHistory));
      setShowHistory(false);
      onSearch(q);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchOpen(false);
    if (onSearch) onSearch('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      // Close search history if click outside search container
      if (searchInputRef.current && !searchInputRef.current.contains(e.target) && !e.target.closest('.search-history-dropdown')) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nav = (page) => () => { onNavigate?.(page); setDropdownOpen(false); };

  const menuItems = [
    { icon: User,        label: 'Trang cá nhân',       onClick: nav('profile') },
    { icon: Heart,       label: 'Sản phẩm yêu thích',  onClick: nav('wishlist') },
    { icon: ShoppingBag, label: 'Lịch sử mua/bán',     onClick: nav('history') },
    currentUser?.role_id === 2 ? { icon: Shield, label: 'Quản trị viên', onClick: nav('admin') } : null,
    { icon: Settings,    label: 'Cài đặt',              onClick: nav('settings') },
  ].filter(Boolean);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-1 sm:gap-2 cursor-pointer flex-shrink-0" onClick={() => setCurrentPage('home')}>
          <Leaf className="text-brand-green w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          <span className="text-[17px] sm:text-xl md:text-2xl font-bold text-brand-green tracking-tight">GreenCampus</span>
        </div>

        {/* Center: Nav or Search */}
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex flex-1 md:max-w-md mx-4 md:mx-8 absolute inset-x-0 top-0 px-4 py-3 bg-white z-50 md:relative md:bg-transparent md:p-0 md:inset-auto">
            <div className="relative w-full flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowHistory(true); }}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-9 pr-10 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                />
                {searchQuery && (
                   <button type="button" onClick={() => { setSearchQuery(''); if(onSearch) onSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden md:block">
                     <X size={15} />
                   </button>
                )}
                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && !searchQuery && (
                  <div className="search-history-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lịch sử tìm kiếm</span>
                      <button type="button" onClick={() => { setSearchHistory([]); localStorage.removeItem('greencampus_search_history'); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Xóa tất cả</button>
                    </div>
                    {searchHistory.map((term, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group">
                        <div className="flex items-center gap-3 flex-1" onClick={() => { setSearchQuery(term); setShowHistory(false); if(onSearch) onSearch(term); }}>
                          <Search size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{term}</span>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); const newHistory = searchHistory.filter(t => t !== term); setSearchHistory(newHistory); localStorage.setItem('greencampus_search_history', JSON.stringify(newHistory)); }} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={handleClearSearch} className="text-sm font-medium text-gray-600 hover:text-gray-900 md:hidden">
                Hủy
              </button>
              <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hidden md:block">
                <X size={15} />
              </button>
            </div>
          </form>
        ) : (
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setCurrentPage('home')} className={`font-medium transition-colors ${currentPage === 'home' ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'}`}>Trang chủ</button>
            <button onClick={() => setCurrentPage('feed')} className={`font-medium transition-colors ${currentPage === 'feed' ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'}`}>Bản tin</button>
            <button onClick={() => onSelectCategory('Tất cả danh mục')} className="text-gray-600 hover:text-brand-green font-medium transition-colors">Danh mục</button>
            <button onClick={() => setCurrentPage('messages')} className={`font-medium transition-colors ${currentPage === 'messages' ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'}`}>Tin nhắn</button>
            <button onClick={() => onSelectCategory('Sống xanh')} className={`font-medium transition-colors ${currentPage === 'green-life' ? 'text-brand-green' : 'text-gray-600 hover:text-brand-green'}`}>Sống xanh</button>
          </nav>
        )}

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">

          {/* Search toggle */}
          {!searchOpen && (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Tìm kiếm sản phẩm">
              <Search size={20} className="text-gray-600" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logged OUT */}
          {!currentUser && (
            <>
              <button onClick={onGoToLogin} className="text-gray-600 hover:text-brand-green font-semibold text-sm transition-colors">Đăng nhập</button>
              <button onClick={onGoToRegister} className="bg-brand-green text-white font-semibold py-2 px-5 rounded-[12px] hover:bg-brand-green/90 transition-colors text-sm shadow-sm">Đăng ký</button>
            </>
          )}

          {/* Logged IN */}
          {currentUser && (
            <>
              <button onClick={onPostAndGoToCategories} className="bg-brand-primary text-brand-green font-semibold py-2.5 px-5 rounded-[16px] hover:bg-[#d0e6ac] transition-colors shadow-sm text-sm hidden md:block">
                Đăng đồ ngay
              </button>

              {/* Notification bell */}
              <NotificationDropdown currentUser={currentUser} onNavigate={onNavigate} />

              {/* Cart */}
              <button onClick={() => onNavigate?.('cart')} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Giỏ hàng">
                <ShoppingCart size={22} className="text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  <img
                    src={resolveImage(currentUser.avatar_url || currentUser.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name || currentUser.name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`}
                    alt={currentUser.full_name || currentUser.name}
                    className="w-full h-full rounded-full object-cover border-2 border-brand-primary bg-white"
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[16px] shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="font-bold text-gray-900 text-sm truncate">{currentUser.full_name || currentUser.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    {menuItems.map(({ icon: Icon, label, onClick }) => (
                      <button key={label} onClick={() => { onClick(); setDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Icon size={16} className="text-gray-400" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button onClick={() => { onLogout(); setDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4 shadow-inner animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1">
            <button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-medium transition-colors ${currentPage === 'home' ? 'bg-brand-primary/30 text-brand-green' : 'text-gray-600 hover:bg-gray-50'}`}>Trang chủ</button>
            <button onClick={() => { setCurrentPage('feed'); setMobileMenuOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-medium transition-colors ${currentPage === 'feed' ? 'bg-brand-primary/30 text-brand-green' : 'text-gray-600 hover:bg-gray-50'}`}>Bản tin</button>
            <button onClick={() => { onSelectCategory('Tất cả danh mục'); setMobileMenuOpen(false); }} className="text-left px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Danh mục</button>
            <button onClick={() => { setCurrentPage('messages'); setMobileMenuOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-medium transition-colors ${currentPage === 'messages' ? 'bg-brand-primary/30 text-brand-green' : 'text-gray-600 hover:bg-gray-50'}`}>Tin nhắn</button>
            <button onClick={() => { onSelectCategory('Sống xanh'); setMobileMenuOpen(false); }} className={`text-left px-4 py-3 rounded-xl font-medium transition-colors ${currentPage === 'green-life' ? 'bg-brand-primary/30 text-brand-green' : 'text-gray-600 hover:bg-gray-50'}`}>Sống xanh</button>
            
            {currentUser && (
              <button onClick={() => { onPostAndGoToCategories(); setMobileMenuOpen(false); }} className="text-left px-4 py-3 rounded-xl font-semibold bg-brand-green text-white mt-2 shadow-sm flex items-center gap-2">
                Đăng đồ ngay
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
