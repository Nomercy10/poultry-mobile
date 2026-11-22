import { formatCurrency, formatNumber } from './format';

describe('Indian number formatting', () => {
  it('groups digits the Indian way', () => {
    expect(formatNumber(100000)).toBe('1,00,000');
    expect(formatNumber(2340)).toBe('2,340');
    expect(formatNumber(null)).toBe('0');
  });

  it('formats rupees without paise', () => {
    expect(formatCurrency(142300)).toBe('₹1,42,300');
    expect(formatCurrency(undefined)).toBe('₹0');
  });
});
