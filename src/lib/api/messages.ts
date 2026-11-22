import type { TFunction } from 'i18next';

import { isApiError } from './errors';

/** A message that's safe to show the user for any thrown error. */
export function errorMessage(error: unknown, t: TFunction): string {
  if (isApiError(error)) {
    if (error.isOffline) return t('common.offline');
    // The backend's messages are written for users ("Invalid email or password").
    if (error.message) return error.message;
  }
  return t('common.error');
}
