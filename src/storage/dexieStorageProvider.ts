import { db } from '../db';
import type { ExpenseEntry, IncomeMonth, RecurringExpenseTemplate } from '../types';
import type { ExpenseStorage } from './storageProvider';

export class DexieStorageProvider implements ExpenseStorage {
  async getExpenses(): Promise<ExpenseEntry[]> {
    return db.expenses.toArray();
  }

  async addExpense(expense: ExpenseEntry): Promise<void> {
    await db.expenses.add(expense);
  }

  async updateExpense(expense: ExpenseEntry): Promise<void> {
    await db.expenses.put(expense);
  }

  async deleteExpense(id: string): Promise<void> {
    await db.expenses.delete(id);
  }

  async getIncomeMonths(): Promise<IncomeMonth[]> {
    return db.incomes.toArray();
  }

  async updateIncomeMonth(income: IncomeMonth): Promise<void> {
    await db.incomes.put(income);
  }

  async getRecurringTemplates(): Promise<RecurringExpenseTemplate[]> {
    return db.recurringTemplates.toArray();
  }

  async addRecurringTemplate(template: RecurringExpenseTemplate): Promise<void> {
    await db.recurringTemplates.add(template);
  }

  async updateRecurringTemplate(template: RecurringExpenseTemplate): Promise<void> {
    await db.recurringTemplates.put(template);
  }

  async deleteRecurringTemplate(id: string): Promise<void> {
    await db.recurringTemplates.delete(id);
  }

  async clearAllData(): Promise<void> {
    await db.delete();
  }
}
