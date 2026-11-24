import { defaultUiMode } from '@/features/navigation/menu';
import { useAuth } from '@/store/auth';
import { type UiMode, usePreferences } from '@/store/preferences';

/** The app style in use: the user's own choice, else the default for their role. */
export function useUiMode(): UiMode {
  const user = useAuth((s) => s.user);
  const chosen = usePreferences((s) => (user ? s.uiModes[user.id] : undefined));
  return chosen ?? defaultUiMode(user);
}
