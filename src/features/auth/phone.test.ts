import { toE164India } from './phone';

describe('toE164India', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['98765 43210', '+919876543210'],
    ['+91-98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
  ])('normalises %s', (input, expected) => {
    expect(toE164India(input)).toBe(expected);
  });

  it.each(['12345', '5876543210', '98765432101', 'abc'])('rejects %s', (input) => {
    expect(toE164India(input)).toBeNull();
  });
});
