import {
  forceLogout,
  getAccessToken,
  refreshAccessToken,
} from './auth'


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  ''


// These routes must NOT send a Bearer token / try auto-refresh.
const NO_AUTH = new Set([
  '/api/auth/login/',
  '/api/auth/register/',
  '/api/auth/refresh/',
])


export class ApiError extends Error {
  status: number
  body: unknown

  constructor(
    message: string,
    status: number,
    body: unknown,
  ) {
    super(message)

    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}


type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
  skipAuth?: boolean
}


async function readJson(
  response: Response,
): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}


function messageFromBody(
  data: unknown,
  status: number,
): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as { detail: unknown }).detail === 'string'
  ) {
    return (data as { detail: string }).detail
  }

  return `Request failed (${status})`
}


export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    token,
    headers,
    skipAuth,
    ...init
  } = options

  const noAuth =
    skipAuth || NO_AUTH.has(path)


  async function send(
    access: string | null,
  ) {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...init,

        headers: {
          Accept: 'application/json',

          ...(body !== undefined
            ? {
                'Content-Type':
                  'application/json',
              }
            : {}),

          ...(access
            ? {
                Authorization:
                  `Bearer ${access}`,
              }
            : {}),

          ...headers,
        },

        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      },
    )

    return {
      response,
      data: await readJson(response),
    }
  }


  // First request
  let access: string | null = null

  if (!noAuth) {
    access =
      token !== undefined
        ? token
        : getAccessToken()
  }


  let {
    response,
    data,
  } = await send(access)


  // Access token expired -> refresh and retry once
  if (
    response.status === 401 &&
    !noAuth
  ) {
    try {
      const newAccess =
        await refreshAccessToken()

      ;({
        response,
        data,
      } = await send(newAccess))

    } catch {
      forceLogout()

      throw new ApiError(
        'Session expired. Please sign in again.',
        401,
        data,
      )
    }
  }


  // Request failed
  if (!response.ok) {
    throw new ApiError(
      messageFromBody(
        data,
        response.status,
      ),
      response.status,
      data,
    )
  }


  return data as T
}


export function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof TypeError) {
    return (
      'Cannot reach the server. ' +
      'Is the Django API running?'
    )
  }


  if (!(error instanceof ApiError)) {
    return (
      'Something went wrong. ' +
      'Please try again.'
    )
  }


  if (error.status === 401) {
    if (
      error.message
        .toLowerCase()
        .includes('session expired')
    ) {
      return error.message
    }

    return 'Incorrect username or password.'
  }


  if (
    typeof error.body === 'object' &&
    error.body !== null
  ) {
    for (
      const value of Object.values(
        error.body as Record<
          string,
          unknown
        >,
      )
    ) {
      if (
        Array.isArray(value) &&
        typeof value[0] === 'string'
      ) {
        return value[0]
      }
    }
  }


  return error.message
}