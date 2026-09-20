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

export type RegisterCredentials = {
  username: string
  email: string
  password: string
}

// JWT = three parts: header.payload.signature
// We only read "exp" from the middle part to know if time ran out.
function isExpired(token: string): boolean {
  try {
    const middle = token.split('.')[1]
    const { exp } = JSON.parse(atob(middle)) as { exp?: number }
    if (!exp) return true
    return exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Logged in if access still works, OR refresh can still get a new access.
export function isAuthenticated(): boolean {
  const access = getAccessToken()
  const refresh = getRefreshToken()

  if (access && !isExpired(access)) return true
  if (refresh && !isExpired(refresh)) return true

  clearTokens()
  return false
}

// Used when the session is fully dead (refresh failed / expired).
export function forceLogout(): void {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/api/auth/login/', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
  })
  saveTokens(tokens)
  return tokens
}

export async function register(
  credentials: RegisterCredentials,
): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/api/auth/register/', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
  })
  saveTokens(tokens)
  return tokens
}

// Ask Django for a new access token using the refresh token.
export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken()

  if (!refresh || isExpired(refresh)) {
    clearTokens()
    throw new Error('Session expired')
  }

  try {
    const data = await apiRequest<{ access: string }>('/api/auth/refresh/', {
      method: 'POST',
      body: { refresh },
      skipAuth: true,
    })
    localStorage.setItem(ACCESS_KEY, data.access)
    return data.access
  } catch {
    clearTokens()
    throw new Error('Session expired')
  }
}

export function logout(): void {
  clearTokens()
}
