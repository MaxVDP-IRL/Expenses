import { v4 as uuid } from 'uuid';
import type { Category, ExpenseEntry, PaymentSource } from '../types';

export interface ExpenseInput {
  dateLocal: string;
  category: Category;
  amountCents: number;
  paymentSource: PaymentSource;
  extraDetail?: string;
}

const normalizeExtraDetail = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const buildNewExpense = (input: ExpenseInput, timestamp: string): ExpenseEntry => ({
  id: uuid(),
  ...input,
  extraDetail: normalizeExtraDetail(input.extraDetail),
  createdAt: timestamp,
  updatedAt: timestamp
});

export const buildEditedExpense = (current: ExpenseEntry, input: ExpenseInput, timestamp: string): ExpenseEntry => ({
  ...current,
  ...input,
  extraDetail: normalizeExtraDetail(input.extraDetail),
  updatedAt: timestamp
});

export const hasComment = (entry: Pick<ExpenseEntry, 'extraDetail'>) => Boolean(entry.extraDetail?.trim());
