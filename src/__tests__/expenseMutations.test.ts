import { describe, expect, it } from 'vitest';
import type { ExpenseEntry } from '../types';
import { buildEditedExpense, hasComment } from '../utils/expenseMutations';

describe('expense editing helpers', () => {
  it('preserves id and createdAt while updating updatedAt and editable fields', () => {
    const original: ExpenseEntry = {
      id: 'exp-1',
      dateLocal: '2026-01-01',
      category: 'Food shopping',
      amountCents: 1234,
      paymentSource: 'credit_card',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const edited = buildEditedExpense(
      original,
      {
        dateLocal: '2026-01-03',
        category: 'Mortgage',
        amountCents: 4567,
        paymentSource: 'joint_account',
        extraDetail: ' updated note '
      },
      '2026-01-03T10:00:00.000Z'
    );

    expect(edited.id).toBe(original.id);
    expect(edited.createdAt).toBe(original.createdAt);
    expect(edited.updatedAt).toBe('2026-01-03T10:00:00.000Z');
    expect(edited.extraDetail).toBe('updated note');
    expect(edited.amountCents).toBe(4567);
  });

  it('only renders comments when non-empty content exists', () => {
    expect(hasComment({ extraDetail: undefined })).toBe(false);
    expect(hasComment({ extraDetail: '   ' })).toBe(false);
    expect(hasComment({ extraDetail: 'Spotify family plan' })).toBe(true);
  });
});
