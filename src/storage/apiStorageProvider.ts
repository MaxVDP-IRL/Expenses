import type { ExpenseEntry, IncomeMonth, RecurringExpenseTemplate } from '../types';
import type { ExpenseStorage } from './storageProvider';

const jsonHeaders = { 'Content-Type': 'application/json' };

export class ApiStorageProvider implements ExpenseStorage {
  async getExpenses(): Promise<ExpenseEntry[]> {
    const response = await fetch('/api/expenses');
    return response.json();
  }

  async addExpense(expense: ExpenseEntry): Promise<void> {
    await fetch('/api/expenses', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(expense)
    });
  }

  async updateExpense(expense: ExpenseEntry): Promise<void> {
    await fetch(`/api/expenses/${expense.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(expense)
    });
  }

  async deleteExpense(id: string): Promise<void> {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  async getIncomeMonths(): Promise<IncomeMonth[]> {
    const response = await fetch('/api/income');
    return response.json();
  }

  async updateIncomeMonth(income: IncomeMonth): Promise<void> {
    await fetch(`/api/income/${income.monthKey}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(income)
    });
  }

  async getRecurringTemplates(): Promise<RecurringExpenseTemplate[]> {
    const response = await fetch('/api/recurring');
    return response.json();
  }

  async addRecurringTemplate(template: RecurringExpenseTemplate): Promise<void> {
    await fetch('/api/recurring', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(template)
    });
  }

  async updateRecurringTemplate(template: RecurringExpenseTemplate): Promise<void> {
    await fetch(`/api/recurring/${template.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(template)
    });
  }

  async deleteRecurringTemplate(id: string): Promise<void> {
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
  }
}
