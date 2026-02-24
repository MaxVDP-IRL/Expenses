import * as XLSX from 'xlsx';
import type { ExpenseEntry, IncomeMonth } from '../types';

type AoaRow = Array<string | number>;

export const centsToEurNumber = (cents: number): number => Math.round((cents / 100) * 100) / 100;

export const buildExpensesSheetData = (entries: ExpenseEntry[]): AoaRow[] => [
  ['dateLocal', 'category', 'amountEur', 'paymentSource', 'extraDetail'],
  ...entries.map((entry) => [entry.dateLocal, entry.category, centsToEurNumber(entry.amountCents), entry.paymentSource, entry.extraDetail])
];

export const buildIncomeSheetData = (incomeMonths: IncomeMonth[]): AoaRow[] => [
  ['monthKey', 'incomeMaxEur', 'incomeLiisuEur', 'incomeTotalEur'],
  ...incomeMonths.map((income) => [
    income.monthKey,
    centsToEurNumber(income.incomeMaxCents),
    centsToEurNumber(income.incomeLiisuCents),
    centsToEurNumber(income.incomeMaxCents + income.incomeLiisuCents)
  ])
];

const withSheetFormatting = (ws: XLSX.WorkSheet, data: AoaRow[]) => {
  const columnCount = data[0]?.length ?? 0;
  ws['!cols'] = Array.from({ length: columnCount }, (_, idx) => {
    const maxLen = data.reduce((max, row) => {
      const value = row[idx];
      const len = String(value ?? '').length;
      return Math.max(max, len);
    }, 8);
    return { wch: Math.min(50, maxLen + 2) };
  });

  ws['!freeze'] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: 'A2',
    activePane: 'bottomLeft',
    state: 'frozen'
  } as XLSX.WorkSheet['!freeze'];
};

export const buildExportWorkbook = (opts: { expenses?: ExpenseEntry[]; incomes?: IncomeMonth[] }): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  const expenses = opts.expenses ?? [];
  const incomes = opts.incomes ?? [];

  if (expenses.length) {
    const data = buildExpensesSheetData(expenses);
    const ws = XLSX.utils.aoa_to_sheet(data);
    withSheetFormatting(ws, data);
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  }

  if (incomes.length) {
    const data = buildIncomeSheetData(incomes);
    const ws = XLSX.utils.aoa_to_sheet(data);
    withSheetFormatting(ws, data);
    XLSX.utils.book_append_sheet(wb, ws, 'Income');
  }

  return wb;
};

export const workbookToU8 = (workbook: XLSX.WorkBook): Uint8Array => {
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Uint8Array(out);
};

export const canShareFile = (file: File): boolean => !!navigator.share && !!navigator.canShare && navigator.canShare({ files: [file] });

export const shareOrDownloadXlsx = async (u8: Uint8Array, filename: string): Promise<'shared' | 'downloaded'> => {
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const bytes = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
  const file = new File([bytes], filename, { type });

  if (canShareFile(file)) {
    await navigator.share({ files: [file], title: filename });
    return 'shared';
  }

  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
};
