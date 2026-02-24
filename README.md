# Expenses Tracker (Mobile-first, dark mode)

Static React app for tracking personal expenses in EUR, persisted locally in IndexedDB.

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS (dark mode only)
- Dexie + dexie-react-hooks (IndexedDB)
- Recharts
- date-fns
- Vitest

## Local development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Run tests:
   ```bash
   npm run test
   ```
4. Build:
   ```bash
   npm run build
   ```

## GitHub Pages deploy
- Vite base path is set via env in `vite.config.ts`:
  - local: `/`
  - pages: `/Expenses/` when `GITHUB_PAGES=1`
- Build for pages:
  ```bash
  GITHUB_PAGES=1 npm run build
  ```
- Deploy `dist/` using GitHub Pages (Actions or `gh-pages` branch workflow).

## IndexedDB persistence
- Dexie DB name: `expensesTracker`
- Tables:
  - `expenses` keyed by `id`
  - `incomes` keyed by `monthKey`
- Data stays on-device in browser storage. No backend, no tracking.

## Import / export formats
### JSON
- Export includes all data:
  ```json
  {
    "expenses": [...ExpenseEntry],
    "incomes": [...IncomeMonth]
  }
  ```

### XLSX export
- Workbook can include two sheets:
  - `Expenses`: `dateLocal, category, amountEur, paymentSource, extraDetail`
  - `Income`: `monthKey, incomeMaxEur, incomeLiisuEur, incomeTotalEur`
- Export buttons in **Settings → Export** support:
  - Share XLSX (this month)
  - Share XLSX (all data)
  - Share XLSX (income only)
  - Share XLSX (expenses only)

### Export on phone (Google Sheets)
1. Open **Settings → Export** and tap a **Share XLSX** option.
2. On mobile, the Web Share sheet opens with an `.xlsx` attachment.
3. Choose **Google Sheets** directly, or choose **Google Drive** then open in Sheets.
4. If Web Share is not available, the app downloads the XLSX directly.

### CSV import
1. **Canonical CSV** expected headers:
   ```csv
   dateLocal,category,amount,paymentSource,extraDetail
   ```
2. **Mapping import** supports arbitrary headers via local mapping UI in Settings.
   - Mapping is saved in `localStorage` under key `csvMapping`.

## Notes
- Currency is EUR only.
- Dark mode only.
- Optimized for mobile touch targets and bottom navigation.
