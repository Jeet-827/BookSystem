import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import api from '../api/api';
import { AlertCircle, Lock, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import SEOHead from '../components/SEOHead';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (redirect === 'cart') {
        navigate('/cart');
      } else if (redirect && redirect.startsWith('/')) {
        navigate(redirect);
      } else if (redirect && redirect !== '/') {
        navigate(`/${redirect}`);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate, redirect, dispatch]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErr('');
    setForgotMsg('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (res.data.resetCode) {
        setResetCode(res.data.resetCode);
      }
      setForgotMsg(res.data.message || 'Reset code generated.');
      setForgotStep(2);
    } catch (err) {
      setForgotErr(err.response?.data?.message || 'Failed to request reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErr('');
    setForgotMsg('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        resetCode,
        newPassword,
      });
      setForgotMsg(res.data.message || 'Password reset successful!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setFormData((prev) => ({ ...prev, email: forgotEmail, password: newPassword }));
      }, 1500);
    } catch (err) {
      setForgotErr(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      dispatch(loginUser(formData));
    },
    [dispatch, formData]
  );

  return (
    <>
      <SEOHead
        title="Sign In – My Account"
        description="Sign in to your redkitindia account to access your digital eBook library."
        canonical="/login"
        noIndex={true}
      />
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-gray-900 font-display">
            Welcome Back
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to access your redkitindia account &amp; digital downloads
          </p>
        </div>

        {redirect === 'checkout' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
            <Lock size={15} className="text-amber-600 flex-shrink-0" />
            <span>Please log in to your account to complete your payment and unlock downloads.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(formData.email);
                  setForgotStep(1);
                  setForgotErr('');
                  setForgotMsg('');
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-gray-600 hover:text-black hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full bg-black text-white py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all shadow"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          New to redkitindia?{' '}
          <Link to="/register" className="font-bold text-black hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>

    {/* Forgot Password Modal */}
    {showForgotModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-black text-white rounded-xl">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Reset Password</h3>
              <p className="text-[11px] text-gray-500">
                {forgotStep === 1
                  ? 'Enter your email to receive a 6-digit reset code'
                  : 'Enter the code and your new password'}
              </p>
            </div>
          </div>

          {forgotMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{forgotMsg}</span>
            </div>
          )}

          {forgotErr && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <span>{forgotErr}</span>
            </div>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Account Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Get Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">6-Digit Reset Code</label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="e.g. 583921"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Resetting...' : 'Set New Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default Login;
