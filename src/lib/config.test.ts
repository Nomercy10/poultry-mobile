import { deriveApiUrl } from './config';

describe('deriveApiUrl', () => {
  it('uses EXPO_PUBLIC_API_URL when set, without a trailing slash', () => {
    expect(deriveApiUrl({ envUrl: 'https://api.example.com/api/v1/', hostUri: '192.168.1.20:8081', platform: 'ios' })).toBe(
      'https://api.example.com/api/v1',
    );
  });

  it("points a phone at the laptop's LAN IP (Expo Go)", () => {
    expect(deriveApiUrl({ hostUri: '192.168.1.20:8081', platform: 'android' })).toBe('http://192.168.1.20:4000/api/v1');
    expect(deriveApiUrl({ hostUri: '10.0.0.7:8081', platform: 'ios' })).toBe('http://10.0.0.7:4000/api/v1');
  });

  it('uses localhost on web', () => {
    expect(deriveApiUrl({ hostUri: '192.168.1.20:8081', platform: 'web' })).toBe('http://localhost:4000/api/v1');
  });

  it('falls back to localhost for tunnel hosts, which cannot reach the laptop backend', () => {
    expect(deriveApiUrl({ hostUri: 'abc-anonymous-8081.exp.direct', platform: 'ios' })).toBe('http://localhost:4000/api/v1');
  });
});
