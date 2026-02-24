import { describe, expect, it } from 'vitest';
import { buildExpensesCsv, csvEscape } from '../utils/exportCsv';
import type { ExpenseEntry } from '../types';

describe('csvEscape', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(csvEscape('simple')).toBe('simple');
    expect(csvEscape('hello,world')).toBe('"hello,world"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('buildExpensesCsv', () => {
  it('uses the expected header and formats amount with 2 decimals', () => {
    const entries: ExpenseEntry[] = [
      {
        id: '1',
        dateLocal: '2026-02-03',
        category: 'Food shopping',
        amountCents: 1234,
        paymentSource: 'credit_card',
        extraDetail: 'milk, eggs and "bread"\nweekly run',
        createdAt: '2026-02-03T10:00:00.000Z',
        updatedAt: '2026-02-03T10:00:00.000Z'
      }
    ];

    const csv = buildExpensesCsv(entries);
    expect(csv.startsWith('dateLocal,category,amountEur,paymentSource,extraDetail\n')).toBe(true);
    expect(csv).toContain('2026-02-03,Food shopping,12.34,credit_card,"milk, eggs and ""bread""\nweekly run"');
  });

  it('keeps extraDetail column blank when detail is missing', () => {
    const entries: ExpenseEntry[] = [
      {
        id: '2',
        dateLocal: '2026-02-04',
        category: 'Transport',
        amountCents: 500,
        paymentSource: 'joint_account',
        createdAt: '2026-02-04T10:00:00.000Z',
        updatedAt: '2026-02-04T10:00:00.000Z'
      }
    ];

    const csv = buildExpensesCsv(entries);
    expect(csv).toContain('2026-02-04,Transport,5.00,joint_account,');
  });

});
