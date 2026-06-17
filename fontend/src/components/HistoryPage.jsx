import React, { useState, useEffect } from 'react';
import { CheckCircle2, Truck, XCircle, Clock, ShoppingCart, Tag, Loader2, Star, X, QrCode } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from './ToastProvider';

const STATUS_MAP = {
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  SHIPPING:  { label: 'Đang giao',  color: 'bg-blue-100 text-blue-600',   Icon: Truck },
  CANCELLED: { label: 'Đã hủy',     color: 'bg-red-100 text-red-500',     Icon: XCircle },
  PENDING:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
};

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/100x100?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <cfg.Icon size={11} />{cfg.label}
    </span>
  );
};

const RatingModal = ({ transaction, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ transaction_id: transaction.id, rated_user_id: transaction.seller_id, rating, comment });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-[24px] shadow-xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Đánh giá người bán</h3>
        <p className="text-sm text-gray-500 mb-6 truncate">{transaction.item_title}</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              size={36}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className={`cursor-pointer transition-colors ${s <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn (tuỳ chọn)..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-brand-green text-white font-bold py-3 rounded-[14px] hover:bg-brand-green/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          Gửi đánh giá
        </button>
      </div>
    </div>
  );
};

const SellerQRModal = ({ transaction, onClose }) => {
  const qrUrl = `https://img.vietqr.io/image/${transaction.bank_name}-${transaction.bank_account_no}-compact2.png?amount=${transaction.amount}&addInfo=GC${transaction.id}&accountName=${encodeURIComponent(transaction.bank_account_name || '')}`;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1A1A1A] rounded-[24px] shadow-2xl p-8 w-full max-w-md relative text-white border border-gray-800">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-6 text-center">Xác nhận đặt dịch vụ</h3>

        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Ngân hàng</span>
            <span className="font-medium text-right">{transaction.bank_name || 'Chưa cài đặt'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Số tài khoản</span>
            <span className="font-medium">{transaction.bank_account_no || 'Chưa cài đặt'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Chủ TK</span>
            <span className="font-medium">{transaction.bank_account_name || 'Chưa cài đặt'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Số tiền</span>
            <span className="font-bold text-red-400">{Number(transaction.amount).toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400">Nội dung CK <span className="text-yellow-500">⚠</span></span>
            <span className="font-bold text-yellow-500">GC{transaction.id}</span>
          </div>
        </div>

        {transaction.bank_name && transaction.bank_account_no ? (
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-2 rounded-xl mb-2">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <p className="text-xs text-gray-400">Quét QR bằng app ngân hàng</p>
          </div>
        ) : (
          <div className="text-center text-sm text-red-400 mb-6 bg-red-400/10 py-3 rounded-lg border border-red-400/20">
            Người bán chưa thiết lập thông tin thanh toán!
          </div>
        )}


        <button
          onClick={onClose}
          className="w-full bg-brand-green text-white font-bold py-3.5 rounded-xl hover:bg-brand-green/90 transition-colors"
        >
          Đã hiểu, đóng mã QR
        </button>
      </div>
    </div>
  );
};

const Row = ({ item, type, ratedIds, onRate, onConfirmRole, onShowQR, onCancel, currentUser }) => {
  const isBuyer = item.buyer_id === currentUser?.id;
  const isSeller = item.seller_id === currentUser?.id;
  const canRate = isBuyer && item.status === 'COMPLETED' && !ratedIds.includes(item.id);
  
  const handleBuyerConfirm = () => onConfirmRole(item, 'buyer');
  const handleSellerConfirm = () => onConfirmRole(item, 'seller');
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="w-16 h-16 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
        <img src={resolveImage(item.item_image)} alt={item.item_title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{item.item_title}</p>
        <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
          {isBuyer ? `Người bán: ${item.seller_name || 'Không rõ'}` : `Người mua: ${item.buyer_name || 'Không rõ'}`}
          <span className="mx-2 text-gray-300">•</span>{new Date(item.created_at).toLocaleDateString('vi-VN')}
        </p>
        {(() => {
          let address = item.delivery_address || '';
          let note = '';
          if (address.includes(' | Ghi chú: ')) {
            const parts = address.split(' | Ghi chú: ');
            address = parts[0];
            note = parts[1];
          }
          if (!address && !item.buyer_phone && !note) return null;
          return (
            <div className="text-xs text-gray-600 bg-gray-50/80 rounded-[8px] p-2 border border-gray-100 inline-block mt-0.5">
              {item.buyer_phone && <p><span className="font-semibold text-gray-700">SĐT:</span> {item.buyer_phone}</p>}
              {address && <p className="mt-0.5"><span className="font-semibold text-gray-700">Điểm hẹn:</span> {address}</p>}
              {note && <p className="mt-0.5 text-[#2D6A4F]"><span className="font-semibold text-[#2D6A4F]">Ghi chú:</span> {note}</p>}
            </div>
          );
        })()}
      </div>
      <div className="flex-shrink-0 text-right hidden sm:block">
        {Number(item.amount) === 0
          ? <span className="text-sm font-bold text-[#2D6A4F]">Miễn phí</span>
          : <span className="text-sm font-bold text-gray-900">{Number(item.amount).toLocaleString('vi-VN')}đ</span>
        }
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <StatusBadge status={item.status} />

        {type === 'pending' && isBuyer && (
          <button 
            onClick={item.buyer_confirmed ? undefined : handleBuyerConfirm}
            disabled={item.buyer_confirmed}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              item.buyer_confirmed 
                ? 'bg-gray-100 text-gray-500 cursor-default' 
                : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-sm'
            }`}
          >
            {item.buyer_confirmed ? <CheckCircle2 size={12}/> : null}
            {item.buyer_confirmed ? 'Đã xác nhận nhận hàng' : 'Đã nhận được hàng'}
          </button>
        )}

        {type === 'pending' && isBuyer && !item.buyer_confirmed && (
          <button 
            onClick={() => onCancel(item)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 mt-2"
          >
            Hủy đơn
          </button>
        )}

        {type === 'pending' && isSeller && (
          <div className="flex flex-col gap-1.5 items-end">
            <button 
              onClick={() => onShowQR(item)}
              className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <QrCode size={12} /> Xem QR thanh toán
            </button>
            <button 
              onClick={item.seller_confirmed ? undefined : handleSellerConfirm}
              disabled={item.seller_confirmed}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                item.seller_confirmed 
                  ? 'bg-gray-100 text-gray-500 cursor-default' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm'
              }`}
            >
              {item.seller_confirmed ? <CheckCircle2 size={12}/> : null}
              {item.seller_confirmed ? 'Đã xác nhận nhận tiền' : 'Đã nhận được tiền'}
            </button>
          </div>
        )}

        {canRate && (
          <button
            onClick={() => onRate(item)}
            className="text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full hover:bg-yellow-100 transition-colors flex items-center gap-1"
          >
            <Star size={11} className="fill-yellow-500 text-yellow-500" /> Đánh giá
          </button>
        )}
        {isBuyer && item.status === 'COMPLETED' && ratedIds.includes(item.id) && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-green-500" /> Đã đánh giá
          </span>
        )}
      </div>
    </div>
  );
};

const HistoryPage = ({ currentUser }) => {
  const [tab, setTab] = useState('pending');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratedIds, setRatedIds] = useState([]);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const { showToast, confirm } = useToast();

  useEffect(() => {
    fetchTransactions();
    fetchRatedIds();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('greencampus_token');
      if (!token) return;
      const res = await fetch(`${API_URL}/transactions/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTransactions(await res.json());
      } else {
        const data = await res.json();
        showToast("Lỗi tải lịch sử giao dịch: " + (data.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối khi tải lịch sử: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatedIds = async () => {
    try {
      const token = localStorage.getItem('greencampus_token');
      if (!token) return;
      const res = await fetch(`${API_URL}/ratings/my-rated`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRatedIds(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch rated ids:', err);
    }
  };

  const handleSubmitRating = async ({ transaction_id, rated_user_id, rating, comment }) => {
    const token = localStorage.getItem('greencampus_token');
    try {
      const res = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ transaction_id, rated_user_id, rating, comment })
      });
      if (res.ok) {
        setRatedIds(prev => [...prev, transaction_id]);
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleConfirmRole = async (item, role) => {
    const isConfirmed = await confirm(`Xác nhận đã nhận được ${role === 'buyer' ? 'hàng' : 'tiền'} cho đơn này?`);
    if (!isConfirmed) return;

    const token = localStorage.getItem('greencampus_token');
    try {
      const res = await fetch(`${API_URL}/transactions/${item.id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(prev => prev.map(t => {
          if (t.id === item.id) {
            const updated = { ...t };
            if (role === 'buyer') updated.buyer_confirmed = 1;
            if (role === 'seller') updated.seller_confirmed = 1;
            if (data.status) updated.status = data.status;
            return updated;
          }
          return t;
        }));
        // Trigger notification refresh for the other party
        setTimeout(() => window.dispatchEvent(new CustomEvent('greencampus:notif_refresh')), 800);
      }
    } catch (err) {
      console.error('Failed to confirm:', err);
    }
  };

  const handleCancelTransaction = async (item) => {
    const isConfirmed = await confirm(`Bạn có chắc chắn muốn hủy đơn hàng này không?`);
    if (!isConfirmed) return;

    const token = localStorage.getItem('greencampus_token');
    try {
      const res = await fetch(`${API_URL}/transactions/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== item.id));
        showToast('Đã hủy đơn hàng thành công', 'success');
        setTimeout(() => window.dispatchEvent(new CustomEvent('greencampus:notif_refresh')), 800);
      } else {
        const data = await res.json();
        showToast(data.message || 'Lỗi khi hủy đơn hàng', 'error');
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
      showToast('Lỗi kết nối khi hủy đơn', 'error');
    }
  };

  const pendingItems = transactions.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const boughtItems = transactions.filter(t => t.buyer_id === currentUser?.id && t.status === 'COMPLETED');
  const soldItems   = transactions.filter(t => t.seller_id === currentUser?.id && t.status === 'COMPLETED');
  
  let currentDisplayItems = [];
  if (tab === 'pending') currentDisplayItems = pendingItems;
  if (tab === 'bought') currentDisplayItems = boughtItems;
  if (tab === 'sold') currentDisplayItems = soldItems;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-green" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử mua/bán</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tất cả giao dịch của bạn.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng giao dịch', value: currentDisplayItems.length, Icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
            { label: 'Hoàn thành', value: currentDisplayItems.filter(i => i.status === 'COMPLETED').length, Icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
            { label: 'Tổng giá trị', value: `${(currentDisplayItems.filter(i => i.status !== 'CANCELLED').reduce((a, i) => a + Number(i.amount), 0) / 1000).toFixed(0)}k đ`, Icon: Tag, color: 'bg-[#E1F0C4] text-[#2D6A4F]' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className={`${color} rounded-[16px] p-4 flex items-center gap-3`}>
              <Icon size={22} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium opacity-70 truncate">{label}</p>
                <p className="text-sm sm:text-lg font-bold truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'pending', label: `Đồ đang chờ (${pendingItems.length})` },
            { key: 'bought', label: `Đồ đã mua (${boughtItems.length})` },
            { key: 'sold',   label: `Đồ đã bán (${soldItems.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === key ? 'bg-[#2D6A4F] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2D6A4F]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {currentDisplayItems.length > 0 ? (
            currentDisplayItems.map(item => (
              <Row
                key={item.id}
                item={item}
                type={tab}
                ratedIds={ratedIds}
                onRate={setRatingTarget}
                onConfirmRole={handleConfirmRole}
                onShowQR={setQrTarget}
                onCancel={handleCancelTransaction}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">Chưa có giao dịch nào</p>
              <p className="text-sm mt-1">Các giao dịch của bạn sẽ xuất hiện ở đây.</p>
            </div>
          )}
        </div>
      </div>

      {ratingTarget && (
        <RatingModal
          transaction={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onSubmit={handleSubmitRating}
        />
      )}

      {qrTarget && (
        <SellerQRModal
          transaction={qrTarget}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
};

export default HistoryPage;
