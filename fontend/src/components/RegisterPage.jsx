import React, { useState } from 'react';
import { Eye, EyeOff, Leaf, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';

// ── Defined OUTSIDE RegisterPage so React never re-creates it on re-render ────
// (defining a component inside another component causes focus loss on every keystroke)
const Field = ({ label, id, type = 'text', value, onChange, placeholder, error, suffix }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-200'
        } ${suffix ? 'pr-11' : ''}`}
      />
      {suffix}
    </div>
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

const RegisterPage = ({ onRegister, onGoToLogin }) => {
  const [form, setForm] = useState({
    fullName: '',
    mssv: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'Sinh viên',
    university: '',
    customUniversity: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())         errs.fullName = 'Vui lòng nhập họ tên.';
    if (!form.mssv.trim())             errs.mssv = form.accountType === 'Sinh viên' ? 'Vui lòng nhập MSSV.' : 'Vui lòng nhập Mã CB.';
    if (!form.university)              errs.university = 'Vui lòng chọn trường.';
    if (form.university === 'Khác' && !form.customUniversity.trim()) errs.customUniversity = 'Vui lòng nhập tên trường.';
    if (!form.email.includes('@'))     errs.email = 'Email không hợp lệ.';
    else if (!form.email.toLowerCase().endsWith('.edu.vn')) errs.email = 'Bắt buộc dùng email có đuôi .edu.vn';
    if (form.password.length < 6)      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          student_id: form.mssv.trim(),
          account_type: form.accountType,
          university: form.university === 'Khác' ? form.customUniversity.trim() : form.university
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || 'Đăng ký thất bại.');
        return;
      }

      // Save token
      localStorage.setItem('greencampus_token', data.token);

      setSuccess(true);
      // Auto-redirect after brief success flash
      setTimeout(() => {
        onRegister(data.user);
      }, 1200);
    } catch (err) {
      setApiError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E1F0C4]/60 via-white to-[#d0e6ac]/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Leaf className="text-[#2D6A4F]" size={32} strokeWidth={2.5} />
          <span className="text-3xl font-bold text-[#2D6A4F] tracking-tight">GreenCampus</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[16px] shadow-lg border border-gray-100 p-8">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-[#2D6A4F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Đăng ký thành công!</h3>
              <p className="text-gray-500 text-sm text-center">
                Chào mừng bạn đến với GreenCampus. Đang chuyển hướng...
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Tạo tài khoản mới</h2>
              <p className="text-gray-500 text-sm mb-6">Tham gia cộng đồng trao đổi đồ cũ sinh viên.</p>

              {/* API-level error (e.g. duplicate email) */}
              {apiError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-[10px] px-4 py-3 mb-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  label="Họ và tên"
                  id="fullName"
                  value={form.fullName}
                  onChange={update('fullName')}
                  placeholder="Nguyễn Văn A"
                  error={errors.fullName}
                />

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vai trò</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="accountType" 
                        value="Sinh viên" 
                        checked={form.accountType === 'Sinh viên'}
                        onChange={update('accountType')}
                        className="text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]"
                      />
                      <span className="text-sm text-gray-700">Sinh viên</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="accountType" 
                        value="Giảng viên / Cán bộ" 
                        checked={form.accountType === 'Giảng viên / Cán bộ'}
                        onChange={update('accountType')}
                        className="text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F]"
                      />
                      <span className="text-sm text-gray-700">Giảng viên / Cán bộ</span>
                    </label>
                  </div>
                </div>

                <Field
                  label={form.accountType === 'Sinh viên' ? "Mã số sinh viên (MSSV)" : "Mã cán bộ (MCB)"}
                  id="mssv"
                  value={form.mssv}
                  onChange={update('mssv')}
                  placeholder={form.accountType === 'Sinh viên' ? "SV2021001" : "CB1023"}
                  error={errors.mssv}
                />

                {/* University Selection */}
                <div>
                  <label htmlFor="university" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Trường Đại học
                  </label>
                  <select
                    id="university"
                    value={form.university}
                    onChange={update('university')}
                    className={`w-full border rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all bg-white ${errors.university ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  >
                    <option value="" disabled>-- Chọn trường Đại học --</option>
                    <option value="Đại học Giao thông Vận tải">Đại học Giao thông Vận tải</option>
                    <option value="Đại học Bách Khoa Hà Nội">Đại học Bách Khoa Hà Nội</option>
                    <option value="Đại học Kinh tế Quốc dân">Đại học Kinh tế Quốc dân</option>
                    <option value="Đại học Công nghệ - ĐHQGHN">Đại học Công nghệ - ĐHQGHN</option>
                    <option value="Học viện Bưu chính Viễn thông">Học viện Bưu chính Viễn thông</option>
                    <option value="Đại học Xây dựng Hà Nội">Đại học Xây dựng Hà Nội</option>
                    <option value="Đại học Ngoại thương">Đại học Ngoại thương</option>
                    <option value="Đại học Sư phạm Hà Nội">Đại học Sư phạm Hà Nội</option>
                    <option value="Khác">Khác...</option>
                  </select>
                  {errors.university && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.university}
                    </p>
                  )}
                  
                  {form.university === 'Khác' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={form.customUniversity}
                        onChange={update('customUniversity')}
                        placeholder="Nhập tên trường của bạn"
                        className={`w-full border rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all bg-white ${errors.customUniversity ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                      />
                      {errors.customUniversity && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.customUniversity}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Field
                  label="Email nội bộ trường (.edu.vn)"
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="example@student.edu.vn"
                  error={errors.email}
                />

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full border rounded-[12px] px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirmPw" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPw"
                      type={showCpw ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full border rounded-[12px] px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpw(!showCpw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2D6A4F] text-white font-semibold py-3 rounded-[12px] hover:bg-[#245a42] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Đăng ký'}
                </button>
              </form>


            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <button
              onClick={onGoToLogin}
              className="text-[#2D6A4F] font-semibold hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
