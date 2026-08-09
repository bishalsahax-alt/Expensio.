'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  expenseCategories,
  type Expense,
  type ExpenseCategory,
} from '@/lib/types';
import { analyzeSpendingPatterns } from '@/ai/flows/analyze-spending-patterns';
import { forecastSpendingTrends } from '@/ai/flows/forecast-spending-trends';
import { getSavingsSuggestions } from '@/ai/flows/get-savings-suggestions';
import { predictBudgetExceedance } from '@/ai/flows/predict-budget-exceedance';

import { scanReceipt } from '@/ai/flows/scan-receipt';
import { financialAdvisorChat } from '@/ai/flows/financial-advisor-chat';

// Revalidate the path after a client-side mutation.
export async function revalidateDashboard() {
  revalidatePath('/');
}

// AI Actions
export async function runPredictBudgetExceedance(
  monthlyBudget: number,
  dailySpending: number[]
) {
  return await predictBudgetExceedance({ monthlyBudget, dailySpending });
}

export async function runGetSavingsSuggestions(
  spendingData: Record<ExpenseCategory, number>
) {
  return await getSavingsSuggestions({ spendingData, reductionTargetPercentage: 10 });
}

export async function runAnalyzeSpendingPatterns(expenses: Expense[]) {
  const simplifiedExpenses = expenses.map(e => ({
    category: e.category,
    amount: e.amount,
  }));
  return await analyzeSpendingPatterns({
    expenses: JSON.stringify(simplifiedExpenses),
  });
}

export async function runForecastSpendingTrends(
  expenses: Expense[],
  period: 'week' | 'month' | 'quarter'
) {
  const formattedExpenses = expenses.map(e => ({
    category: e.category,
    amount: e.amount,
    date: e.date.toISOString(),
  }));
  return await forecastSpendingTrends({ expenses: formattedExpenses, period });
}

export async function runScanReceipt(receiptText: string) {
  return await scanReceipt({ receiptText });
}

export async function runFinancialAdvisorChat(
  userQuery: string,
  expenses: Expense[],
  monthlyBudget: number
) {
  const simplifiedExpenses = expenses.map(e => ({
    category: e.category,
    amount: e.amount,
    description: e.description,
    date: e.date.toISOString().split('T')[0],
  }));

  const expenseContext = JSON.stringify({
    monthlyBudget,
    totalSpent: expenses.reduce((acc, curr) => acc + curr.amount, 0),
    expenseCount: expenses.length,
    recentExpenses: simplifiedExpenses.slice(0, 15),
  });

  return await financialAdvisorChat({ userQuery, expenseContext });
}
