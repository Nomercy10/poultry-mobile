export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'parse';

/** Every failed API call throws one of these. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status; 0 when the request never got a response. */
  readonly status: number;
  readonly details?: unknown;

  constructor(kind: ApiErrorKind, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isOffline() {
    return this.kind === 'network' || this.kind === 'timeout';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
