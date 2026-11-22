import { API_URL } from '@/lib/config';

import { ApiError } from './errors';

/** Pagination block returned by list endpoints. */
export type PageMeta = { total: number; page: number; limit: number; totalPages: number };

type Envelope<T> = { success: boolean; data?: T; meta?: PageMeta; message?: string; details?: unknown };

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  body?: unknown;
  query?: QueryParams;
  /** Send the access token and refresh on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Supplied by the auth store, so this module doesn't import it (avoids a cycle).
 */
export type AuthHooks = {
  getAccessToken: () => string | null;
  /** Exchange the stored refresh token for a new access token; null if that's impossible. */
  refreshAccessToken: () => Promise<string | null>;
  /** The session can't be recovered: sign out locally. */
  onAuthFailure: () => void;
};

let authHooks: AuthHooks | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function configureApiAuth(hooks: AuthHooks) {
  authHooks = hooks;
}

/**
 * One refresh at a time. Parallel requests that all get a 401 share the same
 * refresh call; the backend rotates refresh tokens, so two refreshes in a row
 * would revoke each other.
 */
export function refreshAccessTokenOnce(): Promise<string | null> {
  if (!authHooks) return Promise.resolve(null);
  if (!refreshInFlight) {
    refreshInFlight = authHooks.refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function buildUrl(path: string, query?: QueryParams) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

async function send<T>(method: Method, path: string, opts: RequestOptions, token: string | null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), opts.timeoutMs ?? 15000);
  const onExternalAbort = () => controller.abort('cancelled');
  opts.signal?.addEventListener('abort', onExternalAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') {
      throw new ApiError('timeout', 0, 'The server took too long to respond.');
    }
    if (opts.signal?.aborted) throw error;
    throw new ApiError('network', 0, "Can't reach the server.");
  } finally {
    clearTimeout(timeout);
    opts.signal?.removeEventListener('abort', onExternalAbort);
  }

  if (response.status === 204) return { response, envelope: { success: true } as Envelope<T> };

  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError('parse', response.status, `Unexpected response from the server (${response.status}).`);
  }
  return { response, envelope };
}

export async function apiRequest<T>(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<{ data: T; meta?: PageMeta }> {
  const useAuth = opts.auth !== false && authHooks !== null;
  let { response, envelope } = await send<T>(method, path, opts, useAuth ? authHooks!.getAccessToken() : null);

  if (response.status === 401 && useAuth) {
    const fresh = await refreshAccessTokenOnce();
    if (!fresh) {
      authHooks!.onAuthFailure();
      throw new ApiError('http', 401, envelope.message ?? 'Your session has ended. Please log in again.');
    }
    ({ response, envelope } = await send<T>(method, path, opts, fresh));
    if (response.status === 401) {
      authHooks!.onAuthFailure();
      throw new ApiError('http', 401, envelope.message ?? 'Your session has ended. Please log in again.');
    }
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError('http', response.status, envelope.message ?? `Request failed (${response.status}).`, envelope.details);
  }
  return { data: envelope.data as T, meta: envelope.meta };
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiRequest<T>('GET', path, opts).then((r) => r.data),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>('POST', path, { ...opts, body }).then((r) => r.data),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>('PUT', path, { ...opts, body }).then((r) => r.data),
  delete: <T = void>(path: string, opts?: RequestOptions) => apiRequest<T>('DELETE', path, opts).then((r) => r.data),
  /** List endpoints: `{ items, meta }`. */
  page: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T[]>('GET', path, opts).then((r) => ({
      items: r.data ?? [],
      meta: r.meta ?? { total: r.data?.length ?? 0, page: 1, limit: r.data?.length ?? 0, totalPages: 1 },
    })),
};
