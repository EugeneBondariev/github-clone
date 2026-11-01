const BASE = '/api'

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('auth:logout'))
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface Repo {
  id: number
  name: string
  description: string | null
  ownerId: number
  createdAt: string
  updatedAt: string
  owner: { id: number; name: string }
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getRepos: () => request<Repo[]>('/repos'),

  getRepo: (id: number) => request<Repo>(`/repos/${id}`),

  createRepo: (name: string, description?: string) =>
    request<Repo>('/repos', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  updateRepo: (id: number, data: { name?: string; description?: string }) =>
    request<Repo>(`/repos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRepo: (id: number) => request<void>(`/repos/${id}`, { method: 'DELETE' }),
}
