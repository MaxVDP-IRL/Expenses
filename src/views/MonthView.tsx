import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '../db';
import { categories } from '../types';
import { calcCategoryAnomalies } from '../utils/anomalies';
import { formatEur } from '../utils/money';
import { hasComment } from '../utils/expenseMutations';
import { ensureRecurringExpensesForMonth, sortExpenses, type SortDirection, type SortField } from '../utils/expenses';
import { nextMonthKey, todayLocal } from '../utils/date';

export function MonthView() {
  const [monthKey, setMonthKey] = useState(todayLocal().slice(0, 7));
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const entries = useLiveQuery(() => db.expenses.where('dateLocal').startsWith(monthKey).toArray(), [monthKey]) ?? [];
  const allEntries = useLiveQuery(() => db.expenses.toArray(), []) ?? [];
  const income = useLiveQuery(() => db.incomes.get(monthKey), [monthKey]);

  useEffect(() => {
    ensureRecurringExpensesForMonth(monthKey);
  }, [monthKey]);

  const totalSpend = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  const totalIncome = (income?.incomeMaxCents ?? 0) + (income?.incomeLiisuCents ?? 0);
  const net = totalIncome - totalSpend;

  const sortedEntries = useMemo(() => sortExpenses(entries, sortField, sortDirection), [entries, sortDirection, sortField]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) map.set(entry.category, (map.get(entry.category) ?? 0) + entry.amountCents);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const byPayment = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) map.set(entry.paymentSource, (map.get(entry.paymentSource) ?? 0) + entry.amountCents);
    return [...map.entries()];
  }, [entries]);

  const anomalies = useMemo(() => calcCategoryAnomalies(allEntries, monthKey, [...categories]), [allEntries, monthKey]);

  return (
    <section className="space-y-4">
      <div className="card flex items-center justify-between">
        <button className="btn" type="button" onClick={() => setMonthKey(nextMonthKey(monthKey, -1))}>◀</button>
        <input className="input w-auto" type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
        <button className="btn" type="button" onClick={() => setMonthKey(nextMonthKey(monthKey, 1))}>▶</button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Kpi label="Total spend" value={formatEur(totalSpend)} />
        <Kpi label="Total income" value={formatEur(totalIncome)} />
        <Kpi label="Net" value={formatEur(net)} />
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Income</h3>
          <button className="btn text-sm" type="button" onClick={() => setIncomeOpen(true)}>Edit income</button>
        </div>
        <p className="text-sm text-slate-300">Max: {formatEur(income?.incomeMaxCents ?? 0)} • Liisu: {formatEur(income?.incomeLiisuCents ?? 0)}</p>
      </div>

      <div className="card space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-semibold">Expenses</h3>
          <select className="input w-auto" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
            <option value="date">Date</option>
            <option value="category">Category</option>
            <option value="amount">Amount</option>
            <option value="paymentSource">Payment source</option>
          </select>
          <button className="btn" type="button" onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}>
            {sortDirection === 'asc' ? 'Asc ↑' : 'Desc ↓'}
          </button>
        </div>
        {sortedEntries.length ? (
          <div className="space-y-2">
            {sortedEntries.map((entry) => (
              <div className="rounded-lg border border-slate-800 p-2 text-sm" key={entry.id}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{entry.category}</span>
                  <span>{formatEur(entry.amountCents)}</span>
                </div>
                <div className="text-slate-300">
                  {entry.dateLocal} • {entry.paymentSource === 'credit_card' ? 'Credit card' : 'Joint account'}
                </div>
                {hasComment(entry) ? <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-400">{entry.extraDetail}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No expenses for this month.</p>
        )}
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Spend by category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory.map(([name, value]) => ({ name, value: value / 100 }))}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1 text-sm">
          {byCategory.map(([name, value]) => (
            <div className="flex justify-between" key={name}>
              <span>{name}</span>
              <span>{formatEur(value)} ({totalSpend ? Math.round((value / totalSpend) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Spend by payment source</h3>
        <div className="space-y-1 text-sm">
          {byPayment.map(([name, value]) => (
            <div className="flex justify-between" key={name}>
              <span>{name}</span>
              <span>{formatEur(value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold">Notable changes (heuristic)</h3>
        {anomalies.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {anomalies.map((item) => (
              <li key={item.category}>
                {item.category}: {formatEur(item.currentCents)} vs 6m avg {formatEur(item.avgCents)} (+{formatEur(item.increaseCents)})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No notable category spikes for this month.</p>
        )}
      </div>

      {incomeOpen ? <IncomeModal monthKey={monthKey} onClose={() => setIncomeOpen(false)} /> : null}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="card"><div className="text-xs text-slate-400">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
}

function IncomeModal({ monthKey, onClose }: { monthKey: string; onClose: () => void }) {
  const current = useLiveQuery(() => db.incomes.get(monthKey), [monthKey]);
  const prevMonth = nextMonthKey(monthKey, -1);
  const prev = useLiveQuery(() => db.incomes.get(prevMonth), [prevMonth]);
  const [maxIncome, setMaxIncome] = useState('0.00');
  const [liisuIncome, setLiisuIncome] = useState('0.00');

  useEffect(() => {
    setMaxIncome(((current?.incomeMaxCents ?? prev?.incomeMaxCents ?? 0) / 100).toFixed(2));
    setLiisuIncome(((current?.incomeLiisuCents ?? prev?.incomeLiisuCents ?? 0) / 100).toFixed(2));
  }, [current?.incomeMaxCents, current?.incomeLiisuCents, prev?.incomeMaxCents, prev?.incomeLiisuCents]);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4">
      <div className="card w-full max-w-sm space-y-3">
        <h3 className="text-lg font-semibold">Edit income ({monthKey})</h3>
        <input className="input" value={maxIncome} onChange={(e) => setMaxIncome(e.target.value)} inputMode="decimal" placeholder="Max income" />
        <input className="input" value={liisuIncome} onChange={(e) => setLiisuIncome(e.target.value)} inputMode="decimal" placeholder="Liisu income" />
        <div className="flex gap-2">
          <button className="btn flex-1" type="button" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 rounded-lg bg-sky-600 py-2"
            type="button"
            onClick={async () => {
              const toCents = (v: string) => Math.max(0, Math.round(Number(v.replace(',', '.')) * 100) || 0);
              await db.incomes.put({
                monthKey,
                incomeMaxCents: toCents(maxIncome),
                incomeLiisuCents: toCents(liisuIncome),
                updatedAt: new Date().toISOString()
              });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
