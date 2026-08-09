'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, CheckCircle, Flame, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SavingsGoal } from '@/lib/types';

type SavingsGoalsProps = {
  userId: string;
};

const defaultGoals: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 5000,
    currentAmount: 3200,
    targetDate: '2026-12-31',
    category: 'Safety',
  },
  {
    id: 'goal-2',
    name: 'Vacation Trip',
    targetAmount: 1800,
    currentAmount: 950,
    targetDate: '2026-10-15',
    category: 'Travel',
  },
  {
    id: 'goal-3',
    name: 'New Workstation',
    targetAmount: 2500,
    currentAmount: 1400,
    targetDate: '2026-11-30',
    category: 'Tech',
  },
];

export default function SavingsGoals({ userId }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>(defaultGoals);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleAddGoal = () => {
    if (!newGoalName || !newGoalTarget) {
      toast({
        title: 'Input Missing',
        description: 'Please specify goal name and target amount.',
        variant: 'destructive',
      });
      return;
    }

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName,
      targetAmount: parseFloat(newGoalTarget),
      currentAmount: 0,
      targetDate: newGoalDate || '2026-12-31',
      category: 'General',
    };

    setGoals([...goals, newGoal]);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setIsAddOpen(false);

    toast({
      title: 'Savings Goal Created',
      description: `Created goal "${newGoal.name}" with target $${newGoal.targetAmount}.`,
    });
  };

  const handleAddDeposit = () => {
    if (!depositGoalId || !depositAmount) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setGoals(goals.map(g => {
      if (g.id === depositGoalId) {
        return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amt) };
      }
      return g;
    }));

    toast({
      title: 'Deposit Recorded',
      description: `Added $${amt} toward your savings target.`,
    });

    setDepositGoalId(null);
    setDepositAmount('');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast({
      title: 'Goal Removed',
      description: 'The savings goal has been deleted.',
    });
  };

  return (
    <Card className="glass-card border-border/40 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold font-headline text-foreground">Savings Goals & Targets</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Track and build your financial reserves alongside expense budgets.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs h-8.5 px-3.5 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Savings Goal</span>
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-4 hover:border-emerald-500/30 transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {goal.category || 'General'}
                  </span>
                  <h4 className="text-sm font-bold text-foreground mt-1.5 font-headline">{goal.name}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Progress</span>
                  <span className="font-bold text-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2 bg-muted/40" />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground">
                    Saved: <strong className="text-emerald-400 font-mono">${goal.currentAmount.toLocaleString()}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Target: <strong className="text-foreground font-mono">${goal.targetAmount.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Target: {goal.targetDate}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositGoalId(goal.id)}
                  className="h-7 px-2.5 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  + Add Deposit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog for New Goal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md glass-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create New Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Goal Name</label>
              <Input
                placeholder="e.g. New Car, Emergency Fund"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Target Amount ($)</label>
              <Input
                type="number"
                placeholder="2500"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Target Date</label>
              <Input
                type="date"
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleAddGoal} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Deposit */}
      <Dialog open={!!depositGoalId} onOpenChange={() => setDepositGoalId(null)}>
        <DialogContent className="sm:max-w-xs glass-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Savings Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="number"
              placeholder="Deposit amount ($)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDepositGoalId(null)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleAddDeposit} size="sm" className="bg-emerald-600 text-white text-xs">
                Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
