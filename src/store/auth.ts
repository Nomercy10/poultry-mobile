import { create } from 'zustand';

import { authApi } from '@/features/auth/api';
import type { AuthSession, Me } from '@/features/auth/types';
import { configureApiAuth, refreshAccessTokenOnce } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { queryClient } from '@/lib/query-client';
import { secureStorage } from '@/lib/secure-storage';

const REFRESH_TOKEN_KEY = 'poultry.refreshToken';

type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  /** Kept in memory only; the refresh token lives in secure storage. */
  accessToken: string | null;
  user: Me | null;
  /** Set when startup couldn't reach the server, so the login screen can say so. */
  bootError: string | null;

  bootstrap: () => Promise<void>;
  /** Finish any login method (password today, OTP later). */
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set, get) => ({
  status: 'booting',
  accessToken: null,
  user: null,
  bootError: null,

  bootstrap: async () => {
    set({ bootError: null });
    const hasRefreshToken = !!(await secureStorage.get(REFRESH_TOKEN_KEY));
    if (!hasRefreshToken) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      const token = await refreshAccessTokenOnce();
      if (!token) {
        set({ status: 'signedOut' });
        return;
      }
      const user = await authApi.me();
      set({ user, status: 'signedIn' });
    } catch (error) {
      set({
        status: 'signedOut',
        bootError: isApiError(error) && error.isOffline ? error.message : null,
      });
    }
  },

  signIn: async (session) => {
    await secureStorage.set(REFRESH_TOKEN_KEY, session.refreshToken);
    set({ accessToken: session.accessToken, bootError: null });
    // /auth/me has more than the login response (phone, status, employee).
    const user = await authApi.me();
    set({ user, status: 'signedIn' });
  },

  signOut: async () => {
    const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
    if (refreshToken && get().accessToken) {
      // Best effort: revoke on the server, but never block logging out.
      await authApi.logout(refreshToken).catch(() => {});
    }
    await clearSession();
  },

  reloadUser: async () => {
    const user = await authApi.me();
    set({ user });
  },
}));

async function clearSession() {
  await secureStorage.remove(REFRESH_TOKEN_KEY);
  queryClient.clear();
  useAuth.setState({ status: 'signedOut', accessToken: null, user: null });
}

/**
 * Refresh-token rotation: each refresh returns a new pair and revokes the old
 * refresh token, so the new one must be saved straight away.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.get(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const tokens = await authApi.refresh(refreshToken);
    await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
    useAuth.setState({ accessToken: tokens.accessToken });
    return tokens.accessToken;
  } catch (error) {
    // Offline: keep the refresh token so the user isn't logged out by a bad signal.
    if (isApiError(error) && error.isOffline) throw error;
    await secureStorage.remove(REFRESH_TOKEN_KEY);
    return null;
  }
}

configureApiAuth({
  getAccessToken: () => useAuth.getState().accessToken,
  refreshAccessToken,
  onAuthFailure: () => {
    void clearSession();
  },
});
