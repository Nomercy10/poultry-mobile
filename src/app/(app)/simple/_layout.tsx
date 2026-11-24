import { Redirect, Stack } from 'expo-router';

import { useUiMode } from '@/features/settings/use-ui-mode';

/** Simple mode: no tab bar, Home is the only hub (docs/languages-and-easy-ui.md §2). */
export default function SimpleLayout() {
  const mode = useUiMode();
  if (mode !== 'simple') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
