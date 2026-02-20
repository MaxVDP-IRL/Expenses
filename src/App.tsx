import { useState } from 'react';
import { AddExpenseView } from './views/AddExpenseView';
import { MonthView } from './views/MonthView';
import { TrendsView } from './views/TrendsView';
import { SettingsView } from './views/SettingsView';

type Tab = 'add' | 'month' | 'trends' | 'settings';

const tabs: { key: Tab; label: string }[] = [
  { key: 'add', label: 'Add' },
  { key: 'month', label: 'Month' },
  { key: 'trends', label: 'Trends' },
  { key: 'settings', label: 'Settings' }
];

export default function App() {
  const [tab, setTab] = useState<Tab>('add');

  return (
    <div className="mx-auto min-h-screen max-w-xl pb-24">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 p-4 backdrop-blur">
        <h1 className="text-lg font-semibold">Expenses Tracker</h1>
      </header>
      <main className="space-y-4 p-4">
        {tab === 'add' && <AddExpenseView />}
        {tab === 'month' && <MonthView />}
        {tab === 'trends' && <TrendsView />}
        {tab === 'settings' && <SettingsView />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 p-2 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={`rounded-lg py-3 text-sm ${tab === item.key ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-200'}`}
              onClick={() => setTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
