import Dexie, { type Table } from 'dexie';
import type { ExpenseEntry, IncomeMonth } from './types';

class ExpensesDB extends Dexie {
  expenses!: Table<ExpenseEntry, string>;
  incomes!: Table<IncomeMonth, string>;

  constructor() {
    super('expensesTracker');
    this.version(1).stores({
      expenses: 'id,dateLocal,category,paymentSource,createdAt',
      incomes: 'monthKey'
    });
  }
}

export const db = new ExpensesDB();
