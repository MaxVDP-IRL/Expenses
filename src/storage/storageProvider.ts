import type { ExpenseEntry, IncomeMonth, RecurringExpenseTemplate } from '../types';

export interface ExpenseStorage {
  getExpenses(): Promise<ExpenseEntry[]>;
  addExpense(expense: ExpenseEntry): Promise<void>;
  updateExpense(expense: ExpenseEntry): Promise<void>;
  deleteExpense(id: string): Promise<void>;

  getIncomeMonths(): Promise<IncomeMonth[]>;
  updateIncomeMonth(income: IncomeMonth): Promise<void>;

  getRecurringTemplates(): Promise<RecurringExpenseTemplate[]>;
  addRecurringTemplate(template: RecurringExpenseTemplate): Promise<void>;
  updateRecurringTemplate(template: RecurringExpenseTemplate): Promise<void>;
  deleteRecurringTemplate(id: string): Promise<void>;
}
