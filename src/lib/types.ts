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

export const paymentMethods = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'UPI / Digital',
  'Bank Transfer',
] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export const recurringFrequencies = ['none', 'weekly', 'monthly', 'yearly'] as const;
export type RecurringFrequency = (typeof recurringFrequencies)[number];

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  paymentMethod?: PaymentMethod;
  tag?: string;
  recurring?: RecurringFrequency;
  receiptUrl?: string;
};

export type ExpenseFirestore = Omit<Expense, 'date' | 'id'> & {
  date: Timestamp;
};

export type Budget = {
  amount: number;
  categoryBudgets?: Record<string, number>;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category?: string;
  icon?: string;
};

