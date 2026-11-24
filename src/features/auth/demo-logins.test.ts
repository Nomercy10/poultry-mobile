import { parseDemoLogins } from './demo-logins';

const encode = (v: unknown) => btoa(JSON.stringify(v));

describe('parseDemoLogins', () => {
  it('reads the list written by backend:demo', () => {
    const list = [{ email: 'free@demo.test', password: 'x', label: 'Free plan' }];
    expect(parseDemoLogins(encode(list))).toEqual(list);
  });

  it('ignores missing or broken values', () => {
    expect(parseDemoLogins(undefined)).toEqual([]);
    expect(parseDemoLogins('not base64 json')).toEqual([]);
    expect(parseDemoLogins(encode([{ email: 1 }]))).toEqual([]);
  });
});
