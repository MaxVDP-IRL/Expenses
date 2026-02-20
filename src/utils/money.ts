export const formatEur = (cents: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export const parseMoneyToCents = (raw: string) => {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return { valid: false, cents: 0, error: 'Amount is required.' };
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { valid: false, cents: 0, error: 'Use a valid amount (e.g. 12.34).' };
  }
  const cents = Math.round(Number(normalized) * 100);
  if (cents <= 0) return { valid: false, cents: 0, error: 'Amount must be greater than 0.' };
  return { valid: true, cents, error: '' };
};
