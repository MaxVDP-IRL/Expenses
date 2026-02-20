import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db';
import { categories, type Category } from '../types';
import { monthRangeBack, todayLocal } from '../utils/date';
import { movingAverage } from '../utils/anomalies';

export function TrendsView() {
  const [showAvg, setShowAvg] = useState(true);
  const [category, setCategory] = useState<Category | ''>('');
  const all = useLiveQuery(() => db.expenses.toArray(), []) ?? [];
  const months = monthRangeBack(12, todayLocal().slice(0, 7));

  const data = useMemo(() => {
    const totals = months.map((month) => all.filter((e) => e.dateLocal.startsWith(month)).reduce((s, e) => s + e.amountCents, 0));
    const avg = movingAverage(totals, 3);
    const categoryTotals = category
      ? months.map((month) =>
          all
            .filter((e) => e.dateLocal.startsWith(month) && e.category === category)
            .reduce((s, e) => s + e.amountCents, 0)
        )
      : months.map(() => 0);

    return months.map((month, i) => ({
      month,
      spend: totals[i] / 100,
      ma: avg[i] == null ? null : avg[i] / 100,
      category: categoryTotals[i] / 100
    }));
  }, [all, months, category]);

  return (
    <section className="space-y-4">
      <div className="card flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAvg} onChange={(e) => setShowAvg(e.target.checked)} />
          Show 3-month average
        </label>
        <select className="input w-40" value={category} onChange={(e) => setCategory(e.target.value as Category | '')}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="card h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line dataKey="spend" stroke="#38bdf8" strokeWidth={2} dot={false} />
            {showAvg ? <Line dataKey="ma" stroke="#22c55e" strokeWidth={2} dot={false} /> : null}
            {category ? <Line dataKey="category" stroke="#f97316" strokeWidth={2} dot={false} /> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
