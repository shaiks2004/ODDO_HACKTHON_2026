import type { TokenResponse } from '../types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'stocksense.access'
const REFRESH_KEY = 'stocksense.refresh'
const EMAIL_KEY = 'stocksense.email'
let refreshPromise: Promise<boolean> | null = null

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const authStorage = {
  access: () => sessionStorage.getItem(TOKEN_KEY),
  refresh: () => sessionStorage.getItem(REFRESH_KEY),
  email: () => sessionStorage.getItem(EMAIL_KEY) ?? '',
  set(tokens: TokenResponse, email?: string) {
    sessionStorage.setItem(TOKEN_KEY, tokens.access_token)
    if (tokens.refresh_token) sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token)
    if (email) sessionStorage.setItem(EMAIL_KEY, email)
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(EMAIL_KEY)
  },
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((entry) => typeof entry === 'object' && entry && 'msg' in entry ? String(entry.msg) : '')
        .filter(Boolean)
        .join('. ')
    }
  }
  return fallback
}

async function requestRaw(path: string, init: RequestInit = {}, withAuth = true): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (withAuth && authStorage.access()) headers.set('Authorization', `Bearer ${authStorage.access()}`)
  return fetch(`${apiBaseUrl}${path}`, { ...init, headers })
}

async function refreshAccess(): Promise<boolean> {
  const refreshToken = authStorage.refresh()
  if (!refreshToken) return false
  try {
    const response = await requestRaw('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, false)
    if (!response.ok) return false
    authStorage.set(await response.json() as TokenResponse)
    return true
  } catch {
    return false
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response = await requestRaw(path, init)
  if (response.status === 401 && authStorage.refresh() && !path.endsWith('/auth/refresh')) {
    refreshPromise ??= refreshAccess().finally(() => { refreshPromise = null })
    if (await refreshPromise) response = await requestRaw(path, init)
  }
  if (response.status === 401 && authStorage.access()) {
    authStorage.clear()
    window.dispatchEvent(new Event('stocksense:unauthorized'))
  }
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() as unknown : await response.text()
  if (!response.ok) {
    const fallback = response.status === 429 ? 'Too many requests. Please try again shortly.' : 'The request could not be completed.'
    throw new ApiError(response.status, messageFromBody(body, fallback))
  }
  return body as T
}

export const get = <T>(path: string) => apiRequest<T>(path)
export const post = <T>(path: string, body?: unknown) => apiRequest<T>(path, {
  method: 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})
export const patch = <T>(path: string, body: unknown) => apiRequest<T>(path, {
  method: 'PATCH',
  body: JSON.stringify(body),
})

export async function download(path: string, filename: string): Promise<void> {
  const text = await apiRequest<string>(path)
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function queryString(values: Record<string, string | number | boolean | null | undefined>): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const result = params.toString()
  return result ? `?${result}` : ''
}