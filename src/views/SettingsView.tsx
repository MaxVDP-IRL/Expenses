import { useState } from 'react';
import { db } from '../db';
import { buildExpensesCsv, buildIncomeCsv, shareOrDownloadCsv } from '../utils/exportCsv';
import { exportCsvString, exportJsonString, importCanonicalOrMappedCsv, importJsonString, parseCsvRows, type CsvMapping } from '../utils/importExport';

const APP_VERSION = '1.0.0';

const defaultMapping: CsvMapping = {
  dateLocal: 'dateLocal',
  category: 'category',
  amount: 'amount',
  paymentSource: 'paymentSource',
  extraDetail: 'extraDetail'
};

const downloadFile = (filename: string, content: string, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export function SettingsView() {
  const [report, setReport] = useState('');
  const [toast, setToast] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [mapping, setMapping] = useState<CsvMapping>(() => {
    const raw = localStorage.getItem('csvMapping');
    if (!raw) return defaultMapping;

    try {
      const parsed = JSON.parse(raw) as Partial<CsvMapping>;
      return {
        dateLocal: parsed.dateLocal ?? defaultMapping.dateLocal,
        category: parsed.category ?? defaultMapping.category,
        amount: parsed.amount ?? defaultMapping.amount,
        paymentSource: parsed.paymentSource ?? defaultMapping.paymentSource,
        extraDetail: parsed.extraDetail ?? defaultMapping.extraDetail
      };
    } catch {
      return defaultMapping;
    }
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const runShare = async (title: string, items: Array<{ csv: string; filename: string }>) => {
    if (!items.length) {
      showToast('No data to export');
      return;
    }

    try {
      let downloadedAny = false;
      for (const item of items) {
        const result = await shareOrDownloadCsv(item.csv, item.filename);
        if (result === 'downloaded') downloadedAny = true;
      }
      if (downloadedAny) {
        showToast('CSV downloaded');
      } else {
        showToast(`${title} shared`);
      }
    } catch (error) {
      showToast(isAbortError(error) ? 'Share cancelled' : 'Share failed');
    }
  };

  const onShareThisMonth = async () => {
    const monthKey = getCurrentMonthKey();
    const [allExpenses, allIncomeMonths] = await Promise.all([db.expenses.toArray(), db.incomes.toArray()]);
    const expenses = allExpenses.filter((entry) => entry.dateLocal.startsWith(monthKey));
    const incomes = allIncomeMonths.filter((income) => income.monthKey === monthKey);
    await runShare('Monthly CSV', [
      ...(expenses.length ? [{ csv: buildExpensesCsv(expenses), filename: `expenses-${monthKey}.csv` }] : []),
      ...(incomes.length ? [{ csv: buildIncomeCsv(incomes), filename: `income-${monthKey}.csv` }] : [])
    ]);
  };

  const onShareAllData = async () => {
    const [expenses, incomes] = await Promise.all([db.expenses.toArray(), db.incomes.toArray()]);
    await runShare('All-data CSV', [
      ...(expenses.length ? [{ csv: buildExpensesCsv(expenses), filename: 'expenses-all.csv' }] : []),
      ...(incomes.length ? [{ csv: buildIncomeCsv(incomes), filename: 'income-all.csv' }] : [])
    ]);
  };

  const onShareIncomeOnly = async () => {
    const incomes = await db.incomes.toArray();
    if (!incomes.length) {
      showToast('No data to export');
      return;
    }
    await runShare('Income CSV', [{ csv: buildIncomeCsv(incomes), filename: 'income-all.csv' }]);
  };

  const onShareExpensesOnly = async () => {
    const expenses = await db.expenses.toArray();
    if (!expenses.length) {
      showToast('No data to export');
      return;
    }
    await runShare('Expenses CSV', [{ csv: buildExpensesCsv(expenses), filename: 'expenses-all.csv' }]);
  };

  const onImportJson = async (file: File) => {
    const text = await file.text();
    await importJsonString(text);
    setReport('JSON import completed.');
  };

  const onImportCsv = async (file: File) => {
    const text = await file.text();
    setCsvContent(text);
    const parsed = parseCsvRows(text);
    setCsvHeaders(parsed.headers);
    const canonical = ['dateLocal', 'category', 'amount', 'paymentSource', 'extraDetail'];
    if (canonical.every((key) => parsed.headers.includes(key))) {
      const result = await importCanonicalOrMappedCsv(text);
      setReport(`CSV imported: ${result.imported}, skipped: ${result.skipped} (${result.reasons.slice(0, 5).join('; ')})`);
    }
  };

  return (
    <section className="space-y-4">
      <div className="card space-y-2">
        <h2 className="text-lg font-semibold">Data tools</h2>
        <div className="grid gap-2">
          <button className="btn" type="button" onClick={async () => downloadFile('expenses-data.json', await exportJsonString(), 'application/json')}>
            Export JSON
          </button>
          <button className="btn" type="button" onClick={async () => downloadFile('expenses-data.csv', await exportCsvString(), 'text/csv')}>
            Export CSV
          </button>
          <label className="btn cursor-pointer text-center">
            Import JSON
            <input className="hidden" type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && onImportJson(e.target.files[0])} />
          </label>
          <label className="btn cursor-pointer text-center">
            Import CSV
            <input className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onImportCsv(e.target.files[0])} />
          </label>
          <button
            className="btn text-rose-300"
            type="button"
            onClick={async () => {
              const pass = window.prompt('Type DELETE ALL to confirm');
              if (pass === 'DELETE ALL') {
                await db.delete();
                window.location.reload();
              }
            }}
          >
            Delete all data
          </button>
        </div>
      </div>

      <div className="card space-y-2">
        <h2 className="text-lg font-semibold">Export</h2>
        <div className="grid gap-2">
          <button className="btn text-left" type="button" onClick={onShareThisMonth}>
            Share CSV (this month)
          </button>
          <button className="btn text-left" type="button" onClick={onShareAllData}>
            Share CSV (all data)
          </button>
          <button className="btn text-left" type="button" onClick={onShareIncomeOnly}>
            Share CSV (income only)
          </button>
          <button className="btn text-left" type="button" onClick={onShareExpensesOnly}>
            Share CSV (expenses only)
          </button>
        </div>
      </div>

      {csvHeaders.length ? (
        <div className="card space-y-2">
          <h3 className="font-semibold">CSV mapping import</h3>
          {(['dateLocal', 'category', 'amount', 'paymentSource', 'extraDetail'] as const).map((field) => (
            <label className="block text-sm" key={field}>
              {field}
              <select
                className="input mt-1"
                value={mapping[field]}
                onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
              >
                {csvHeaders.map((header) => (
                  <option value={header} key={header}>{header}</option>
                ))}
              </select>
            </label>
          ))}
          <button
            className="w-full rounded-lg bg-sky-600 py-2"
            type="button"
            onClick={async () => {
              localStorage.setItem('csvMapping', JSON.stringify(mapping));
              const result = await importCanonicalOrMappedCsv(csvContent, mapping);
              setReport(`Mapped CSV import: ${result.imported} imported, ${result.skipped} skipped. ${result.reasons.slice(0, 6).join('; ')}`);
            }}
          >
            Run mapped import
          </button>
        </div>
      ) : null}

      <div className="card">
        <h3 className="font-semibold">About</h3>
        <p className="text-sm text-slate-300">Version {APP_VERSION}</p>
        {report ? <p className="mt-2 text-sm text-slate-200">{report}</p> : null}
      </div>

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm text-slate-100 shadow-lg">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
