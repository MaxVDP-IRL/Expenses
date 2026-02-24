export const categories = [
  'Food shopping',
  'Lunch',
  'Bills',
  'Gas',
  'Gas Service',
  'Internet, phone, TV',
  'Security',
  'Electricity',
  'Water',
  'Subscriptions',
  'Petrol',
  'Transport',
  'Holiday',
  'Entertainment',
  'Home',
  'Car',
  'Oskar',
  'Mia',
  'Mortgage',
  'Sports',
  'Beauty',
  'Gifts',
  'Clothes',
  'Miscellaneous',
  'Health',
  'Alcohol',
  'Eating out',
  'Takeaway'
] as const;

export type Category = (typeof categories)[number];

export const paymentSources = ['credit_card', 'joint_account'] as const;
export type PaymentSource = (typeof paymentSources)[number];

export interface ExpenseEntry {
  id: string;
  dateLocal: string;
  category: Category;
  amountCents: number;
  paymentSource: PaymentSource;
  extraDetail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeMonth {
  monthKey: string;
  incomeMaxCents: number;
  incomeLiisuCents: number;
  updatedAt: string;
}

export interface ImportReport {
  imported: number;
  skipped: number;
  reasons: string[];
}
