import React, { useState, useRef } from 'react';
import { Save, CheckCircle2, User, Lock, Bell, Eye, EyeOff, Loader2, Camera, CreditCard } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from './ToastProvider';

const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `http://localhost:5000${url}`;
};

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group py-3 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`}
      aria-checked={checked}
      role="switch"
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </label>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden mb-5">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/60">
      <div className="w-7 h-7 rounded-full bg-[#E1F0C4] flex items-center justify-center text-[#2D6A4F]">
        <Icon size={14} />
      </div>
      <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, type = 'text', value, onChange, placeholder, readOnly, suffix }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full border rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all ${
          readOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'border-gray-200 bg-white'
        } ${suffix ? 'pr-11' : ''}`}
      />
      {suffix}
    </div>
  </div>
);

const SettingsPage = ({ currentUser, onUpdateUser }) => {
  const user = currentUser || { full_name: 'Đào Triệu Tú', email: 'daotrieutu@student.edu.vn', student_id: 'SV2021001', department: 'Khoa CNTT', university: 'Đại học Bách Khoa Hà Nội' };

  const [form, setForm] = useState({ 
    full_name: user.full_name || user.name || '', 
    student_id: user.student_id || user.mssv || '', 
    department: user.department || user.faculty || '', 
    university: user.university || '',
    bank_name: user.bank_name || '',
    bank_account_no: user.bank_account_no || '',
    bank_account_name: user.bank_account_name || ''
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [notifs, setNotifs] = useState({ messages: true, orders: true, promotions: false, weekly: false });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(resolveImage(user.avatar_url || user.avatar));
  const fileInputRef = useRef(null);

  const upd = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const updPw = (field) => (e) => setPwForm(p => ({ ...p, [field]: e.target.value }));
  const toggleNotif = (key) => (v) => setNotifs(p => ({ ...p, [key]: v }));
  const toggleShow = (key) => () => setShowPw(p => ({ ...p, [key]: !p[key] }));

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (pwForm.next && pwForm.next !== pwForm.confirm) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('department', form.department);
      formData.append('university', form.university);
      formData.append('bank_name', form.bank_name);
      formData.append('bank_account_no', form.bank_account_no);
      formData.append('bank_account_name', form.bank_account_name);
      if (pwForm.next) formData.append('password', pwForm.next);
      if (avatarFile) formData.append('avatar', avatarFile);

      const token = localStorage.getItem('greencampus_token');
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Cập nhật thất bại');
      
      const updatedUser = await res.json();
      if (onUpdateUser) onUpdateUser(updatedUser);
      setPwForm({ current: '', next: '', confirm: '' });

      showToast('Đã lưu thông tin cá nhân thành công!', 'success');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg('Đã có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setLoading(false);
    }
  };

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={toggleShow(field)} tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
      {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý thông tin và tùy chọn tài khoản.</p>
          </div>
          {/* Success toast */}
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-[12px] animate-in fade-in slide-in-from-right-4 duration-300">
              <CheckCircle2 size={16} />
              Đã lưu thay đổi!
            </div>
          )}
        </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-[12px]">
              {errorMsg}
            </div>
          )}

        <form onSubmit={handleSave}>

          {/* ── Thông tin cơ bản ── */}
          <SectionCard icon={User} title="Thông tin cơ bản">
            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
              <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <img src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`}
                  alt={user.full_name || user.name} className="w-16 h-16 rounded-full border-2 border-[#E1F0C4] object-cover group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                  <Camera size={20} className="text-white" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user.full_name || user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Họ và tên" value={form.full_name} onChange={upd('full_name')} placeholder="Nguyễn Văn A" />
              <Field label="MSSV"      value={form.student_id} onChange={upd('student_id')} placeholder="SV2021001" readOnly />
              <Field label="Khoa"      value={form.department} onChange={upd('department')} placeholder="Khoa CNTT" />
              <Field label="Trường"    value={form.university} onChange={upd('university')} placeholder="Đại học ABC" />
            </div>
          </SectionCard>

          {/* ── Tài khoản & Bảo mật ── */}
          <SectionCard icon={Lock} title="Tài khoản & Bảo mật">
            <div className="space-y-4">
              <Field label="Email" value={user.email} readOnly />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input type={showPw.current ? 'text' : 'password'} value={pwForm.current} onChange={updPw('current')}
                    placeholder="••••••••" className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all" />
                  <EyeBtn field="current" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <input type={showPw.next ? 'text' : 'password'} value={pwForm.next} onChange={updPw('next')}
                      placeholder="Tối thiểu 6 ký tự" className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all" />
                    <EyeBtn field="next" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirm} onChange={updPw('confirm')}
                      placeholder="Nhập lại mật khẩu mới" className="w-full border border-gray-200 rounded-[12px] px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all" />
                    <EyeBtn field="confirm" />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Cài đặt thanh toán ── */}
          <SectionCard icon={CreditCard} title="Cài đặt thanh toán">
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Thông tin này được dùng để tạo mã QR tự động khi người mua chọn chuyển khoản.</p>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ngân hàng</label>
                <select
                  value={form.bank_name}
                  onChange={upd('bank_name')}
                  className="w-full border border-gray-200 bg-white rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all cursor-pointer"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="MB">MB Bank</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="Agribank">Agribank</option>
                  <option value="ACB">ACB</option>
                  <option value="TPBank">TPBank</option>
                  <option value="VPBank">VPBank</option>
                  <option value="Sacombank">Sacombank</option>
                  <option value="VIB">VIB</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Mã ngân hàng dùng để tạo QR VietQR.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field 
                  label="Số tài khoản" 
                  value={form.bank_account_no} 
                  onChange={upd('bank_account_no')} 
                  placeholder="Ví dụ: 0369497545" 
                />
                <div>
                  <Field 
                    label="Tên chủ tài khoản" 
                    value={form.bank_account_name} 
                    onChange={(e) => setForm(p => ({ ...p, bank_account_name: e.target.value.toUpperCase() }))} 
                    placeholder="Ví dụ: NGUYEN VAN A" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Viết HOA không dấu theo chuẩn ngân hàng.</p>
                </div>
              </div>
              
              {/* QR Code Preview */}
              {form.bank_name && form.bank_account_no && form.bank_account_name && (
                <div className="mt-4 p-4 border border-gray-100 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QR Mẫu (150.000đ - Nội dung: GREEN123)</p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={`https://img.vietqr.io/image/${form.bank_name}-${form.bank_account_no}-compact2.png?amount=150000&addInfo=GREEN123&accountName=${encodeURIComponent(form.bank_account_name)}`}
                      alt="VietQR Preview"
                      className="w-32 h-32 bg-white rounded-lg p-1 border border-gray-200"
                    />
                    <div className="text-sm text-gray-600">
                      Đây là mã QR người mua sẽ quét để chuyển khoản cho bạn khi giao dịch.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Thông báo ── */}
          <SectionCard icon={Bell} title="Thông báo">
            <Toggle checked={notifs.messages}   onChange={toggleNotif('messages')}   label="Tin nhắn mới" />
            <Toggle checked={notifs.orders}     onChange={toggleNotif('orders')}     label="Cập nhật đơn hàng" />
            <Toggle checked={notifs.promotions} onChange={toggleNotif('promotions')} label="Khuyến mãi & ưu đãi" />
            <Toggle checked={notifs.weekly}     onChange={toggleNotif('weekly')}     label="Bản tin hàng tuần" />
          </SectionCard>

          {/* ── Save button ── */}
          <button type="submit" disabled={loading}
            className="w-full bg-[#2D6A4F] text-white font-bold py-3.5 rounded-[16px] hover:bg-[#245a42] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
