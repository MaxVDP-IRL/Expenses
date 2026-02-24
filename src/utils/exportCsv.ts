import type { ExpenseEntry, IncomeMonth } from '../types';

export const formatEurFromCents = (cents: number): string => (cents / 100).toFixed(2);

export const csvEscape = (value: string): string => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

export const buildExpensesCsv = (entries: ExpenseEntry[]): string => {
  const rows = ['dateLocal,category,amountEur,paymentSource,extraDetail'];
  for (const entry of entries) {
    rows.push(
      [
        entry.dateLocal,
        csvEscape(entry.category),
        formatEurFromCents(entry.amountCents),
        entry.paymentSource,
        csvEscape(entry.extraDetail ?? '')
      ].join(',')
    );
  }
  return rows.join('\n');
};

export const buildIncomeCsv = (incomeMonths: IncomeMonth[]): string => {
  const rows = ['monthKey,incomeMaxEur,incomeLiisuEur,incomeTotalEur'];
  for (const income of incomeMonths) {
    const total = income.incomeLiisuCents + income.incomeMaxCents;
    rows.push(
      [
        income.monthKey,
        formatEurFromCents(income.incomeMaxCents),
        formatEurFromCents(income.incomeLiisuCents),
        formatEurFromCents(total)
      ].join(',')
    );
  }
  return rows.join('\n');
};

export const shareOrDownloadCsv = async (csv: string, filename: string): Promise<'shared' | 'downloaded'> => {
  const file = new File([csv], filename, { type: 'text/csv;charset=utf-8' });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: filename });
    return 'shared';
  }

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
};
