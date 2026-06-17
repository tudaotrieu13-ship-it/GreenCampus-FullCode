import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import SocialFeed from './components/SocialFeed';
import QuickActions from './components/QuickActions';
import ProductGrid from './components/ProductGrid';
import CategoryGridView from './components/CategoryGridView';
import PostModal from './components/PostModal';
import ProductDetailPage from './components/ProductDetailPage';
import StoreProfilePage from './components/StoreProfilePage';
import MessagePage from './components/MessagePage';
import ChatWidget from './components/ChatWidget';
import GreenAssistantBot from './components/GreenAssistantBot';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import GreenLifePage from './components/GreenLifePage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import WishlistPage from './components/WishlistPage';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import { useToast } from './components/ToastProvider';

import { API_URL, BACKEND_ORIGIN } from './config/api';
const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

const getAvatarUrl = (name, url) => {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`;
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'greencampus_user';
const loadUser = () => { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch { return null; } };
const saveUser = (u) => localStorage.setItem(LS_KEY, JSON.stringify(u));
const clearUser = () => {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem('greencampus_token');
};

const NAV_KEY = 'greencampus_nav_state';
const loadNav = () => {
  try {
    const s = localStorage.getItem(NAV_KEY);
    return s ? JSON.parse(s) : { page: 'home', category: null, categoryId: null };
  } catch { return { page: 'home', category: null, categoryId: null }; }
};
const saveNav = (state) => localStorage.setItem(NAV_KEY, JSON.stringify(state));

function App() {
  const { showToast } = useToast();

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [currentUser, _setCurrentUser] = useState(loadUser);
  const setCurrentUser = (u) => {
    _setCurrentUser(u);
    if (u) saveUser(u);
    else clearUser();
  };
  
  // ── Global Auth Expiry Listener ────────────────────────────────────────────
  useEffect(() => {
    const handleAuthExpired = () => {
      clearUser();
      _setCurrentUser(null);
      setAuthPage('login');
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);
  // authPage: null = app, 'login', 'register'
  const [authPage, setAuthPage] = useState(null);

  // ── App navigation state ───────────────────────────────────────────────────
  const savedNav = loadNav();
  const [currentPage, _setCurrentPage] = useState(savedNav.page);
  const [selectedCategory, _setSelectedCategory] = useState(savedNav.category);
  const [selectedCategoryId, _setSelectedCategoryId] = useState(savedNav.categoryId);

  // Direct setters (no auto-sync) – used internally by nav helpers
  const setCurrentPage = (p) => _setCurrentPage(p);
  const setSelectedCategory = (c) => _setSelectedCategory(c);
  const setSelectedCategoryId = (id) => _setSelectedCategoryId(id);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, _setSelectedProduct] = useState(() => {
    try { const s = sessionStorage.getItem('greencampus_selected_product'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setSelectedProduct = (p) => {
    _setSelectedProduct(p);
    if (p) sessionStorage.setItem('greencampus_selected_product', JSON.stringify(p));
    else sessionStorage.removeItem('greencampus_selected_product');
  };
  const [selectedStore, _setSelectedStore] = useState(() => {
    try { const s = sessionStorage.getItem('greencampus_selected_store'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setSelectedStore = (s) => {
    _setSelectedStore(s);
    if (s) sessionStorage.setItem('greencampus_selected_store', JSON.stringify(s));
    else sessionStorage.removeItem('greencampus_selected_store');
  };
  const [activeChatContact, setActiveChatContact] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── Browser History Integration ─────────────────────────────────────────────
  useEffect(() => {
    const currentState = {
      page: currentPage,
      category: selectedCategory,
      categoryId: selectedCategoryId,
      product: selectedProduct,
      store: selectedStore,
      auth: authPage
    };
    
    const historyState = window.history.state || {};
    
    const isDifferent = 
      historyState.page !== currentState.page ||
      historyState.category !== currentState.category ||
      historyState.categoryId !== currentState.categoryId ||
      JSON.stringify(historyState.product) !== JSON.stringify(currentState.product) ||
      JSON.stringify(historyState.store) !== JSON.stringify(currentState.store) ||
      historyState.auth !== currentState.auth;

    if (isDifferent) {
      window.history.pushState(currentState, '', '');
    }
  }, [currentPage, selectedCategory, selectedCategoryId, selectedProduct, selectedStore, authPage]);

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state) {
        _setCurrentPage(state.page || 'home');
        _setSelectedCategory(state.category || null);
        _setSelectedCategoryId(state.categoryId || null);
        setSelectedProduct(state.product || null);
        setSelectedStore(state.store || null);
        setAuthPage(state.auth || null);
      } else {
        _setCurrentPage('home');
        _setSelectedCategory(null);
        _setSelectedCategoryId(null);
        setSelectedProduct(null);
        setSelectedStore(null);
        setAuthPage(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Cart state ─────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState(() => {
    try { const s = localStorage.getItem('greencampus_cart'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [checkoutItems, _setCheckoutItems] = useState(() => {
    try { const s = sessionStorage.getItem('greencampus_checkout_items'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const setCheckoutItems = (items) => {
    _setCheckoutItems(items);
    sessionStorage.setItem('greencampus_checkout_items', JSON.stringify(items));
  };

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('greencampus_cart', JSON.stringify(items));
  };

  const handleAddToCart = (product) => {
    if (!currentUser) { setAuthPage('login'); return; }
    setCartItems(prev => {
      // TODO: Đồng bộ giỏ hàng lên Database nếu User đã đăng nhập thay vì chỉ lưu LocalStorage
      const exists = prev.find(i => i.id === product.id);
      let updated;
      if (exists) {
        updated = prev.map(i => i.id === product.id ? { ...i, qty: (i.qty || 1) + 1 } : i);
      } else {
        updated = [...prev, { ...product, cartId: `${product.id}_${Date.now()}`, qty: 1 }];
      }
      localStorage.setItem('greencampus_cart', JSON.stringify(updated));
      return updated;
    });
    showToast('Đã thêm sản phẩm vào giỏ hàng', 'success');
  };

  const handleUpdateCartQty = (cartId, qty) => {
    const safeQty = Math.max(1, Math.min(99, parseInt(qty) || 1));
    const updated = cartItems.map(i => i.cartId === cartId ? { ...i, qty: safeQty } : i);
    saveCart(updated);
  };

  const handleRemoveFromCart = (cartId) => {
    saveCart(cartItems.filter(i => i.cartId !== cartId));
  };

  const handleCartCheckout = (selectedItems) => {
    setCheckoutItems(selectedItems);
    navToPage('checkout');
  };

  const handleBuyNow = (product) => {
    if (!currentUser) { setAuthPage('login'); return; }
    setCheckoutItems([{ ...product, cartId: `${product.id}_now`, qty: 1 }]);
    navToPage('checkout');
  };

  // ── Items (products) state ─────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Pagination states
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Re-fetch items whenever the selected category, search keyword, or page changes
  useEffect(() => {
    if (!selectedCategory && !searchKeyword) return;
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setErrorItems(null);
        let url;
        if (searchKeyword) {
          url = `${API_URL}/items?search=${encodeURIComponent(searchKeyword)}&page=${currentPageNum}&limit=12`;
        } else if (selectedCategoryId && selectedCategoryId !== 'free') {
          url = `${API_URL}/items?category=${selectedCategoryId}&page=${currentPageNum}&limit=12`;
        } else {
          url = `${API_URL}/items?page=${currentPageNum}&limit=12`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);
        const data = await res.json();
        
        if (data.products) {
          setItems(data.products.map(item => ({ ...item, image: resolveImage(item.image) })));
          setTotalPages(data.totalPages);
        } else {
          setItems(data.map(item => ({ ...item, image: resolveImage(item.image) })));
          setTotalPages(1);
        }
      } catch (err) {
        setErrorItems(err.message);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [selectedCategory, selectedCategoryId, searchKeyword, refreshTrigger, currentPageNum]);

  // ── Wishlist IDs sync to localStorage ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('greencampus_wished');
      return;
    }
    const token = currentUser.token || localStorage.getItem('greencampus_token');
    if (!token) return;
    fetch(`${API_URL}/wishlist/ids`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(ids => localStorage.setItem('greencampus_wished', JSON.stringify(ids)))
      .catch(() => {});
  }, [currentUser]);

  // ── JWT expiry check ───────────────────────────────────────────────────────
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (!currentUser) return;
      const token = currentUser?.token || localStorage.getItem('greencampus_token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          clearUser();
          _setCurrentUser(null);
          setAuthPage('login');
        }
      } catch {
        clearUser();
        _setCurrentUser(null);
      }
    };
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // ── Auth handlers ──────────────────────────────────────────────────────────

  /**
   * Called by LoginPage and RegisterPage on successful auth.
   * Persists the user to localStorage based on the 'remember' flag.
   */
  const handleLogin = (user, remember = false) => {
    setCurrentUser(user);
    if (remember) saveUser(user);
    else saveUser(user); // always save for this session; real apps use sessionStorage for no-remember
    setAuthPage(null);
    navHome();
  };

  /**
   * Called by RegisterPage — same as login but auto-routes home.
   */
  const handleRegister = (user) => {
    handleLogin(user, true);
  };

  const handleLogout = () => {
    clearUser();
    setCurrentUser(null);
    navHome();
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────

  // categoryId is optional — QuickActions passes it, Hero/Header may not
  const handleSearch = (q) => {
    if (!q) {
      handleSelectCategory('Tất cả danh mục');
      return;
    }
    setSearchKeyword(q);
    setCurrentPageNum(1); // reset page
    _setSelectedCategory(`Kết quả: "${q}"`);
    _setSelectedCategoryId(null);
    _setCurrentPage('home');
    setSelectedProduct(null);
    setSelectedStore(null);
    saveNav({ page: 'home', category: `Kết quả: "${q}"`, categoryId: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryName, categoryId = null) => {
    setSearchKeyword('');
    if (categoryName === 'Sống xanh') {
      navToPage('green-life');
      return;
    }
    if (categoryName === 'Giao lưu') {
      navFeed();
      return;
    }

    _setSelectedCategory(categoryName);
    _setSelectedCategoryId(categoryId);
    setCurrentPageNum(1); // reset page
    _setCurrentPage('home');
    setSelectedProduct(null);
    setSelectedStore(null);
    saveNav({ page: 'home', category: categoryName, categoryId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearCategory = () => { _setSelectedCategory(null); _setSelectedCategoryId(null); setSearchKeyword(''); saveNav({ page: currentPage, category: null, categoryId: null }); };
  const clearProduct = () => setSelectedProduct(null);
  const clearStore = () => setSelectedStore(null);

  const navHome = () => {
    _setCurrentPage('home');
    _setSelectedCategory(null);
    _setSelectedCategoryId(null);
    setSelectedProduct(null);
    setSelectedStore(null);
    saveNav({ page: 'home', category: null, categoryId: null });
  };

  const navFeed = () => {
    _setCurrentPage('feed');
    _setSelectedCategory(null);
    _setSelectedCategoryId(null);
    setSelectedProduct(null);
    setSelectedStore(null);
    saveNav({ page: 'feed', category: null, categoryId: null });
  };

  const navMessages = (contact = null) => {
    _setCurrentPage('messages');
    _setSelectedCategory(null);
    _setSelectedCategoryId(null);
    setSelectedProduct(null);
    setSelectedStore(null);
    if (contact) setActiveChatContact(contact);
    saveNav({ page: 'messages', category: null, categoryId: null });
  };

  /**
   * Navigate to a top-level page, resetting all drill-down state.
   * Handles 'profile', 'history', 'settings', 'cart', 'checkout', etc.
   */
  const navToPage = async (page) => {
    if (page.startsWith('product:')) {
      const itemId = page.split(':')[1];
      try {
        const res = await fetch(`${API_URL}/items/${itemId}`);
        if (res.ok) {
          const productData = await res.json();
          setSelectedProduct(productData);
          _setCurrentPage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('greencampus:scroll_to_reviews'));
          }, 500);
        }
      } catch (e) { console.error('Error fetching product for notification:', e); }
      return;
    }

    _setCurrentPage(page);
    _setSelectedCategory(null);
    _setSelectedCategoryId(null);
    setSelectedProduct(null);
    setSelectedStore(null);
    saveNav({ page, category: null, categoryId: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostAndGoToCategories = () => {
    setIsPostModalOpen(true);
    handleSelectCategory('Tất cả danh mục');
  };

  const handleAddProduct = () => {
    // Increment refresh trigger to reload lists
    setRefreshTrigger(prev => prev + 1);
    setEditingProduct(null);
    setIsPostModalOpen(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsPostModalOpen(true);
  };

  const handleBuyItem = (product) => {
    handleBuyNow(product);
  };

  // ── Auth pages take full control of the viewport ───────────────────────────
  if (authPage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoToRegister={() => setAuthPage('register')}
      />
    );
  }

  if (authPage === 'register') {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onGoToLogin={() => setAuthPage('login')}
      />
    );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  if (currentPage === 'admin') {
    return <AdminDashboard currentUser={currentUser} onBack={navHome} />;
  }

  return (
    <div className="min-h-screen font-sans bg-gray-50 relative flex flex-col">
      <Header
        currentPage={currentPage}
        setCurrentPage={(page) => {
          if (page === 'home') navHome();
          else if (page === 'feed') navFeed();
          else if (page === 'messages') navMessages();
        }}
        onPostAndGoToCategories={handlePostAndGoToCategories}
        onSelectCategory={handleSelectCategory}
        currentUser={currentUser}
        onLogout={handleLogout}
        onGoToLogin={() => setAuthPage('login')}
        onGoToRegister={() => setAuthPage('register')}
        onNavigate={navToPage}
        onSearch={handleSearch}
        cartCount={cartItems.reduce((s, i) => s + (i.qty || 1), 0)}
      />

      <main className="transition-opacity duration-300 flex-1">
        {selectedStore ? (
          <div className="animate-in fade-in duration-500">
            <StoreProfilePage
              storeData={selectedStore}
              currentUser={currentUser}
              onBack={clearStore}
              onMessage={() => navMessages({ 
                id: selectedStore.id, 
                name: selectedStore.name || 'Người bán', 
                avatar: getAvatarUrl(selectedStore.name, selectedStore.avatar)
              })}
              onOpenProductModal={(product) => {
                setSelectedStore(null);
                setSelectedProduct(product);
              }}
            />
          </div>
        ) : selectedProduct ? (
          <div className="animate-in fade-in duration-500">
            <ProductDetailPage
              product={selectedProduct}
              currentUser={currentUser}
              onBack={clearProduct}
              onOpenStore={() => setSelectedStore({
                id: selectedProduct.user_id,
                name: selectedProduct.full_name || 'Người bán',
                avatar: selectedProduct.avatar_url,
                department: selectedProduct.sellerDepartment
              })}
              onMessage={() => navMessages({ 
                id: selectedProduct.user_id, 
                name: selectedProduct.full_name || 'Người bán', 
                avatar: getAvatarUrl(selectedProduct.full_name, selectedProduct.avatar_url),
                postReference: {
                  itemId: selectedProduct.id,
                  content: selectedProduct.title || selectedProduct.content,
                  image: selectedProduct.image || selectedProduct.image_url,
                  price: selectedProduct.price
                }
              })}
              onBuy={() => handleBuyItem(selectedProduct)}
              onAddToCart={() => handleAddToCart(selectedProduct)}
            />
          </div>
        ) : currentPage === 'messages' ? (
          <div className="animate-in fade-in duration-500">
            <MessagePage 
              initialContact={activeChatContact} 
              currentUser={currentUser} 
              onOpenStore={(contactId, contactName, contactAvatar) => {
                setSelectedStore({ id: contactId, name: contactName, avatar: contactAvatar });
              }}
              onLogout={handleLogout}
              onBuyItem={handleBuyItem}
            />
          </div>
        ) : (
          <>
            {/* ── User pages ── */}
            {currentPage === 'profile' && <div className="animate-in fade-in duration-500">
                <ProfilePage 
                currentUser={currentUser} 
                onOpenProduct={(p) => setSelectedProduct(p)} 
                onOpenChat={(c) => navMessages(c)} 
                onEdit={handleEditProduct}
                refreshTrigger={refreshTrigger}
                onLogout={handleLogout}
              />
            </div>}
            {currentPage === 'history' && <div className="animate-in fade-in duration-500"><HistoryPage currentUser={currentUser} /></div>}
            {currentPage === 'wishlist' && (
              <div className="animate-in fade-in duration-500">
                <WishlistPage
                  currentUser={currentUser}
                  onBack={navHome}
                  onOpenProduct={(p) => setSelectedProduct(p)}
                />
              </div>
            )}
            {currentPage === 'settings' && <div className="animate-in fade-in duration-500"><SettingsPage currentUser={currentUser} onUpdateUser={setCurrentUser} /></div>}
            {currentPage === 'green-life' && <div className="animate-in fade-in duration-500"><GreenLifePage onGoToFeed={() => setCurrentPage('feed')} /></div>}
            {currentPage === 'cart' && (
              <div className="animate-in fade-in duration-500">
                <CartPage
                  cartItems={cartItems}
                  onUpdateCart={handleUpdateCartQty}
                  onRemoveItem={handleRemoveFromCart}
                  onBack={() => window.history.length > 1 ? navHome() : navHome()}
                  onCheckout={handleCartCheckout}
                  onContinueShopping={navHome}
                />
              </div>
            )}
            {currentPage === 'checkout' && (
              <div className="animate-in fade-in duration-500">
                <CheckoutPage
                  cartItems={checkoutItems}
                  currentUser={currentUser}
                  onBack={() => {
                    if (checkoutItems.length > 0 && cartItems.some(ci => checkoutItems.some(co => co.cartId === ci.cartId))) {
                      navToPage('cart');
                    } else {
                      setSelectedProduct(checkoutItems[0] ? { ...checkoutItems[0] } : null);
                      setCurrentPage('home');
                    }
                  }}
                  onSuccess={() => {
                    // Remove purchased items from cart
                    const purchasedIds = checkoutItems.map(i => i.cartId);
                    saveCart(cartItems.filter(i => !purchasedIds.includes(i.cartId)));
                    setCheckoutItems([]);
                  }}
                  onViewHistory={() => {
                    const purchasedIds = checkoutItems.map(i => i.cartId);
                    saveCart(cartItems.filter(i => !purchasedIds.includes(i.cartId)));
                    setCheckoutItems([]);
                    navToPage('history');
                  }}
                />
              </div>
            )}

            {/* Default Home Page View */}
            {currentPage === 'home' && !selectedCategory && (
              <div className="animate-in fade-in duration-500">
                <Hero onSelectCategory={handleSelectCategory} />
                <QuickActions onSelectCategory={handleSelectCategory} />
                <ProductGrid onOpenProductModal={(product) => setSelectedProduct(product)} refreshTrigger={refreshTrigger} />
              </div>
            )}

            {/* Category / Marketplace Grid View */}
            {currentPage === 'home' && selectedCategory && (
              <div className="animate-in fade-in duration-500">
                <CategoryGridView
                  categoryName={selectedCategory}
                  categoryId={selectedCategoryId}
                  products={items}
                  loadingItems={loadingItems}
                  errorItems={errorItems}
                  onClearCategory={clearCategory}
                  onFilterByCategory={(catId, catName) => handleSelectCategory(catName, catId)}
                  onOpenProductModal={(product) => setSelectedProduct(product)}
                  currentPage={currentPageNum}
                  totalPages={totalPages}
                  onPageChange={setCurrentPageNum}
                />
              </div>
            )}

            {/* Social Feed Page View */}
            {currentPage === 'feed' && (
              <div className="animate-in fade-in duration-500">
                <SocialFeed 
                  onOpenChat={(contact) => navMessages(contact)} 
                  onOpenStore={(contactId, contactName, contactAvatar) => {
                    setSelectedStore({ id: contactId, name: contactName, avatar: contactAvatar });
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {currentPage !== 'messages' && <Footer />}

      {/* Modals & Interactions */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingProduct(null);
        }}
        onPost={handleAddProduct}
        productData={editingProduct}
      />
      <ChatWidget onOpenChat={() => navMessages()} />
      <GreenAssistantBot />
    </div>
  );
}

export default App;
