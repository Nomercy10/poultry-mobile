import { type Href, router } from 'expo-router';

/** Go back, or to `fallback` when the screen was opened directly (a link, a web reload). */
export function leave(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
