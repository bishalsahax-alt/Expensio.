'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { expenseCategories, type ExpenseCategory, type Expense } from '@/lib/types';
import { CategoryIcon } from './icons';
import { Sliders, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type CategoryBudgetsProps = {
  userId: string;
  expenses: Expense[];
  initialCategoryBudgets?: Record<string, number>;
};

const defaultCaps: Record<string, number> = {
  Groceries: 400,
  'Dining Out': 250,
  Transport: 150,
  Housing: 1000,
  Utilities: 200,
  Health: 150,
  Entertainment: 150,
  Shopping: 200,
  Other: 100,
};

export default function CategoryBudgets({
  userId,
  expenses,
  initialCategoryBudgets,
}: CategoryBudgetsProps) {
  const firestore = useFirestore();
  const [caps, setCaps] = useState<Record<string, number>>(
    initialCategoryBudgets || defaultCaps
  );
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempVal, setTempVal] = useState('');

  // Calculate actual category spending from expenses
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleSaveCap = (cat: string) => {
    const val = parseFloat(tempVal);
    if (isNaN(val) || val < 0) return;

    const newCaps = { ...caps, [cat]: val };
    setCaps(newCaps);

    if (firestore && userId) {
      const userRef = doc(firestore, 'users', userId);
      setDocumentNonBlocking(userRef, { categoryBudgets: newCaps }, { merge: true });
    }

    toast({
      title: 'Category Cap Updated',
      description: `Set limit for ${cat} to $${val}`,
    });

    setEditingCategory(null);
  };

  return (
    <Card className="glass-card border-border/40 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Sliders className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold font-headline text-foreground">Category Budget Controls</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Set custom spend ceilings for each individual spending category.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map((cat) => {
          const spent = categoryTotals[cat] || 0;
          const cap = caps[cat] || 0;
          const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
          const isOver = cap > 0 && spent > cap;
          const isWarning = cap > 0 && spent / cap >= 0.8 && !isOver;

          return (
            <div
              key={cat}
              className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-3 hover:border-primary/30 transition-smooth"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl border border-border/40 flex items-center justify-center bg-muted/20">
                    <CategoryIcon category={cat} className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{cat}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      ${spent.toFixed(0)} spent
                    </p>
                  </div>
                </div>

                {editingCategory !== cat ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(cat);
                      setTempVal(cap.toString());
                    }}
                    className="h-7 text-[11px] px-2 text-primary hover:bg-primary/10"
                  >
                    Edit Cap
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={tempVal}
                      onChange={(e) => setTempVal(e.target.value)}
                      className="h-7 w-20 text-xs px-2"
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSaveCap(cat)}
                      className="h-7 w-7 bg-primary text-white"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Limit: ${cap}</span>
                  <span
                    className={`font-semibold ${
                      isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${
                    isOver
                      ? '[&>div]:bg-rose-500'
                      : isWarning
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-primary'
                  }`}
                />
              </div>

              {isOver && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-semibold pt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Exceeded cap by ${(spent - cap).toFixed(0)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
