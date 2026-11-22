import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 4000;
const API_PATH = '/api/v1';

type ApiUrlInputs = {
  /** EXPO_PUBLIC_API_URL, if set. Always wins. */
  envUrl?: string;
  /** Metro's host as the device sees it, e.g. "192.168.1.20:8081". */
  hostUri?: string | null;
  platform: string;
};

const LAN_HOST = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;

/**
 * Works out where the backend is.
 *
 * In Expo Go on a phone, the dev server's host is your laptop's LAN IP, so the
 * backend on the same laptop is at that IP on port 4000. On web and simulators
 * it's localhost. Set EXPO_PUBLIC_API_URL to point anywhere else (for example
 * the deployed API, or when using `expo start --tunnel`).
 */
export function deriveApiUrl({ envUrl, hostUri, platform }: ApiUrlInputs): string {
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');

  if (platform !== 'web' && hostUri) {
    const host = hostUri.split(':')[0];
    if (LAN_HOST.test(host)) return `http://${host}:${API_PORT}${API_PATH}`;
  }
  return `http://localhost:${API_PORT}${API_PATH}`;
}

export const API_URL = deriveApiUrl({
  envUrl: process.env.EXPO_PUBLIC_API_URL,
  hostUri: Constants.expoConfig?.hostUri,
  platform: Platform.OS,
});

export const features = {
  /**
   * Mobile number + OTP login. Off until the backend has /auth/otp/* (see
   * docs/auth-otp.md). Set EXPO_PUBLIC_ENABLE_PHONE_OTP=1 to work on it.
   */
  phoneOtpLogin: process.env.EXPO_PUBLIC_ENABLE_PHONE_OTP === '1',
} as const;
