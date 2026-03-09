import { storage } from '../storage';
import type { ExpenseEntry, RecurringExpenseTemplate } from '../types';
import { nowIso } from './date';

export type SortField = 'date' | 'category' | 'amount' | 'paymentSource';
export type SortDirection = 'asc' | 'desc';

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

export const sortExpenses = (entries: ExpenseEntry[], field: SortField, direction: SortDirection): ExpenseEntry[] => {
  const modifier = direction === 'asc' ? 1 : -1;
  return [...entries].sort((left, right) => {
    if (field === 'date') return compareText(left.dateLocal, right.dateLocal) * modifier;
    if (field === 'category') return compareText(left.category, right.category) * modifier;
    if (field === 'paymentSource') return compareText(left.paymentSource, right.paymentSource) * modifier;
    return (left.amountCents - right.amountCents) * modifier;
  });
};

const dayToDateLocal = (monthKey: string, dayOfMonth: number) => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = new Date(year, month, 0).getDate();
  const clampedDay = Math.max(1, Math.min(dayOfMonth, lastDay));
  return `${monthKey}-${String(clampedDay).padStart(2, '0')}`;
};

const buildGeneratedExpense = (template: RecurringExpenseTemplate, monthKey: string): ExpenseEntry => {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    dateLocal: dayToDateLocal(monthKey, template.dayOfMonth),
    category: template.category,
    amountCents: template.amountCents,
    paymentSource: template.paymentSource,
    extraDetail: template.extraDetail,
    recurringTemplateId: template.id,
    recurringMonthKey: monthKey,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const getMissingRecurringExpenses = (
  templates: RecurringExpenseTemplate[],
  existing: ExpenseEntry[],
  monthKey: string
) => {
  const keys = new Set(existing.map((entry) => `${entry.recurringTemplateId ?? ''}-${entry.recurringMonthKey ?? ''}`));
  return templates
    .filter((template) => template.isActive)
    .filter((template) => !keys.has(`${template.id}-${monthKey}`))
    .map((template) => buildGeneratedExpense(template, monthKey));
};

export const ensureRecurringExpensesForMonth = async (monthKey: string) => {
  const templates = (await storage.getRecurringTemplates()).filter((template) => template.isActive);
  if (!templates.length) return 0;

  const existing = (await storage.getExpenses()).filter((entry) => entry.recurringMonthKey === monthKey);
  const toCreate = getMissingRecurringExpenses(templates, existing, monthKey);

  for (const entry of toCreate) {
    await storage.addExpense(entry);
  }

  return toCreate.length;
};
