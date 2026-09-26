import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('m.vance@stocksense.io');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const { login, showToast } = useInventory();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate('/dashboard');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitted(true);
    showToast('info', 'Password Reset Link Generated', `Password reset instructions sent to ${forgotEmail || email}`);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setResetSubmitted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
            <Boxes className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          StockSense
        </h1>
        <p className="mt-1 text-center text-xs font-medium text-slate-500">
          Inventory Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access warehouse operations.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Session
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 shadow-xs transition-colors cursor-pointer mt-2"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('m.vance@stocksense.io');
                  login('m.vance@stocksense.io');
                  navigate('/dashboard');
                }}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">Marcus Vance</span>
                <span className="text-[10px] text-slate-500">Manager</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('e.rostova@stocksense.io');
                  login('e.rostova@stocksense.io');
                  navigate('/dashboard');
                }}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs transition-colors"
              >
                <span className="font-semibold text-slate-800 block truncate">Elena Rostova</span>
                <span className="text-[10px] text-slate-500">Staff</span>
              </button>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-slate-900 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          StockSense Enterprise Frontend &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password"
        subtitle="We will generate a secure reset link for your account."
        maxWidth="sm"
      >
        {resetSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900">Reset Link Sent</h4>
            <p className="text-xs text-slate-500">
              Check your inbox for step-by-step credentials recovery.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={forgotEmail || email}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="m.vance@stocksense.io"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
