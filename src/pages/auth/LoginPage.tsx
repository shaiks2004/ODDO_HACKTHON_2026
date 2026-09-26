import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('m.vance@stocksense.io');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useInventory();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target if intercepted by ProtectedRoute
  const destination = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const success = await login({ email: email.trim(), password, rememberMe });
    setIsSubmitting(false);

    if (success) {
      navigate(destination, { replace: true });
    } else {
      setError('Invalid credentials. Please verify your email and password.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitted(true);
    showToast('info', 'Password Reset Requested', `Instructions sent to ${forgotEmail || email}`);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setResetSubmitted(false);
    }, 2000);
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    const success = await login({ email: demoEmail });
    if (success) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <Boxes className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            <span>StockSense</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 border border-slate-300">
              ERP
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Smart Inventory. Simple Operations.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 border border-slate-200 rounded-lg sm:px-8 shadow-2xs">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your corporate credentials to access warehouse operations.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative rounded shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
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
              <div className="relative rounded shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
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

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
              Quick Demo Personas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('m.vance@stocksense.io')}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-800 block truncate">Marcus Vance</span>
                <span className="text-[10px] text-slate-500 font-mono">Manager (Full Access)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('e.rostova@stocksense.io')}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-800 block truncate">Elena Rostova</span>
                <span className="text-[10px] text-slate-500 font-mono">Warehouse Staff</span>
              </button>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New team member?{' '}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
                Create an account
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
        subtitle="Generate a password recovery link for your account."
        maxWidth="sm"
      >
        {resetSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900">Recovery Instructions Sent</h4>
            <p className="text-xs text-slate-500">
              Check your inbox for step-by-step account recovery.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Work Email Address
              </label>
              <input
                type="email"
                required
                value={forgotEmail || email}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="m.vance@stocksense.io"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
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
