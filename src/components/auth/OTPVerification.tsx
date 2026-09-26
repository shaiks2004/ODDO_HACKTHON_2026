import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, AlertCircle, ArrowRight, Loader2, Code2 } from 'lucide-react';
import { OTPInput } from './OTPInput';
import { VerificationMode } from '../../types/auth';
import { DEV_FALLBACK_OTP } from '../../services/auth/mockAuthService';

interface OTPVerificationProps {
  mode: VerificationMode;
  email: string;
  maskedEmail: string;
  onVerify: (otp: string) => Promise<{ success: boolean; errorType?: string; errorMessage?: string }>;
  onResend: () => Promise<{ success: boolean; cooldownSeconds?: number; error?: string }>;
  onBack: () => void;
  onSuccess: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  mode,
  email,
  maskedEmail,
  onVerify,
  onResend,
  onBack,
  onSuccess,
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(42);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendNotified, setResendNotified] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length < 6 || isVerifying || isSuccess) return;

    setIsVerifying(true);
    setErrorMessage('');

    const result = await onVerify(code);
    setIsVerifying(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setErrorMessage(result.errorMessage || 'That verification code is incorrect.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    setOtp('');

    const res = await onResend();
    setIsResending(false);

    if (res.success) {
      setCountdown(res.cooldownSeconds || 42);
      setResendNotified(true);
      setTimeout(() => setResendNotified(false), 3000);
    } else {
      setErrorMessage(res.error || 'Unable to send code. Please try again.');
    }
  };

  const title =
    mode === 'login'
      ? 'Verify your email'
      : mode === 'signup'
      ? 'Verify your email'
      : 'Verify recovery code';

  if (isSuccess) {
    return (
      <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-200" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Email verified
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'signup' ? 'Your StockSense account is ready.' : 'Welcome back.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">
          We sent a 6-digit verification code to
        </p>
        <p className="font-mono text-xs font-semibold text-slate-800">
          {maskedEmail || email}
        </p>
        <p className="text-xs text-slate-400 pt-0.5">
          Enter the code below to continue.
        </p>
      </div>

      <div className="py-1">
        <OTPInput
          value={otp}
          onChange={(newVal) => {
            setOtp(newVal);
            if (errorMessage) setErrorMessage('');
          }}
          onComplete={(fullCode) => {
            handleVerify(fullCode);
          }}
          hasError={Boolean(errorMessage)}
          disabled={isVerifying}
          autoFocus={true}
        />
      </div>

      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-center text-xs space-y-0.5">
        <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-slate-500">
          <Code2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold uppercase">Development Mode</span>
        </div>
        <p className="text-xs font-mono text-slate-700">
          Verification code: <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">{DEV_FALLBACK_OTP}</span>
        </p>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {resendNotified && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>New verification code sent.</span>
        </div>
      )}

      <div className="text-center text-xs font-medium text-slate-600">
        {countdown > 0 ? (
          <span>
            Resend code in{' '}
            <span className="font-mono font-bold text-slate-900">
              {formatCountdown(countdown)}
            </span>
          </span>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-slate-900 hover:underline cursor-pointer disabled:opacity-50 ml-1"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={otp.length < 6 || isVerifying}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer hover:underline"
          >
            Use another email
          </button>
        </div>
      </div>
    </div>
  );
};
