const ACCESS_KEY = 'skillmatch_access';
const REFRESH_KEY = 'skillmatch_refresh';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) || localStorage.getItem('refresh_token');
}

export function setAccessToken(access: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem('access_token', access);
}

export function saveTokens({ access, refresh }: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
