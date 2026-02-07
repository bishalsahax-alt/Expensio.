'use client';

import { useEffect, useState } from 'react';
import type { Budget, Expense } from '@/lib/types';
import BudgetCard from '@/components/budget-card';
import ExpenseTable from '@/components/expense-table';
import AiCards from './ai-cards';
import { useExpenses } from '@/hooks/use-expenses';
import { useBudget } from '@/hooks/use-budget';
import Loading from '@/app/loading';

type DashboardProps = {
  userId: string;
};

export default function Dashboard({ userId }: DashboardProps) {
  const { budget, loading: budgetLoading } = useBudget(userId);
  const { expenses, loading: expensesLoading } = useExpenses(userId);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (budgetLoading || expensesLoading) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <BudgetCard userId={userId} budget={budget} spent={totalSpent} />
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-2">
        <ExpenseTable
          userId={userId}
          expenses={expenses}
          loading={expensesLoading}
        />
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-2">
        <AiCards
          expenses={expenses}
          budget={budget.amount}
          loading={expensesLoading}
        />
      </div>
    </div>
  );
}
