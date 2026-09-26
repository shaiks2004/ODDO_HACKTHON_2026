import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  MoveRight,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authStorage } from '../api/client'
import { authApi } from '../api/services'
import { friendlyError, notify } from '../components/ui'
import type { TokenResponse } from '../types'

type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset'

export function AuthPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)

  const initialMode: AuthMode = location.pathname === '/forgot-password'
    ? 'forgot'
    : location.pathname === '/reset-password'
      ? 'reset'
      : query.get('mode') === 'signup'
        ? 'signup'
        : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoginOtp, setIsLoginOtp] = useState(false)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResendOtp() {
    if (!email.trim()) {
      notify('error', 'Please enter your email address first.')
      return
    }
    setResending(true)
    try {
      const res = await authApi.resendOtp(email)
      notify('success', res.message || 'A new verification code has been issued.')
    } catch (err) {
      notify('error', friendlyError(err))
    } finally {
      setResending(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signup') {
        const signupRes = await authApi.signup(name, email, password)
        notify('success', signupRes.message || 'Verification code sent. Please enter the OTP to activate your account.')
        setMode('verify')
      } else if (mode === 'verify') {
        const tokens: TokenResponse = isLoginOtp
          ? await authApi.verifyLoginOtp(email, otp)
          : await authApi.verifySignup(email, otp)
        authStorage.set(tokens, email)
        notify('success', 'Account verified successfully!')
        onAuthenticated()
        navigate('/', { replace: true })
      } else if (mode === 'login') {
        if (isLoginOtp) {
          const reqRes = await authApi.loginOtp(email, password)
          notify('success', reqRes.message || 'Login verification code sent.')
          setMode('verify')
        } else {
          const tokens = await authApi.login(email, password)
          authStorage.set(tokens, email)
          onAuthenticated()
          navigate('/', { replace: true })
        }
      } else if (mode === 'forgot') {
        const res = await authApi.forgotPassword(email)
        notify('success', res.message || 'Reset code issued if account exists.')
        setMode('reset')
      } else if (mode === 'reset') {
        const res = await authApi.resetPassword(email, otp, password)
        notify('success', res.message || 'Password updated. You can sign in now.')
        setMode('login')
        navigate('/login', { replace: true })
      }
    } catch (error) {
      const msg = friendlyError(error)
      notify('error', msg)
      if (msg.toLowerCase().includes('not verified')) {
        setMode('verify')
      }
    } finally {
      setBusy(false)
    }
  }

  const isRecovery = mode === 'forgot' || mode === 'reset'
  const title = mode === 'signup'
    ? 'Create your workspace account'
    : mode === 'verify'
      ? 'Verify your account'
      : mode === 'forgot'
        ? 'Reset your password'
        : mode === 'reset'
          ? 'Choose a new password'
          : 'Welcome back'

  const description = mode === 'signup'
    ? 'Start bringing every stock movement into view.'
    : mode === 'verify'
      ? `Enter the 6-digit verification code sent to ${email || 'your email'}.`
      : mode === 'forgot'
        ? 'Enter your account email to request a reset code.'
        : mode === 'reset'
          ? 'Use your reset code to secure your account again.'
          : 'Sign in to continue managing your inventory.'

  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-orbit-one" />
      <div className="auth-backdrop auth-orbit-two" />
      <div className="auth-top-brand">
        <div className="brand-symbol"><Boxes size={20} /></div>
        <span className="brand-name">Stock<span>Sense</span></span>
        <span className="auth-tagline">Inventory, in balance.</span>
      </div>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="story-kicker"><span className="story-kicker-dot" /> STOCK OPERATIONS, CONNECTED</div>
          <h1>Make room for<br /><span>better flow.</span></h1>
          <p>See what is on hand, know what needs attention, and keep every warehouse move accounted for.</p>
          <div className="story-mini-panel">
            <div className="story-panel-head">
              <div><small>WAREHOUSE PULSE</small><strong>Stock activity</strong></div>
              <span className="live-label"><i /> Live</span>
            </div>
            <div className="story-bars" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="story-panel-foot">
              <span><PackageCheck size={14} /> Receipts tracked</span>
              <span className="story-arrow"><ArrowUpRight size={15} /></span>
            </div>
          </div>
          <div className="story-proof">
            <ShieldCheck size={16} />
            <span>Traceable movements. Clear stock picture.</span>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-mark">
            {mode === 'verify' ? <KeyRound size={19} /> : <LockKeyhole size={19} />}
          </div>
          <div className="auth-card-heading">
            <h2 id="auth-title">{title}</h2>
            <p>{description}</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="auth-field">
                <span>Your name</span>
                <div className="auth-input">
                  <input
                    autoComplete="name"
                    required
                    maxLength={150}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Alex Morgan"
                  />
                </div>
              </label>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
              <label className="auth-field">
                <span>Email address</span>
                <div className="auth-input">
                  <Mail size={17} />
                  <input
                    autoComplete="email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
              </label>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <label className="auth-field">
                <span>Verification OTP Code</span>
                <div className="auth-input">
                  <KeyRound size={17} />
                  <input
                    autoComplete="one-time-code"
                    required
                    minLength={4}
                    maxLength={20}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="Enter 6-digit OTP code"
                  />
                </div>
                {mode === 'verify' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      disabled={resending || busy}
                      onClick={handleResendOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: 0,
                      }}
                    >
                      <RotateCcw size={13} /> {resending ? 'Sending…' : 'Resend code'}
                    </button>
                  </div>
                )}
              </label>
            )}

            {mode !== 'forgot' && mode !== 'verify' && (
              <label className="auth-field">
                <span>
                  {mode === 'reset' ? 'New password' : 'Password'}
                  {mode === 'login' && <Link to="/forgot-password" onClick={() => setMode('forgot')}>Forgot password?</Link>}
                </span>
                <div className="auth-input">
                  <LockKeyhole size={17} />
                  <input
                    autoComplete={mode === 'signup' ? 'new-password' : mode === 'login' ? 'current-password' : 'new-password'}
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={mode === 'login' ? 1 : 8}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((current) => !current)}
                  >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode !== 'login' && <small>Use uppercase, lowercase, a number, and a symbol.</small>}
              </label>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isLoginOtp}
                    onChange={(e) => setIsLoginOtp(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Require OTP verification for login
                </label>
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? (isLoginOtp ? 'Request Login OTP' : 'Sign in')
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'verify'
                      ? 'Verify & Continue'
                      : mode === 'forgot'
                        ? 'Request reset code'
                        : 'Update password'}
              <MoveRight size={17} />
            </button>
          </form>

          <div className="auth-card-foot">
            {isRecovery || mode === 'verify' ? (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="auth-back-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            ) : (
              <p>
                {mode === 'signup' ? 'Already have an account?' : 'New to StockSense?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {mode === 'signup' ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="auth-footer">
        <span>© StockSense</span>
        <span>Thoughtful control for every stock move</span>
      </div>
    </main>
  )
}