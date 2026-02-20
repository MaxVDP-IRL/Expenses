import { useState } from 'react';
import { db } from '../db';
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

export function SettingsView() {
  const [report, setReport] = useState('');
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
    </section>
  );
}
