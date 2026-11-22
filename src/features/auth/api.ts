import { api } from '@/lib/api/client';

import type { AuthSession, Me, TokenPair } from './types';

export const authApi = {
  loginWithPassword: (email: string, password: string) =>
    api.post<AuthSession>('/auth/login', { email: email.trim().toLowerCase(), password }, { auth: false }),

  refresh: (refreshToken: string) => api.post<TokenPair>('/auth/refresh', { refreshToken }, { auth: false }),

  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }),

  me: () => api.get<Me>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<void>('/auth/forgot-password', { email: email.trim().toLowerCase() }, { auth: false }),

  // ── Phone + OTP (not on the backend yet) ──────────────────────────────────
  // Contract in docs/auth-otp.md. Hidden behind features.phoneOtpLogin until
  // the web backend implements these two endpoints.

  /** Sends a one-time code by SMS. `phone` in E.164, e.g. +919876543210. */
  requestOtp: (phone: string) =>
    api.post<OtpChallenge>('/auth/otp/request', { phone }, { auth: false }),

  /** Exchanges the code for the same session shape as password login. */
  verifyOtp: (challengeId: string, phone: string, code: string) =>
    api.post<AuthSession>('/auth/otp/verify', { challengeId, phone, code }, { auth: false }),
};

export type OtpChallenge = {
  challengeId: string;
  /** Seconds until the user may ask for another code. */
  resendAfter: number;
  /** Seconds until this code stops working. */
  expiresIn: number;
};
