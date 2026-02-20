import { describe, expect, it } from 'vitest';
import { parseMoneyToCents } from '../utils/money';

describe('parseMoneyToCents', () => {
  it('parses decimal with comma', () => {
    expect(parseMoneyToCents('12,34')).toMatchObject({ valid: true, cents: 1234 });
  });

  it('rejects invalid formats', () => {
    expect(parseMoneyToCents('abc').valid).toBe(false);
    expect(parseMoneyToCents('0').valid).toBe(false);
  });
});
