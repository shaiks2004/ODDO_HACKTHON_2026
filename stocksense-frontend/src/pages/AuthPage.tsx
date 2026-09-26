import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Boxes, Check, Eye, EyeOff, LockKeyhole, Mail, MoveRight, PackageCheck, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authStorage } from '../api/client'
import { authApi } from '../api/services'
import { friendlyError, notify } from '../components/ui'
import type { TokenResponse } from '../types'

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset'

export function AuthPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const mode: AuthMode = location.pathname === '/forgot-password' ? 'forgot' : location.pathname === '/reset-password' ? 'reset' : query.get('mode') === 'signup' ? 'signup' : 'login'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login' || mode === 'signup') {
        const tokens: TokenResponse = mode === 'signup'
          ? await authApi.signup(name, email, password)
          : await authApi.login(email, password)
        authStorage.set(tokens, email)
        onAuthenticated()
        navigate('/', { replace: true })
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(email)
        setComplete(true)
        notify('success', 'Reset request received. Follow your organization’s password-reset process for the code.')
      } else {
        await authApi.resetPassword(email, otp, password)
        notify('success', 'Password updated. You can sign in now.')
        navigate('/login', { replace: true })
      }
    } catch (error) {
      notify('error', friendlyError(error))
    } finally {
      setBusy(false)
    }
  }

  const isRecovery = mode === 'forgot' || mode === 'reset'
  const title = mode === 'signup' ? 'Create your workspace account' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Welcome back'
  const description = mode === 'signup' ? 'Start bringing every stock movement into view.' : mode === 'forgot' ? 'Enter your account email to request a reset code.' : mode === 'reset' ? 'Use your reset code to secure your account again.' : 'Sign in to continue managing your inventory.'

  return <main className="auth-page">
    <div className="auth-backdrop auth-orbit-one" /><div className="auth-backdrop auth-orbit-two" />
    <div className="auth-top-brand"><div className="brand-symbol"><Boxes size={20} /></div><span className="brand-name">Stock<span>Sense</span></span><span className="auth-tagline">Inventory, in balance.</span></div>
    <div className="auth-layout">
      <section className="auth-story">
        <div className="story-kicker"><span className="story-kicker-dot" /> STOCK OPERATIONS, CONNECTED</div>
        <h1>Make room for<br /><span>better flow.</span></h1>
        <p>See what is on hand, know what needs attention, and keep every warehouse move accounted for.</p>
        <div className="story-mini-panel">
          <div className="story-panel-head"><div><small>WAREHOUSE PULSE</small><strong>Stock activity</strong></div><span className="live-label"><i /> Live</span></div>
          <div className="story-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="story-panel-foot"><span><PackageCheck size={14} /> Receipts tracked</span><span className="story-arrow"><ArrowUpRight size={15} /></span></div>
        </div>
        <div className="story-proof"><ShieldCheck size={16} /><span>Traceable movements. Clear stock picture.</span></div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-mark"><LockKeyhole size={19} /></div>
        <div className="auth-card-heading"><h2 id="auth-title">{title}</h2><p>{description}</p></div>
        {complete && mode === 'forgot' ? <div className="auth-success"><span><Check size={17} /></span><div><strong>Request received</strong><p>If the account exists, the server has recorded a reset request. The current backend does not send email/SMS codes; ask your system administrator for the code.</p></div></div> : <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <label className="auth-field"><span>Your name</span><div className="auth-input"><input autoComplete="name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></div></label>}
          <label className="auth-field"><span>Email address</span><div className="auth-input"><Mail size={17} /><input autoComplete="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div></label>
          {mode === 'reset' && <label className="auth-field"><span>Reset code</span><div className="auth-input"><input autoComplete="one-time-code" required minLength={4} maxLength={20} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter your code" /></div></label>}
          {mode !== 'forgot' && <label className="auth-field"><span>{mode === 'reset' ? 'New password' : 'Password'}{mode === 'login' && <Link to="/forgot-password">Forgot password?</Link>}</span><div className="auth-input"><LockKeyhole size={17} /><input autoComplete={mode === 'signup' ? 'new-password' : mode === 'login' ? 'current-password' : 'new-password'} type={visible ? 'text' : 'password'} required minLength={mode === 'login' ? 1 : 8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} /><button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{mode !== 'login' && <small>Use uppercase, lowercase, a number, and a symbol.</small>}</label>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Request reset code' : 'Update password'}<MoveRight size={17} /></button>
        </form>}
        <div className="auth-card-foot">{isRecovery ? <Link to="/login" className="auth-back-link"><ArrowLeft size={15} /> Back to sign in</Link> : <p>{mode === 'signup' ? 'Already have an account?' : 'New to StockSense?'} <Link to={mode === 'signup' ? '/login' : '/login?mode=signup'}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</Link></p>}</div>
      </section>
    </div>
    <div className="auth-footer"><span>© StockSense</span><span>Thoughtful control for every stock move</span></div>
  </main>
}