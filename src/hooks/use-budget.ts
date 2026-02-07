'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Budget } from '@/lib/types';
import { useUser } from '@/firebase';

export function useBudget(userId: string | undefined) {
  const [budget, setBudget] = useState<Budget>({ amount: 0 });
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && userId ? doc(firestore, 'users', userId) : null),
    [firestore, userId]
  );

  useEffect(() => {
    if (!userDocRef) {
      setLoading(false);
      setBudget({ amount: 0 });
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      userDocRef,
      docSnap => {
        if (docSnap.exists()) {
          setBudget({ amount: docSnap.data().monthlyBudget || 0 });
        } else {
          setBudget({ amount: 0 });
        }
        setLoading(false);
      },
      error => {
        console.error('Error fetching budget:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userDocRef]);

  return { budget, loading };
}
