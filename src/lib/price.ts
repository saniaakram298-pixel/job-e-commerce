export function formatCurrency(value: any, digits = 2): string {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `$${safeAmount.toFixed(digits)}`;
}

export function formatNumber(value: any, digits = 0): string {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toFixed(digits);
}
