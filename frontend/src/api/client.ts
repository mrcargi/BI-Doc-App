const API = '/api'

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn
}

function getToken(): string | null {
  return localStorage.getItem('pbi_token')
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers = new Headers(opts.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(API + path, { ...opts, headers })

  if (res.status === 401) {
    onUnauthorized?.()
    throw new Error('Sesion expirada')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.message || res.statusText)
  }

  return res.json() as Promise<T>
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await fetch(API + path)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Error')
  }
  return res.blob()
}
