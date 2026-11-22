// Indian number formatting (1,00,000) and rupees, matching the web app.

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatNumber(value: number | null | undefined): string {
  return numberFormat.format(value ?? 0);
}

export function formatCurrency(value: number | null | undefined): string {
  return currencyFormat.format(value ?? 0);
}
