import type { Timestamp } from 'firebase/firestore';

export const expenseCategories = [
  'Groceries',
  'Dining Out',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Other',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
};

export type ExpenseFirestore = Omit<Expense, 'date' | 'id'> & {
  date: Timestamp;
};

export type Budget = {
  amount: number;
};
