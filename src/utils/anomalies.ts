import type { Category, ExpenseEntry } from '../types';

export interface Anomaly {
  category: Category;
  currentCents: number;
  avgCents: number;
  increaseCents: number;
}

export const calcCategoryAnomalies = (
  entries: ExpenseEntry[],
  monthKey: string,
  categories: Category[]
): Anomaly[] => {
  const byMonthCategory = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.dateLocal.slice(0, 7)}::${entry.category}`;
    byMonthCategory.set(key, (byMonthCategory.get(key) ?? 0) + entry.amountCents);
  }

  const [y, m] = monthKey.split('-').map(Number);
  const target = y * 12 + (m - 1);
  return categories
    .map((category) => {
      const current = byMonthCategory.get(`${monthKey}::${category}`) ?? 0;
      const trailingValues: number[] = [];
      for (let i = 1; i <= 6; i += 1) {
        const v = target - i;
        const year = Math.floor(v / 12);
        const month = `${(v % 12) + 1}`.padStart(2, '0');
        trailingValues.push(byMonthCategory.get(`${year}-${month}::${category}`) ?? 0);
      }
      const avg = trailingValues.reduce((sum, value) => sum + value, 0) / trailingValues.length;
      return {
        category,
        currentCents: current,
        avgCents: Math.round(avg),
        increaseCents: current - avg,
        pass: avg > 0 && current > avg * 1.4 && current - avg >= 5000
      };
    })
    .filter((x) => x.pass)
    .sort((a, b) => b.increaseCents - a.increaseCents);
};

export const movingAverage = (values: number[], window = 3) =>
  values.map((_, index) => {
    if (index < window - 1) return null;
    const segment = values.slice(index - window + 1, index + 1);
    return Math.round(segment.reduce((sum, value) => sum + value, 0) / window);
  });
