'use client';

import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Expense, ExpenseFirestore } from '@/lib/types';
import { useMemo } from 'react';

export function useExpenses(userId: string | undefined) {
  const firestore = useFirestore();

  const expensesQuery = useMemoFirebase(
    () =>
      firestore && userId
        ? query(
            collection(firestore, 'users', userId, 'expenses'),
            orderBy('date', 'desc')
          )
        : null,
    [firestore, userId]
  );

  const { data: expensesData, isLoading: loading } =
    useCollection<ExpenseFirestore>(expensesQuery);

  const expenses = useMemo(() => {
    if (!expensesData) {
      return [];
    }
    return expensesData.map(expense => ({
      ...expense,
      date: (expense.date as Timestamp).toDate(),
    }));
  }, [expensesData]);

  return { expenses, loading };
}
