import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildExpensesSheetData, buildIncomeSheetData, canShareFile, centsToEurNumber } from '../utils/exportXlsx';
import type { ExpenseEntry, IncomeMonth } from '../types';

describe('centsToEurNumber', () => {
  it('converts cents to a 2-decimal EUR number', () => {
    expect(centsToEurNumber(1234)).toBe(12.34);
    expect(centsToEurNumber(199)).toBe(1.99);
  });
});

describe('sheet data builders', () => {
  it('buildExpensesSheetData keeps required header and order', () => {
    const entries: ExpenseEntry[] = [{
      id: '1',
      dateLocal: '2026-02-24',
      category: 'Food shopping',
      amountCents: 1234,
      paymentSource: 'credit_card',
      extraDetail: 'details',
      createdAt: '2026-02-24T10:00:00.000Z',
      updatedAt: '2026-02-24T10:00:00.000Z'
    }];

    const data = buildExpensesSheetData(entries);
    expect(data[0]).toEqual(['dateLocal', 'category', 'amountEur', 'paymentSource', 'extraDetail']);
    expect(data[1]).toEqual(['2026-02-24', 'Food shopping', 12.34, 'credit_card', 'details']);
  });



  it('writes empty string for missing extraDetail and keeps amount numeric', () => {
    const entries: ExpenseEntry[] = [{
      id: '2',
      dateLocal: '2026-02-25',
      category: 'Transport',
      amountCents: 505,
      paymentSource: 'joint_account',
      createdAt: '2026-02-25T10:00:00.000Z',
      updatedAt: '2026-02-25T10:00:00.000Z'
    }];

    const data = buildExpensesSheetData(entries);
    expect(data[1]).toEqual(['2026-02-25', 'Transport', 5.05, 'joint_account', '']);
    expect(typeof data[1][2]).toBe('number');
  });
  it('buildIncomeSheetData keeps required header and order', () => {
    const incomes: IncomeMonth[] = [{
      monthKey: '2026-02',
      incomeMaxCents: 100000,
      incomeLiisuCents: 50000,
      updatedAt: '2026-02-24T10:00:00.000Z'
    }];

    const data = buildIncomeSheetData(incomes);
    expect(data[0]).toEqual(['monthKey', 'incomeMaxEur', 'incomeLiisuEur', 'incomeTotalEur']);
    expect(data[1]).toEqual(['2026-02', 1000, 500, 1500]);
  });
});

describe('canShareFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true only when share and canShare support file sharing', () => {
    vi.stubGlobal('navigator', {
      share: vi.fn(),
      canShare: vi.fn(() => true)
    });

    const file = new File(['x'], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expect(canShareFile(file)).toBe(true);
  });

  it('returns false when canShare is missing', () => {
    vi.stubGlobal('navigator', {
      share: vi.fn()
    });

    const file = new File(['x'], 'sample.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expect(canShareFile(file)).toBe(false);
  });
});
