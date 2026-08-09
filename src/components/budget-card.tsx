'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { revalidateDashboard } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Pencil, 
  Wallet, 
  CreditCard, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  X,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { Budget, Expense } from '@/lib/types';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type BudgetCardProps = {
  budget: Budget;
  spent: number;
  expenses: Expense[];
  userId: string;
  onBudgetSet?: () => void;
};

import { useCurrency } from '@/context/currency-context';

export default function BudgetCard({
  budget,
  spent,
  expenses,
  userId,
  onBudgetSet,
}: BudgetCardProps) {
  const { formatCurrency } = useCurrency();
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(budget.amount === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(
    budget.amount > 0 ? String(budget.amount) : ''
  );

  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;
  const isOverBudget = remaining < 0;

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
        description: 'Budget updated successfully.',
      });
      await revalidateDashboard();
      setIsEditing(false);
      if (onBudgetSet) onBudgetSet();
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

  // Category Spikes calculation (exceeds 40% of budget)
  const categorySpikes = useMemo(() => {
    if (budget.amount <= 0) return [];
    const totals: Record<string, number> = {};
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    const threshold = budget.amount * 0.4;
    return Object.entries(totals)
      .filter(([_, total]) => total > threshold)
      .map(([cat, total]) => ({
        category: cat,
        amount: total,
        percentage: (total / budget.amount) * 100,
      }));
  }, [expenses, budget.amount]);

  // Combined notifications list
  const notifications = useMemo(() => {
    const list = [];
    if (budget.amount > 0) {
      if (isOverBudget) {
        list.push({
          type: 'danger',
          message: `You have exceeded your total monthly budget by ${formatCurrency(Math.abs(remaining))}!`,
        });
      } else if (progress >= 80) {
        list.push({
          type: 'warning',
          message: `Warning: You have used ${progress.toFixed(0)}% of your monthly budget.`,
        });
      }

      categorySpikes.forEach(spike => {
        list.push({
          type: 'warning',
          message: `Category Alert: ${spike.category} expenses have reached ${spike.percentage.toFixed(0)}% of your total budget (${formatCurrency(spike.amount)} spent).`,
        });
      });
    }
    return list;
  }, [budget.amount, progress, isOverBudget, remaining, categorySpikes]);

  return (
    <div className="space-y-6">
      {/* 4-Card Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Budget */}
        <Card className="glass-card border-primary/20 hover:border-primary/40 shadow-lg relative overflow-hidden transition-smooth">
          <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full flex items-start justify-end p-2.5">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <CardContent className="p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Monthly Budget</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className="h-6 w-6 rounded-md hover:bg-muted/50 transition-smooth"
              >
                {isEditing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
              </Button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="flex items-center gap-1.5 animate-accordion-down">
                <div className="relative flex-grow">
                  <DollarSign className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    name="amount"
                    type="number"
                    step="10"
                    value={budgetAmount}
                    onChange={e => setBudgetAmount(e.target.value)}
                    className="pl-7 h-7 text-xs border-border/60 bg-muted/20 focus-visible:ring-primary/40 rounded-md"
                    placeholder="Limit"
                    disabled={isSaving}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-white h-7 px-2 rounded-md text-[10px]"
                >
                  {isSaving ? '...' : 'Save'}
                </Button>
              </form>
            ) : (
              <h3 className="text-xl font-bold font-headline text-foreground">
                {formatCurrency(budget.amount)}
              </h3>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Amount Spent */}
        <Card className="glass-card border-blue-500/10 hover:border-blue-500/20 shadow-lg relative overflow-hidden transition-smooth">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full flex items-start justify-end p-2.5">
            <CreditCard className="h-4 w-4 text-blue-400" />
          </div>
          <CardContent className="p-5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Total Spent</span>
            <h3 className="text-xl font-bold font-headline text-foreground">
              {formatCurrency(spent)}
            </h3>
          </CardContent>
        </Card>

        {/* Card 3: Remaining Balance */}
        <Card className="glass-card border-emerald-500/10 hover:border-emerald-500/20 shadow-lg relative overflow-hidden transition-smooth">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full flex items-start justify-end p-2.5">
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <CardContent className="p-5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Remaining Limit</span>
            <h3 className="text-xl font-bold font-headline text-emerald-400">
              {formatCurrency(remaining > 0 ? remaining : 0)}
            </h3>
          </CardContent>
        </Card>

        {/* Card 4: Over Budget */}
        <Card className={cn(
          "glass-card shadow-lg relative overflow-hidden transition-smooth border-red-500/10 hover:border-red-500/20",
          isOverBudget && "border-red-500/20 bg-red-500/[0.02] animate-pulse-glow"
        )}>
          <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-bl-full flex items-start justify-end p-2.5">
            <AlertTriangle className={cn("h-4 w-4 text-muted-foreground/60", isOverBudget && "text-red-400")} />
          </div>
          <CardContent className="p-5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Over Draft</span>
            <h3 className={cn("text-xl font-bold font-headline", isOverBudget ? "text-red-400 font-extrabold" : "text-muted-foreground/60")}>
              {formatCurrency(isOverBudget ? Math.abs(remaining) : 0)}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Alert notification row */}
      {budget.amount > 0 && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2 p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold px-0.5">
              <span>Overall Spending Progress</span>
              <span className={cn(
                "font-bold",
                progress >= 90 ? "text-red-400" : progress >= 70 ? "text-amber-400" : "text-primary"
              )}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/40 border border-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-smooth duration-500",
                  progress < 70 
                    ? "bg-gradient-to-r from-primary to-purple-400" 
                    : progress < 90 
                      ? "bg-gradient-to-r from-amber-500 to-orange-400" 
                      : "bg-gradient-to-r from-rose-500 to-red-500 animate-pulse-glow"
                )}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          {/* Budget Alerts Notifications (Notice Center) */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">Budget Alerts</h4>
              <div className="space-y-2">
                {notifications.map((notif, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-normal animate-accordion-down",
                      notif.type === 'danger' 
                        ? "bg-red-500/5 border-red-500/10 text-red-400" 
                        : "bg-amber-500/5 border-amber-500/10 text-amber-400"
                    )}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{notif.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
