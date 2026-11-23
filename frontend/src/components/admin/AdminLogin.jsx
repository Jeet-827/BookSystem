import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/api';

const AdminLogin = ({ onLogin, loading, error }) => {
  const [creds, setCreds] = useState({
    email: '',
    password: '',
  });

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
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
      const res = await api.post('/admin/auth/forgot-password', { email: forgotEmail });
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
      const res = await api.post('/admin/auth/reset-password', {
        email: forgotEmail,
        resetCode,
        newPassword,
      });
      setForgotMsg(res.data.message || 'Password reset successful!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setCreds((prev) => ({ ...prev, email: forgotEmail, password: newPassword }));
      }, 1500);
    } catch (err) {
      setForgotErr(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(creds);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#13161c] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-extrabold flex items-center justify-center mx-auto shadow-lg">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-extrabold font-display">Admin Portal</h2>
          <p className="text-xs text-gray-400">
            Sign in with administrator credentials to manage inventory & system configuration.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="email"
                required
                placeholder="admin@bookmart.com"
                value={creds.email}
                onChange={(e) => setCreds((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-black border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-400">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(creds.email);
                  setForgotStep(1);
                  setForgotErr('');
                  setForgotMsg('');
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={creds.password}
                onChange={(e) => setCreds((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full bg-black border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold rounded-xl text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Admin'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Admin Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
          <div className="bg-[#13161c] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-300 text-black rounded-xl">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Admin Reset</h3>
                <p className="text-[11px] text-gray-400">
                  {forgotStep === 1
                    ? 'Enter administrator email for verification code'
                    : 'Enter code & set new admin password'}
                </p>
              </div>
            </div>

            {forgotMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            {forgotErr && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{forgotErr}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@bookmart.com"
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Get Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">6-Digit Reset Code</label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {forgotLoading ? 'Resetting...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
