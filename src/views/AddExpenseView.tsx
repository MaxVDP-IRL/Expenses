import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { subDays, format } from 'date-fns';
import { db } from '../db';
import type { Category, ExpenseEntry, PaymentSource } from '../types';
import { categories, paymentSources } from '../types';
import { nowIso, todayLocal } from '../utils/date';
import { formatEur, parseMoneyToCents } from '../utils/money';

export function AddExpenseView() {
  const [dateLocal, setDateLocal] = useState(todayLocal());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food shopping');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('credit_card');
  const [extraDetail, setExtraDetail] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [search, setSearch] = useState('');

  const latestEntries = useLiveQuery(() => db.expenses.orderBy('createdAt').reverse().limit(10).toArray(), []);
  const usage = useLiveQuery(async () => {
    const all = await db.expenses.toArray();
    return all.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const top6 = useMemo(
    () =>
      categories
        .map((item) => ({ item, count: usage?.[item] ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((x) => x.item),
    [usage]
  );

  const lastUsed = latestEntries?.[0]?.category;

  const onSave = async () => {
    const money = parseMoneyToCents(amount);
    const nextErrors: typeof errors = {};
    if (!money.valid) nextErrors.amount = money.error;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const timestamp = nowIso();
    const entry: ExpenseEntry = {
      id: uuid(),
      dateLocal,
      category,
      amountCents: money.cents,
      paymentSource,
      extraDetail: extraDetail.trim() ? extraDetail.trim() : undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await db.expenses.add(entry);
    setAmount('');
    setExtraDetail('');
    setErrors({});
  };

  const onDuplicate = (entry: ExpenseEntry) => {
    setDateLocal(entry.dateLocal);
    setCategory(entry.category);
    setPaymentSource(entry.paymentSource);
    setAmount((entry.amountCents / 100).toFixed(2));
    setExtraDetail(entry.extraDetail ?? '');
  };

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Add expense</h2>
        <div>
          <label className="mb-1 block text-sm">Date</label>
          <div className="flex gap-2">
            <input className="input" type="date" value={dateLocal} onChange={(e) => setDateLocal(e.target.value)} />
            <button
              className="btn whitespace-nowrap"
              onClick={() => setDateLocal(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
              type="button"
            >
              Yesterday
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Amount (€)</label>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && <p className="mt-1 text-sm text-rose-400">{errors.amount}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm">Category</label>
          <button className="input text-left" type="button" onClick={() => setCategoryOpen(true)}>
            {category}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm">Payment source</label>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1">
            {paymentSources.map((source) => (
              <button
                className={`rounded-md py-2 text-sm ${paymentSource === source ? 'bg-sky-600 text-white' : 'text-slate-300'}`}
                key={source}
                onClick={() => setPaymentSource(source)}
                type="button"
              >
                {source === 'credit_card' ? 'Credit card' : 'Joint account'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Extra detail</label>
          <input
            className="input"
            value={extraDetail ?? ''}
            onChange={(e) => setExtraDetail(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <button className="w-full rounded-lg bg-sky-600 py-3 font-medium" onClick={onSave} type="button">
          Save expense
        </button>
      </div>

      <div className="card space-y-2">
        <h3 className="font-semibold">Last 10 entries</h3>
        {latestEntries?.length ? (
          latestEntries.map((entry) => (
            <div className="rounded-lg border border-slate-800 p-2 text-sm" key={entry.id}>
              <div className="flex justify-between gap-2">
                <span>{entry.dateLocal}</span>
                <span>{formatEur(entry.amountCents)}</span>
              </div>
              <div className="text-slate-300">{entry.category} • {entry.paymentSource === 'credit_card' ? 'Credit card' : 'Joint account'}</div>
              <div className="mt-2 flex gap-2">
                <button className="btn text-xs" onClick={() => onDuplicate(entry)} type="button">Duplicate</button>
                <button
                  className="btn text-xs text-rose-300"
                  onClick={async () => {
                    if (window.confirm('Delete this expense?')) await db.expenses.delete(entry.id);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No entries yet.</p>
        )}
      </div>

      <aside
        className={`fixed inset-0 z-20 transition ${categoryOpen ? 'pointer-events-auto bg-black/60' : 'pointer-events-none bg-black/0'}`}
        onClick={() => setCategoryOpen(false)}
      >
        <div
          className={`h-full w-11/12 max-w-sm bg-slate-950 p-4 transition ${categoryOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-2 text-lg font-semibold">Pick category</h3>
          <input
            className="input mb-3"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mb-3">
            <p className="mb-1 text-xs uppercase text-slate-400">Top 6</p>
            <div className="flex flex-wrap gap-2">
              {top6.map((item) => (
                <button
                  className="btn text-xs"
                  key={item}
                  onClick={() => {
                    setCategory(item);
                    setCategoryOpen(false);
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-auto">
            {categories
              .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left text-sm ${
                    item === category ? 'border-sky-500 bg-sky-900/20' : 'border-slate-800 bg-slate-900'
                  } ${item === lastUsed ? 'ring-1 ring-emerald-500' : ''}`}
                  key={item}
                  onClick={() => {
                    setCategory(item);
                    setCategoryOpen(false);
                  }}
                  type="button"
                >
                  {item} {item === lastUsed ? <span className="text-xs text-emerald-400">(last used)</span> : null}
                </button>
              ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
