import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { buildExportWorkbook, shareOrDownloadXlsx, workbookToU8 } from '../utils/exportXlsx';
import type { ExpenseEntry, IncomeMonth, RecurringExpenseTemplate, Category, PaymentSource } from '../types';
import { categories, paymentSources } from '../types';
import { exportJsonString, importCanonicalOrMappedCsv, importJsonString, parseCsvRows, type CsvMapping } from '../utils/importExport';
import { nowIso } from '../utils/date';

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

  const recurringTemplates = useLiveQuery(() => db.recurringTemplates.orderBy('createdAt').reverse().toArray(), []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const runShare = async (filename: string, payload: { expenses?: ExpenseEntry[]; incomes?: IncomeMonth[] }) => {
    const expenses = payload.expenses ?? [];
    const incomes = payload.incomes ?? [];
    if (!expenses.length && !incomes.length) {
      showToast('No data to export');
      return;
    }

    try {
      const wb = buildExportWorkbook({ expenses, incomes });
      const result = await shareOrDownloadXlsx(workbookToU8(wb), filename);
      if (result === 'downloaded') showToast('Exported (downloaded)');
    } catch (error) {
      if (isAbortError(error)) {
        showToast('Share cancelled');
      } else {
        console.error(error);
        showToast('Share failed');
      }
    }
  };

  const onShareThisMonth = async () => {
    const monthKey = getCurrentMonthKey();
    const [allExpenses, allIncomeMonths] = await Promise.all([db.expenses.toArray(), db.incomes.toArray()]);
    const expenses = allExpenses.filter((entry) => entry.dateLocal.startsWith(monthKey));
    const incomes = allIncomeMonths.filter((income) => income.monthKey === monthKey);
    await runShare(`expenses-income-${monthKey}.xlsx`, { expenses, incomes });
  };

  const onShareAllData = async () => {
    const [expenses, incomes] = await Promise.all([db.expenses.toArray(), db.incomes.toArray()]);
    await runShare('expenses-income-all.xlsx', { expenses, incomes });
  };

  const onShareIncomeOnly = async () => {
    const incomes = await db.incomes.toArray();
    await runShare('income-all.xlsx', { incomes });
  };

  const onShareExpensesOnly = async () => {
    const expenses = await db.expenses.toArray();
    await runShare('expenses-all.xlsx', { expenses });
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recurring monthly expenses</h2>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setEditingTemplateId(null);
              setEditorOpen(true);
            }}
          >
            Add recurring
          </button>
        </div>
        {recurringTemplates?.length ? recurringTemplates.map((template) => (
          <div className="rounded-lg border border-slate-800 p-2 text-sm" key={template.id}>
            <div className="flex justify-between gap-2">
              <span className="font-medium">{template.category}</span>
              <span>€{(template.amountCents / 100).toFixed(2)}</span>
            </div>
            <div className="text-slate-300">Day {template.dayOfMonth} • {template.paymentSource === 'credit_card' ? 'Credit card' : 'Joint account'}</div>
            {template.extraDetail ? <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-400">{template.extraDetail}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="btn text-xs"
                onClick={async () => {
                  await db.recurringTemplates.put({ ...template, isActive: !template.isActive, updatedAt: nowIso() });
                }}
                type="button"
              >
                {template.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                className="btn text-xs"
                onClick={() => {
                  setEditingTemplateId(template.id);
                  setEditorOpen(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="btn text-xs text-rose-300"
                onClick={async () => {
                  if (window.confirm('Delete this recurring template?')) {
                    await db.recurringTemplates.delete(template.id);
                  }
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        )) : <p className="text-sm text-slate-400">No recurring templates yet.</p>}
      </div>

      <div className="card space-y-2">
        <h2 className="text-lg font-semibold">Data tools</h2>
        <div className="grid gap-2">
          <button className="btn" type="button" onClick={async () => downloadFile('expenses-data.json', await exportJsonString(), 'application/json')}>
            Export JSON
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
            Share XLSX (this month)
          </button>
          <button className="btn text-left" type="button" onClick={onShareAllData}>
            Share XLSX (all data)
          </button>
          <button className="btn text-left" type="button" onClick={onShareIncomeOnly}>
            Share XLSX (income only)
          </button>
          <button className="btn text-left" type="button" onClick={onShareExpensesOnly}>
            Share XLSX (expenses only)
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

      {editorOpen ? (
        <RecurringTemplateModal
          templateId={editingTemplateId}
          onClose={() => {
            setEditorOpen(false);
            setEditingTemplateId(null);
          }}
        />
      ) : null}
    </section>
  );
}

function RecurringTemplateModal({ templateId, onClose }: { templateId: string | null; onClose: () => void }) {
  const template = useLiveQuery(() => (templateId ? db.recurringTemplates.get(templateId) : undefined), [templateId]);
  const [category, setCategory] = useState<Category>('Mortgage');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('joint_account');
  const [amount, setAmount] = useState('0.00');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [extraDetail, setExtraDetail] = useState('');

  useEffect(() => {
    if (!template) return;
    setCategory(template.category);
    setPaymentSource(template.paymentSource);
    setAmount((template.amountCents / 100).toFixed(2));
    setDayOfMonth(template.dayOfMonth);
    setExtraDetail(template.extraDetail ?? '');
  }, [template]);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4">
      <div className="card w-full max-w-sm space-y-3">
        <h3 className="text-lg font-semibold">{templateId ? 'Edit recurring expense' : 'Add recurring expense'}</h3>
        <label className="block text-sm">Category
          <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm">Amount (€)
          <input className="input mt-1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="block text-sm">Payment source
          <select className="input mt-1" value={paymentSource} onChange={(e) => setPaymentSource(e.target.value as PaymentSource)}>
            {paymentSources.map((item) => <option key={item} value={item}>{item === 'credit_card' ? 'Credit card' : 'Joint account'}</option>)}
          </select>
        </label>
        <label className="block text-sm">Day of month
          <input className="input mt-1" type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} />
        </label>
        <label className="block text-sm">Extra detail
          <input className="input mt-1" value={extraDetail} onChange={(e) => setExtraDetail(e.target.value)} placeholder="Optional" />
        </label>
        <div className="flex gap-2">
          <button className="btn flex-1" type="button" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 rounded-lg bg-sky-600 py-2"
            type="button"
            onClick={async () => {
              const parsed = Math.round(Number(amount.replace(',', '.')) * 100);
              if (!Number.isFinite(parsed) || parsed <= 0) return;
              const day = Math.min(31, Math.max(1, Math.round(dayOfMonth)));
              const timestamp = nowIso();
              const payload: RecurringExpenseTemplate = {
                id: templateId ?? uuid(),
                category,
                amountCents: parsed,
                paymentSource,
                dayOfMonth: day,
                extraDetail: extraDetail.trim() ? extraDetail.trim() : undefined,
                isActive: template?.isActive ?? true,
                createdAt: template?.createdAt ?? timestamp,
                updatedAt: timestamp
              };
              await db.recurringTemplates.put(payload);
              onClose();
            }}
          >
            {templateId ? 'Save changes' : 'Save recurring'}
          </button>
        </div>
      </div>
    </div>
  );
}
