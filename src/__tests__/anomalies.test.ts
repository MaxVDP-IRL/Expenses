import { describe, expect, it } from 'vitest';
import { calcCategoryAnomalies } from '../utils/anomalies';
import type { ExpenseEntry } from '../types';

const makeEntry = (dateLocal: string, amountCents: number, category = 'Food shopping'): ExpenseEntry => ({
  id: crypto.randomUUID(),
  dateLocal,
  amountCents,
  category,
  paymentSource: 'credit_card',
  extraDetail: 'test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe('calcCategoryAnomalies', () => {
  it('flags month spikes over threshold', () => {
    const entries: ExpenseEntry[] = [
      makeEntry('2025-08-02', 10000),
      makeEntry('2025-07-02', 10000),
      makeEntry('2025-06-02', 10000),
      makeEntry('2025-05-02', 10000),
      makeEntry('2025-04-02', 10000),
      makeEntry('2025-03-02', 10000),
      makeEntry('2025-09-02', 25000)
    ];

    const categories: Category[] = ['Food shopping'];
    const result = calcCategoryAnomalies(entries, '2025-09', categories);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Food shopping');
  });
});
