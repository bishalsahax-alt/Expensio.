'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { revalidateDashboard } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Pencil } from 'lucide-react';
import type { Budget } from '@/lib/types';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type BudgetCardProps = {
  budget: Budget;
  spent: number;
  userId: string;
};

export default function BudgetCard({ budget, spent, userId }: BudgetCardProps) {
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(budget.amount === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(
    budget.amount > 0 ? String(budget.amount) : ''
  );

  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;

  useEffect(() => {
    if (budget.amount === 0 && !isEditing) {
      setIsEditing(true);
    }
    if (budget.amount > 0) {
      setBudgetAmount(String(budget.amount));
    }
  }, [budget.amount, isEditing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const amount = Number(budgetAmount);

    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid, non-negative budget amount.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    if (!firestore || !userId) {
      toast({
        title: 'Error',
        description: 'You must be signed in to update your budget.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      setDocumentNonBlocking(userRef, { monthlyBudget: amount }, { merge: true });
      toast({
        title: 'Success',
        description: 'Budget updated.',
      });
      await revalidateDashboard();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update budget.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Budget</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Budget</span>
          </Button>
        </div>
        {isEditing ? (
          <form onSubmit={handleSave} className="flex items-center gap-2 pt-2">
            <div className="relative flex-grow">
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="amount"
                type="number"
                step="10"
                value={budgetAmount}
                onChange={e => setBudgetAmount(e.target.value)}
                className="pl-8"
                placeholder="Enter your budget"
                disabled={isSaving}
              />
            </div>
            <Button type="submit" disabled={isSaving} size="sm">
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {budget.amount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
          </form>
        ) : (
          <CardDescription>
            You have spent{' '}
            <span className="font-semibold text-primary">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(spent)}
            </span>{' '}
            of your{' '}
            <span className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(budget.amount)}
            </span>{' '}
            budget.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="mb-2 h-3" />
        <div className="text-sm text-muted-foreground">
          {remaining >= 0 ? (
            <span>
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(remaining)}
              </span>{' '}
              remaining
            </span>
          ) : (
            <span>
              Over budget by{' '}
              <span className="font-semibold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(Math.abs(remaining))}
              </span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
