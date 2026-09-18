import { apiRequest } from './api';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  saveTokens,
  clearTokens,
  isAuthenticated,
  type AuthTokens,
} from './tokens';

export {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  saveTokens,
  clearTokens,
  isAuthenticated,
};
export type { AuthTokens };

export type LoginCredentials = {
  username: string;
  password: string;
};

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const tokens = await apiRequest<AuthTokens>('/api/auth/login/', {
    method: 'POST',
    body: credentials,
  });
  saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token');
  }

  const data = await apiRequest<{ access: string }>('/api/auth/refresh/', {
    method: 'POST',
    body: { refresh },
  });

  setAccessToken(data.access);
  return data.access;
}

export function logout(): void {
  clearTokens();
}
