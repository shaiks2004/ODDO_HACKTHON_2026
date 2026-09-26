import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Check, Info, X } from 'lucide-react'
import { ApiError } from '../api/client'

export function friendlyError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Unable to connect to StockSense. Check the API connection and try again.'
  if (error.status === 401) return 'Your session has expired. Sign in again to continue.'
  if (error.status === 403) return 'You do not have permission to perform this action.'
  if (error.status === 404) return 'This record could not be found. Refresh the list and try again.'
  if (error.status === 409 && /inventory changed|adjustment/i.test(error.message)) return 'Inventory has changed since this adjustment was created. Refresh and try again.'
  if (error.status === 409 && /stock|free/i.test(error.message)) return 'There is not enough available stock for this operation.'
  if (error.status === 409) return error.message || 'This change conflicts with an existing record.'
  if (error.status === 422) return error.message || 'Please review the highlighted fields and try again.'
  if (error.status === 429) return 'Too many requests. Please try again shortly.'
  if (error.status >= 500) return 'StockSense could not complete that request. Please try again.'
  return error.message || 'The request could not be completed.'
}

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; kind: ToastKind; message: string }
let toastId = 0
let pushToast: ((kind: ToastKind, message: string) => void) | null = null

export function notify(kind: ToastKind, message: string) {
  pushToast?.(kind, message)
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([])
  useEffect(() => {
    pushToast = (kind, message) => {
      const id = ++toastId
      setItems((current) => [...current, { id, kind, message }])
      window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200)
    }
    return () => { pushToast = null }
  }, [])
  return <div className="toast-stack" aria-live="polite">{items.map((item) => <div className={`toast toast-${item.kind}`} key={item.id} role={item.kind === 'error' ? 'alert' : 'status'}>
    {item.kind === 'success' ? <Check size={17} /> : item.kind === 'error' ? <AlertCircle size={17} /> : <Info size={17} />}
    <span>{item.message}</span><button className="icon-button toast-close" aria-label="Dismiss notification" onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}><X size={15} /></button>
  </div>)}</div>
}

export function Button({ children, variant = 'primary', size = 'md', icon, type = 'button', disabled, onClick, className = '', form }: {
  children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; icon?: ReactNode; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void; className?: string; form?: string
}) {
  return <button type={type} form={form} className={`button button-${variant} button-${size} ${className}`} disabled={disabled} onClick={onClick}>{icon}{children}</button>
}

export function IconButton({ label, children, onClick, className = '' }: { label: string; children: ReactNode; onClick?: () => void; className?: string }) {
  return <button type="button" aria-label={label} title={label} className={`icon-button ${className}`} onClick={onClick}>{children}</button>
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const status = String(children).toLowerCase().replaceAll(' ', '-')
  return <span className={`badge ${tone ?? `badge-${status}`}`}>{children}</span>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`surface-card ${className}`}>{children}</section>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="page-header-action">{action}</div>}
  </div>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-mark"><Info size={20} /></span><strong>{title}</strong><p>{description}</p>{action}</div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function LoadingRows({ count = 5, columns = 4 }: { count?: number; columns?: number }) {
  return <div className="loading-rows" aria-label="Loading data">{Array.from({ length: count }, (_, row) => <div className="loading-row" key={row}>{Array.from({ length: columns }, (_, col) => <Skeleton className={col === 0 ? 'skeleton-wide' : ''} key={col} />)}</div>)}</div>
}

export function Modal({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const titleId = useId()
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="Close dialog" onClick={onClose}><X size={19} /></IconButton></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </section>
  </div>
}

export function FormField({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return <label className={`form-field ${error ? 'field-error' : ''}`}><span className="field-label">{label}</span>{children}{error ? <small className="field-message">{error}</small> : hint && <small className="field-hint">{hint}</small>}</label>
}

export function handleSubmit(handler: (event: FormEvent<HTMLFormElement>) => void) {
  return (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); handler(event) }
}