import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../store/slices/authSlice';
import { AlertCircle, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { validateGenuineEmail } from '../utils/emailValidator';
import SEOHead from '../components/SEOHead';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

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
    setLocalError('');
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Enforce Genuine Email Validation (Blocks test.com, disposable & placeholder emails)
      const emailValidation = validateGenuineEmail(formData.email);
      if (!emailValidation.isValid) {
        setLocalError(emailValidation.message);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
      dispatch(
        registerUser({
          name: formData.name.trim(),
          email: emailValidation.sanitizedEmail,
          password: formData.password,
        })
      );
    },
    [formData, dispatch]
  );

  return (
    <>
      <SEOHead
        title="Create Account"
        description="Create a free redkitindia account for instant digital eBook access."
        canonical="/register"
        noIndex={true}
      />
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Create Account
            </h1>
            <p className="text-xs text-gray-500">
              Join redkitindia for orders &amp; instant digital book access
            </p>
          </div>

        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Alex Johnson"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700" htmlFor="email">
                Email Address
              </label>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck size={11} /> Genuine Email Required
              </span>
            </div>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="name@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Please use a genuine email (e.g. Gmail, Yahoo, Outlook). Test and disposable domains (e.g. test.com) are not accepted.
            </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-gray-400" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="register-submit-btn"
            className="w-full bg-black text-white py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all shadow"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-black hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Register;
