import { features } from '@/lib/config';

import type { LoginMethod } from './types';

/**
 * Login methods offered on the login screen, first one selected by default.
 * Phone OTP comes first once enabled, because workers are more likely to
 * have a phone number than an email address.
 */
export function enabledLoginMethods(flags: { phoneOtpLogin: boolean } = features): LoginMethod[] {
  return flags.phoneOtpLogin ? ['phone-otp', 'password'] : ['password'];
}
