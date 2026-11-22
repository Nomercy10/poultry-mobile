import * as SecureStore from 'expo-secure-store';

/** Keychain (iOS) / Keystore-backed storage (Android). See secure-storage.web.ts for web. */
export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
