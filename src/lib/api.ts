import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './tokens';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
  skipAuthRefresh?: boolean;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function requestNewToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = (await res.json()) as { access: string };
    setAccessToken(data.access);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  { body, token, headers, skipAuthRefresh, ...init }: RequestOptions = {},
): Promise<T> {
  const activeToken = token !== undefined ? token : getAccessToken();

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...((headers as Record<string, string>) || {}),
  };

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isAuthEndpoint =
    path.includes('/api/auth/login/') || path.includes('/api/auth/refresh/');

  if (response.status === 401 && !skipAuthRefresh && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = requestNewToken().finally(() => {
        isRefreshing = false;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof (data as { detail: unknown }).detail === 'string'
        ? (data as { detail: string }).detail
        : `Request failed (${response.status})`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/** Turn any thrown error into a short message for the UI. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Cannot reach the server. Is the Django API running?'
  }

  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.'
  }

  if (error.status === 401) {
    return 'Incorrect username or password.'
  }

  if (typeof error.body === 'object' && error.body !== null) {
    for (const value of Object.values(error.body as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0]
      }
    }
  }

  return error.message
}
