import { Redirect } from 'expo-router';

import { usePreferences } from '@/store/preferences';

// The signed-out guard lands on this group's root. First launch picks a language
// (no reading needed); after that it goes straight to login.
export default function AuthIndex() {
  const language = usePreferences((s) => s.language);
  return <Redirect href={language ? '/login' : '/language'} />;
}
