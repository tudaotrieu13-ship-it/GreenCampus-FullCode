import React, { useState } from 'react';
import { Eye, EyeOff, Leaf, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config/api';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useToast } from './ToastProvider';

const LoginPage = ({ onLogin, onGoToRegister }) => {
  const { showToast } = useToast();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Đăng nhập thất bại.');
        return;
      }

      // Save token to localStorage
      localStorage.setItem('greencampus_token', data.token);

      // Call App-level login handler with real user from DB
      onLogin(data.user, remember);
    } catch (err) {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Social login mock
    showToast(`${provider} login is coming soon!`);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#E1F0C4]/60 via-white to-[#d0e6ac]/40 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="text-[#2D6A4F]" size={32} strokeWidth={2.5} />
            <span className="text-3xl font-bold text-[#2D6A4F] tracking-tight">GreenCampus</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[16px] shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Chào mừng trở lại!</h2>
            <p className="text-gray-500 text-sm mb-6">Đăng nhập để tiếp tục mua bán đồ cũ.</p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-[10px] px-4 py-3 mb-5">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email / MSSV
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@student.edu.vn"
                  className="w-full border border-gray-200 rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all"
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-[#2D6A4F] font-medium hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-[12px] px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#E1F0C4] focus:border-[#2D6A4F] transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#E1F0C4] cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D6A4F] text-white font-semibold py-3 rounded-[12px] hover:bg-[#245a42] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Đăng nhập'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Chưa có tài khoản?{' '}
            <button
              onClick={onGoToRegister}
              className="text-[#2D6A4F] font-semibold hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </>
  );
};

export default LoginPage;
