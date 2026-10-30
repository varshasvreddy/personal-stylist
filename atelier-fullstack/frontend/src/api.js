// Thin fetch wrapper: adds the login token, sends JSON or forms, and turns errors into readable messages.
const BASE = (import.meta.env.VITE_API_BASE || '') + '/api'
const TOKEN_KEY = 'atelier.token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

function messageFrom(data, status) {
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail
    const first = Object.entries(data).find(([, v]) => v)
    if (first) {
      const [field, v] = first
      const text = Array.isArray(v) ? v[0] : typeof v === 'string' ? v : JSON.stringify(v)
      return field === 'non_field_errors' ? String(text) : `${field.replace(/_/g, ' ')}: ${text}`
    }
  }
  if (status === 429) return 'Too many requests. Wait a moment and try again.'
  if (status >= 500) return 'The server had a problem. Try again in a moment.'
  return 'Something went wrong.'
}

async function request(path, { method = 'GET', json, form, signal } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Token ${token}`
  let body
  if (form) body = form
  else if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body, signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0)
  }
  if (res.status === 204) return null
  let data = null
  try { data = await res.json() } catch { /* empty or non-JSON body */ }
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('atelier:unauthorized'))
    throw new ApiError(messageFrom(data, res.status), res.status, data)
  }
  return data
}

export const api = {
  get: (p, o) => request(p, o),
  post: (p, json, o) => request(p, { method: 'POST', json, ...o }),
  patch: (p, json, o) => request(p, { method: 'PATCH', json, ...o }),
  del: (p) => request(p, { method: 'DELETE' }),
  postForm: (p, form, o) => request(p, { method: 'POST', form, ...o }),
}
