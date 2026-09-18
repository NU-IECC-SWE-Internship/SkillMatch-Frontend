import { apiRequest } from './api'

const ACCESS_KEY = 'skillmatch_access'
const REFRESH_KEY = 'skillmatch_refresh'

export type AuthTokens = {
  access: string
  refresh: string
}

export type LoginCredentials = {
  username: string
  password: string
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function saveTokens({ access, refresh }: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/api/auth/login/', {
    method: 'POST',
    body: credentials,
  })
  saveTokens(tokens)
  return tokens
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken()
  if (!refresh) {
    throw new Error('No refresh token')
  }

  const data = await apiRequest<{ access: string }>('/api/auth/refresh/', {
    method: 'POST',
    body: { refresh },
  })

  localStorage.setItem(ACCESS_KEY, data.access)
  return data.access
}

export function logout(): void {
  clearTokens()
}
