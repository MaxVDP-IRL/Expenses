import { describe, expect, it } from 'vitest';
import type { ExpenseEntry, RecurringExpenseTemplate } from '../types';
import { getMissingRecurringExpenses, sortExpenses } from '../utils/expenses';

describe('expense list sorting', () => {
  const base: ExpenseEntry[] = [
    {
      id: '1',
      dateLocal: '2026-02-10',
      category: 'Mortgage',
      amountCents: 120000,
      paymentSource: 'joint_account',
      createdAt: '2026-02-10T00:00:00.000Z',
      updatedAt: '2026-02-10T00:00:00.000Z'
    },
    {
      id: '2',
      dateLocal: '2026-02-05',
      category: 'Food shopping',
      amountCents: 3500,
      paymentSource: 'credit_card',
      createdAt: '2026-02-05T00:00:00.000Z',
      updatedAt: '2026-02-05T00:00:00.000Z'
    }
  ];

  it('sorts by amount descending', () => {
    const sorted = sortExpenses(base, 'amount', 'desc');
    expect(sorted.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('sorts by date ascending', () => {
    const sorted = sortExpenses(base, 'date', 'asc');
    expect(sorted.map((item) => item.id)).toEqual(['2', '1']);
  });
});

describe('recurring generation', () => {
  it('creates one entry per active template and skips existing month/template pairs', () => {
    const templates: RecurringExpenseTemplate[] = [
      {
        id: 'tpl-1',
        category: 'Mortgage',
        amountCents: 120000,
        paymentSource: 'joint_account',
        dayOfMonth: 31,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'tpl-2',
        category: 'Subscriptions',
        amountCents: 1299,
        paymentSource: 'credit_card',
        dayOfMonth: 1,
        isActive: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    const existing: ExpenseEntry[] = [
      {
        id: 'exp-existing',
        dateLocal: '2026-02-28',
        category: 'Mortgage',
        amountCents: 120000,
        paymentSource: 'joint_account',
        recurringTemplateId: 'tpl-1',
        recurringMonthKey: '2026-02',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z'
      }
    ];

    expect(getMissingRecurringExpenses(templates, existing, '2026-02')).toHaveLength(0);
    const missingForMarch = getMissingRecurringExpenses(templates, existing, '2026-03');
    expect(missingForMarch).toHaveLength(1);
    expect(missingForMarch[0].recurringTemplateId).toBe('tpl-1');
    expect(missingForMarch[0].dateLocal).toBe('2026-03-31');
  });
});
