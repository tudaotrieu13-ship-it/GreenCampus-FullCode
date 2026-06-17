import React, { useState, useEffect } from 'react';
import {
  Truck, CreditCard, Smartphone, Wallet, CheckCircle2,
  ChevronLeft, MapPin, Phone, User, Package,
  ShieldCheck, Info, Loader2, Copy, Check, X
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from './ToastProvider';

const resolveImage = (url) => {
  if (!url) return 'https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Image';
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

// ──────────────────────────────────────────────────────────────
// QR Code Modal (hiện khi chọn chuyển khoản)
// ──────────────────────────────────────────────────────────────
const QRModal = ({ amount, onClose, onConfirm }) => {
  const [copied, setCopied] = useState(false);
  const accountNumber = '0123456789';
  const bankName = 'Vietcombank';
  const accountName = 'GREENCAMPUS PLATFORM';
  const transferContent = `GREENCAMPUS ${Date.now().toString().slice(-6)}`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#40916C] px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Thanh toán QR</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* QR placeholder */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 w-48 h-48 flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`BANK:${bankName};ACC:${accountNumber};AMT:${amount};MSG:${transferContent}`)}`}
                alt="QR Code"
                className="w-36 h-36 object-contain"
                onError={(e) => { e.target.style.display='none'; }}
              />
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Ngân hàng</p>
                <p className="font-bold text-gray-900">{bankName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Số tài khoản</p>
                <p className="font-bold text-gray-900 font-mono">{accountNumber}</p>
              </div>
              <button onClick={() => handleCopy(accountNumber)} className="text-[#2D6A4F] hover:bg-[#E1F0C4] p-1.5 rounded-lg transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Chủ tài khoản</p>
                <p className="font-bold text-gray-900">{accountName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-[#E1F0C4] rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-[#2D6A4F] mb-0.5">Số tiền</p>
                <p className="font-bold text-[#2D6A4F] text-lg">{Number(amount).toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1 mr-2">
                <p className="text-xs text-gray-500 mb-0.5">Nội dung CK</p>
                <p className="font-bold text-gray-900 text-sm font-mono">{transferContent}</p>
              </div>
              <button onClick={() => handleCopy(transferContent)} className="text-[#2D6A4F] hover:bg-[#E1F0C4] p-1.5 rounded-lg transition-colors flex-shrink-0">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mb-4 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            Sau khi chuyển khoản, nhấn xác nhận để hoàn tất đơn hàng. Đơn hàng sẽ được xử lý trong vòng 30 phút.
          </p>

          <button
            onClick={onConfirm}
            className="w-full bg-[#2D6A4F] hover:bg-[#40916C] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#2D6A4F]/30"
          >
            <CheckCircle2 size={20} /> Tôi đã chuyển khoản xong
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Success Modal
// ──────────────────────────────────────────────────────────────
const SuccessModal = ({ onViewHistory, onContinue }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 animate-in zoom-in-95 duration-200">
      <div className="w-20 h-20 bg-[#E1F0C4] rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={40} className="text-[#2D6A4F]" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
      <p className="text-gray-500 text-sm mb-6">Yêu cầu của bạn đã được ghi nhận. Người bán sẽ liên hệ sớm để sắp xếp giao hàng.</p>
      <div className="space-y-3">
        <button
          onClick={onViewHistory}
          className="w-full bg-[#2D6A4F] hover:bg-[#40916C] text-white font-bold py-3 rounded-xl transition-colors"
        >
          Xem lịch sử đơn hàng
        </button>
        <button
          onClick={onContinue}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// Main CheckoutPage
// ──────────────────────────────────────────────────────────────
const CheckoutPage = ({ cartItems = [], currentUser, onBack, onSuccess, onViewHistory }) => {
  const { showToast } = useToast();
  const savedInfo = JSON.parse(localStorage.getItem('greencampus_checkout_info')) || {};
  const [fullName, setFullName] = useState(savedInfo.fullName || currentUser?.full_name || '');
  const [phone, setPhone] = useState(savedInfo.phone || currentUser?.phone || '');
  const [address, setAddress] = useState(savedInfo.address || 'Ký túc xá (KTX)');
  const [customAddress, setCustomAddress] = useState(savedInfo.customAddress || '');
  const [note, setNote] = useState(savedInfo.note || '');
  const [payMethod, setPayMethod] = useState(savedInfo.payMethod || 'bank_transfer');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      onBack();
    }
  }, [cartItems, onBack]);

  const ADDRESSES = [
    'Ký túc xá (KTX)',
    'Nhà A1 - Ký túc xá khu A',
    'Nhà B2 - Ký túc xá khu B',
    'Cổng trường chính',
    'Thư viện trường',
    'Địa chỉ khác...',
  ];

  const PAY_METHODS = [
    { id: 'bank_transfer', icon: <CreditCard size={20} />, label: 'Chuyển khoản (Gặp mặt quét QR)', badge: 'Phổ biến' },
    { id: 'momo',          icon: <Smartphone size={20} />,  label: 'Ví điện tử (Gặp mặt chuyển tiền)' },
    { id: 'cod',           icon: <Wallet size={20} />,      label: 'Thanh toán tiền mặt trực tiếp' },
  ];

  const subtotal = cartItems.reduce((s, item) => s + (item.price || 0) * (item.qty || 1), 0);
  const shipping = 0; // Freeship KTX
  const total = subtotal + shipping;

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ và tên';
    if (!phone.trim() || !/^\d{9,11}$/.test(phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ';
    if (address === 'Địa chỉ khác...' && !customAddress.trim()) e.customAddress = 'Vui lòng nhập địa chỉ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    await submitOrder();
  };

  const submitOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('greencampus_token');
      const results = [];

      // TODO: Đổi thành gửi 1 mảng danh sách giỏ hàng lên server thay vì gọi fetch trong vòng lặp for
      // Việc gọi API trong vòng lặp có thể gây nghẽn cổ chai và lỗi partial (mua được 1 nửa thì rớt mạng)
      for (const item of cartItems) {
        let finalAddress = address === 'Địa chỉ khác...' ? customAddress : address;
        if (note.trim()) {
          finalAddress += ` | Ghi chú: ${note.trim()}`;
        }

        const res = await fetch(`${API_URL}/transactions/buy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_id: item.id || item.item_id || item.itemId,
            seller_id: item.user_id || item.seller_id,
            amount: item.price || 0,
            delivery_address: finalAddress,
            buyer_name: fullName,
            buyer_phone: phone,
            payment_method: payMethod,
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi giao dịch');
        results.push(data);
      }

      // Lưu thông tin thanh toán cho lần sau
      localStorage.setItem('greencampus_checkout_info', JSON.stringify({
        fullName, phone, address, customAddress, payMethod, note
      }));

      // Trigger instant notification refresh for the buyer
      window.dispatchEvent(new CustomEvent('greencampus:notif_refresh'));

      setShowQR(false);
      setShowSuccess(true);
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal
        onViewHistory={() => { setShowSuccess(false); onViewHistory(); }}
        onContinue={() => { setShowSuccess(false); onBack(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2D6A4F] font-medium transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
          <p className="text-gray-500 mt-1 text-sm">Hoàn tất đơn hàng để ủng hộ lối sống bền vững.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Forms */}
          <div className="lg:col-span-3 space-y-5">

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Truck size={18} className="text-[#2D6A4F]" /> Thông tin nhận hàng
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    <User size={12} className="inline mr-1" />Họ và tên
                  </label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    <Phone size={12} className="inline mr-1" />Số điện thoại
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  <MapPin size={12} className="inline mr-1" />Địa điểm nhận đồ
                </label>
                <select
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all bg-white appearance-none"
                >
                  {ADDRESSES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              {address === 'Địa chỉ khác...' && (
                <div className="mt-4">
                  <input
                    value={customAddress}
                    onChange={e => setCustomAddress(e.target.value)}
                    placeholder="Nhập địa chỉ cụ thể..."
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all ${errors.customAddress ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.customAddress && <p className="text-red-500 text-xs mt-1">{errors.customAddress}</p>}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-[#2D6A4F]" /> Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                {PAY_METHODS.map(pm => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      payMethod === pm.id
                        ? 'border-[#2D6A4F] bg-[#E1F0C4]/40'
                        : 'border-gray-100 hover:border-gray-300 bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      value={pm.id}
                      checked={payMethod === pm.id}
                      onChange={() => setPayMethod(pm.id)}
                      className="accent-[#2D6A4F] w-4 h-4"
                    />
                    <span className={`${payMethod === pm.id ? 'text-[#2D6A4F]' : 'text-gray-400'} transition-colors`}>
                      {pm.icon}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-800">{pm.label}</span>
                    {pm.badge && (
                      <span className="text-[10px] font-bold bg-[#2D6A4F] text-white px-2 py-0.5 rounded-full">
                        {pm.badge}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Note to seller */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={18} className="text-[#2D6A4F]" /> Ghi chú cho người bán
              </h2>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ví dụ: Giờ gặp mặt, gọi trước 30 phút..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] transition-all resize-none"
              />
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-5">Tóm tắt đơn hàng</h2>

              {/* Product list */}
              <div className="space-y-4 mb-5">
                {cartItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      <img
                        src={resolveImage(item.image || item.image_url)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Người bán: {item.full_name || 'Người bán'}</p>
                      {item.qty > 1 && <p className="text-xs text-gray-500">x{item.qty}</p>}
                      <p className="font-bold text-[#2D6A4F] text-sm mt-1">
                        {item.price === 0 ? 'Miễn phí' : `${(item.price * (item.qty || 1)).toLocaleString('vi-VN')}đ`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    Phí vận chuyển
                    <span className="text-[10px] bg-[#E1F0C4] text-[#2D6A4F] px-1.5 py-0.5 rounded font-bold">
                      FREESHIP
                    </span>
                  </span>
                  <span className="font-medium text-[#2D6A4F]">0đ</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline mb-6">
                <span className="font-bold text-gray-900">Tổng tiền</span>
                <span className="font-bold text-[#2D6A4F] text-2xl">{total.toLocaleString('vi-VN')}đ</span>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || cartItems.length === 0}
                className="w-full bg-[#2D6A4F] hover:bg-[#40916C] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#2D6A4F]/25 flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  <><CheckCircle2 size={20} /> Xác nhận đặt hàng</>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                Bằng cách đặt hàng, bạn đồng ý với{' '}
                <span className="text-[#2D6A4F] font-medium cursor-pointer hover:underline">
                  Quy định cộng đồng
                </span>{' '}
                của GreenCampus.
              </p>

              {/* Trust badges */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-[#2D6A4F]" />
                  <span>Giao dịch an toàn</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Truck size={14} className="text-[#2D6A4F]" />
                  <span>Freeship KTX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
