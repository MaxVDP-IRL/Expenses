import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { categories, paymentSources, type ExpenseEntry, type ImportReport, type PaymentSource, type Category } from '../types';
import { buildExpensesCsv, buildIncomeCsv } from './exportCsv';

const categorySet = new Set(categories);
const paymentSet = new Set(paymentSources);

export const exportJsonString = async () => JSON.stringify({ expenses: await db.expenses.toArray(), incomes: await db.incomes.toArray() }, null, 2);

export const exportCsvString = async () => {
  const expenses = await db.expenses.toArray();
  const incomes = await db.incomes.toArray();
  return `${buildExpensesCsv(expenses)}\n\n${buildIncomeCsv(incomes)}`;
};

export const importJsonString = async (content: string) => {
  const parsed = JSON.parse(content) as { expenses?: ExpenseEntry[]; incomes?: any[] };
  if (parsed.expenses?.length) await db.expenses.bulkPut(parsed.expenses);
  if (parsed.incomes?.length) await db.incomes.bulkPut(parsed.incomes);
};

export interface CsvMapping {
  dateLocal: string;
  category: string;
  amount: string;
  paymentSource: string;
  extraDetail: string;
}

export const parseCsvRows = (content: string) => {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((x) => x.trim());
  const rows = lines.slice(1).map((line) => line.split(','));
  return { headers, rows };
};

export const importCanonicalOrMappedCsv = async (content: string, mapping?: CsvMapping): Promise<ImportReport> => {
  const { headers, rows } = parseCsvRows(content);
  const map: CsvMapping =
    mapping ??
    ({ dateLocal: 'dateLocal', category: 'category', amount: 'amount', paymentSource: 'paymentSource', extraDetail: 'extraDetail' } as CsvMapping);

  const idx = (name: string) => headers.indexOf(name);
  const report: ImportReport = { imported: 0, skipped: 0, reasons: [] };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const dateLocal = row[idx(map.dateLocal)]?.trim();
    const category = row[idx(map.category)]?.trim() as Category;
    const amount = row[idx(map.amount)]?.trim();
    const paymentSource = row[idx(map.paymentSource)]?.trim() as PaymentSource;
    const extraDetail = row[idx(map.extraDetail)]?.trim();

    const cents = Math.round(Number((amount ?? '').replace(',', '.')) * 100);
    if (!dateLocal || !/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) {
      report.skipped += 1;
      report.reasons.push(`Row ${i + 2}: invalid date`);
      continue;
    }
    if (!categorySet.has(category)) {
      report.skipped += 1;
      report.reasons.push(`Row ${i + 2}: invalid category`);
      continue;
    }
    if (!paymentSet.has(paymentSource)) {
      report.skipped += 1;
      report.reasons.push(`Row ${i + 2}: invalid payment source`);
      continue;
    }
    if (!extraDetail) {
      report.skipped += 1;
      report.reasons.push(`Row ${i + 2}: missing detail`);
      continue;
    }
    if (!Number.isFinite(cents) || cents <= 0) {
      report.skipped += 1;
      report.reasons.push(`Row ${i + 2}: invalid amount`);
      continue;
    }

    const now = new Date().toISOString();
    await db.expenses.put({
      id: uuid(),
      dateLocal,
      category,
      amountCents: cents,
      paymentSource,
      extraDetail,
      createdAt: now,
      updatedAt: now
    });
    report.imported += 1;
  }

  return report;
};
