/** React Native Web's Alert has no buttons; the browser dialog does the job. */
export function confirm(message: string): Promise<boolean> {
  return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
}
