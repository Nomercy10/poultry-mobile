// Dev-only quick sign-in for the local demo backend. `npm run backend:demo`
// writes EXPO_PUBLIC_DEMO_LOGINS (base64 JSON) into the git-ignored .env.local.
// Release builds never show these: the list is empty unless __DEV__.

export type DemoLogin = { email: string; password: string; label: string };

function decodeBase64(value: string): string {
  if (typeof atob === 'function') {
    // atob gives Latin-1; the payload is ASCII JSON.
    return atob(value);
  }
  return '';
}

export function parseDemoLogins(raw: string | undefined): DemoLogin[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(decodeBase64(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DemoLogin =>
        !!x && typeof x.email === 'string' && typeof x.password === 'string' && typeof x.label === 'string',
    );
  } catch {
    return [];
  }
}

export function demoLogins(): DemoLogin[] {
  if (!__DEV__) return [];
  return parseDemoLogins(process.env.EXPO_PUBLIC_DEMO_LOGINS);
}
