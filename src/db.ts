import Dexie, { type Table } from 'dexie';
import type { ExpenseEntry, IncomeMonth, RecurringExpenseTemplate } from './types';

class ExpensesDB extends Dexie {
  expenses!: Table<ExpenseEntry, string>;
  incomes!: Table<IncomeMonth, string>;
  recurringTemplates!: Table<RecurringExpenseTemplate, string>;

  constructor() {
    super('expensesTracker');
    this.version(1).stores({
      expenses: 'id,dateLocal,category,paymentSource,createdAt',
      incomes: 'monthKey'
    });
    this.version(2).stores({
      expenses: 'id,dateLocal,category,paymentSource,createdAt,recurringTemplateId,recurringMonthKey,[recurringTemplateId+recurringMonthKey]',
      incomes: 'monthKey',
      recurringTemplates: 'id,isActive,dayOfMonth,category,paymentSource,createdAt'
    });
  }
}

export const db = new ExpensesDB();
