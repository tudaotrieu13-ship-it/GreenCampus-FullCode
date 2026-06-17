import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, ChevronRight, AlertCircle, Loader2, Package, X } from 'lucide-react';
import DetailedProductCard from './DetailedProductCard';
import { API_URL } from '../config/api';

const PRICE_BANDS = [
  { label: 'Tất cả', min: null, max: null },
  { label: 'Tặng miễn phí', min: 0, max: 0 },
  { label: 'Dưới 50.000đ', min: 1, max: 49999 },
  { label: '50.000đ – 200.000đ', min: 50000, max: 200000 },
  { label: '200.000đ – 500.000đ', min: 200001, max: 500000 },
  { label: 'Trên 500.000đ', min: 500001, max: null },
  { label: 'Tùy chỉnh', min: 'custom', max: 'custom' },
];

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá thấp → cao', value: 'price_asc' },
  { label: 'Giá cao → thấp', value: 'price_desc' },
];

const isNewCondition = (condition) => {
  if (!condition) return false;
  const c = condition.toLowerCase();
  if (c.includes('mới')) return true;
  const match = c.match(/(\d+)\s*%/);
  if (match && Number(match[1]) >= 90) return true;
  return false;
};

const CategoryGridView = ({
  categoryName,
  categoryId,
  products = [],
  loadingItems = false,
  errorItems = null,
  onClearCategory,
  onFilterByCategory,
  onOpenProductModal,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [errorCats, setErrorCats] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceBand, setPriceBand] = useState(categoryId === 'free' ? 'Tặng miễn phí' : 'Tất cả');
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [conditionFilter, setConditionFilter] = useState('Tất cả');
  const [deptFilter, setDeptFilter] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (categoryId === 'free') setPriceBand('Tặng miễn phí');
  }, [categoryId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        setErrorCats(null);
        const res = await fetch(`${API_URL}/categories`);
        if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);
        setCategories(await res.json());
      } catch (err) {
        setErrorCats(err.message);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Unique departments from loaded products
  const departments = useMemo(() => {
    const set = new Set(products.map(p => p.sellerDepartment).filter(Boolean));
    return ['Tất cả', ...Array.from(set).sort()];
  }, [products]);

  // Reset dept filter when products change and current dept no longer exists
  useEffect(() => {
    if (deptFilter !== 'Tất cả' && !departments.includes(deptFilter)) {
      setDeptFilter('Tất cả');
    }
  }, [departments, deptFilter]);

  const activeFiltersCount = [
    searchTerm,
    priceBand !== 'Tất cả' ? priceBand : null,
    conditionFilter !== 'Tất cả' ? conditionFilter : null,
    deptFilter !== 'Tất cả' ? deptFilter : null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setPriceBand('Tất cả');
    setCustomMin('');
    setCustomMax('');
    setConditionFilter('Tất cả');
    setDeptFilter('Tất cả');
    setSortBy('newest');
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      // 1. Local text search
      if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // 2. Price band
      const price = Number(product.price) || 0;
      const band = PRICE_BANDS.find(b => b.label === priceBand);
      if (band && band.min !== null && band.min !== 'custom') {
        if (price < band.min) return false;
        if (band.max !== null && price > band.max) return false;
      }
      if (priceBand === 'Tùy chỉnh') {
        const mn = customMin !== '' ? Number(customMin) : null;
        const mx = customMax !== '' ? Number(customMax) : null;
        if (mn !== null && price < mn) return false;
        if (mx !== null && price > mx) return false;
      }

      // 3. Condition
      if (conditionFilter === 'Mới / Gần mới' && !isNewCondition(product.condition)) return false;
      if (conditionFilter === 'Đã sử dụng' && isNewCondition(product.condition)) return false;

      // 4. Department
      if (deptFilter !== 'Tất cả' && product.sellerDepartment !== deptFilter) return false;

      return true;
    });

    // Sort
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    // 'newest' is default order from API (already DESC created_at)

    return result;
  }, [products, searchTerm, priceBand, customMin, customMax, conditionFilter, deptFilter, sortBy]);

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onClearCategory} className="hover:text-brand-green transition-colors font-medium">Trang chủ</button>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-bold">{categoryName}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
          <button onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-2 font-bold text-gray-800 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <SlidersHorizontal size={18} /> Lọc kết quả {activeFiltersCount > 0 && <span className="bg-brand-green text-white px-2 py-0.5 rounded-full text-xs">{activeFiltersCount}</span>}
          </button>
        </div>

        {/* ── Sidebar ── */}
        <aside className={`${mobileFilterOpen ? 'fixed inset-0 z-50 bg-black/50 flex justify-end' : 'hidden lg:block w-full lg:w-64 flex-shrink-0'}`}>
          <div className={`${mobileFilterOpen ? 'w-4/5 sm:w-[320px] h-full bg-white p-5 overflow-y-auto space-y-6 shadow-2xl slide-in-from-right-full animate-in duration-300' : 'sticky top-24 bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 space-y-6'}`}>

            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal size={18} /> Bộ lọc
                {activeFiltersCount > 0 && (
                  <span className="bg-brand-green text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-brand-green hover:underline flex items-center gap-1">
                    <X size={11} /> Xóa lọc
                  </button>
                )}
                {mobileFilterOpen && (
                  <button onClick={() => setMobileFilterOpen(false)} className="lg:hidden bg-gray-100 p-1.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Text search */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm trong danh mục..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-3">Danh mục</h4>
              {loadingCats && <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin" /><span>Đang tải...</span></div>}
              {errorCats && <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-2"><AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>Lỗi: {errorCats}</span></div>}
              {!loadingCats && !errorCats && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="category_filter" checked={categoryId === null || categoryId === 'free'} onChange={() => onFilterByCategory(null, 'Tất cả danh mục')} className="w-4 h-4 text-brand-green focus:ring-brand-green border-gray-300" />
                    <span className="text-sm text-gray-600 group-hover:text-brand-green transition-colors">Tất cả danh mục</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="category_filter" checked={categoryId === cat.id} onChange={() => onFilterByCategory(cat.id, cat.name)} className="w-4 h-4 text-brand-green focus:ring-brand-green border-gray-300" />
                      <span className="text-sm text-gray-600 group-hover:text-brand-green transition-colors">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Condition filter */}
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-3">Tình trạng</h4>
              <div className="space-y-2">
                {['Tất cả', 'Mới / Gần mới', 'Đã sử dụng'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="condition_filter" checked={conditionFilter === opt} onChange={() => setConditionFilter(opt)} className="w-4 h-4 text-brand-green focus:ring-brand-green border-gray-300" />
                    <span className="text-sm text-gray-600 group-hover:text-brand-green transition-colors">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-3">Mức giá</h4>
              <div className="space-y-2">
                {PRICE_BANDS.map(b => (
                  <label key={b.label} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="price" checked={priceBand === b.label} onChange={() => setPriceBand(b.label)} className="w-4 h-4 text-brand-green focus:ring-brand-green border-gray-300" />
                    <span className="text-sm text-gray-600 group-hover:text-brand-green transition-colors">{b.label}</span>
                  </label>
                ))}
              </div>
              {priceBand === 'Tùy chỉnh' && (
                <div className="mt-3 flex items-center gap-2">
                  <input type="number" min="0" placeholder="Từ" value={customMin} onChange={e => setCustomMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-green" />
                  <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                  <input type="number" min="0" placeholder="Đến" value={customMax} onChange={e => setCustomMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-green" />
                </div>
              )}
            </div>

            {/* Department filter */}
            {departments.length > 1 && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-3">Khoa / Trường</h4>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {departments.map(dept => (
                    <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="dept_filter" checked={deptFilter === dept} onChange={() => setDeptFilter(dept)} className="w-4 h-4 text-brand-green focus:ring-brand-green border-gray-300" />
                      <span className="text-sm text-gray-600 group-hover:text-brand-green transition-colors truncate">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1">
          {/* Header row */}
          <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{categoryName}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {loadingItems ? 'Đang tải...' : `${filteredProducts.length} sản phẩm${activeFiltersCount > 0 ? ' (đã lọc)' : ''}`}
              </p>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-brand-green cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Loading skeleton */}
          {loadingItems && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/3 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loadingItems && errorItems && (
            <div className="flex items-start gap-3 text-red-500 bg-red-50 border border-red-100 rounded-[16px] p-4">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Không thể tải sản phẩm</p>
                <p className="text-xs mt-0.5 text-red-400">{errorItems}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loadingItems && !errorItems && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <Package size={48} className="opacity-30" />
              <p className="font-medium">Không tìm thấy sản phẩm phù hợp.</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearAllFilters} className="text-sm text-brand-green hover:underline">Xóa bộ lọc</button>
              )}
            </div>
          )}

          {/* Grid */}
          {!loadingItems && !errorItems && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {filteredProducts.map(product => (
                  <DetailedProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onOpenProductModal(product)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => {
                      onPageChange(currentPage - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Trước
                  </button>

                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => {
                          onPageChange(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      onPageChange(currentPage + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryGridView;
