'use client';

import { useEffect, useState, useMemo } from 'react';
import { useCurrency } from '@/context/currency-context';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PieChart as PieIcon, TrendingUp, Inbox, PlusCircle } from 'lucide-react';
import type { Expense } from '@/lib/types';

type DashboardChartsProps = {
  expenses: Expense[];
  onAddExpense?: () => void;
};

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', // Emerald
  'Dining Out': '#f59e0b', // Amber
  Transport: '#3b82f6', // Blue
  Housing: '#6366f1', // Indigo
  Utilities: '#06b6d4', // Cyan
  Health: '#ec4899', // Pink
  Entertainment: '#8b5cf6', // Violet
  Shopping: '#f43f5e', // Rose
  Other: '#64748b', // Slate
};

export default function DashboardCharts({ expenses, onAddExpense }: DashboardChartsProps) {
  const { formatCurrency } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  const trendData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      // Format as YYYY-MM-DD for grouping
      const dateKey = exp.date.toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + exp.amount;
    });

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        dateRaw: new Date(date),
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }))
      .sort((a, b) => a.dateRaw.getTime() - b.dateRaw.getTime());
  }, [expenses]);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="glass-card border-border/40 shadow-xl py-12">
        <CardContent className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <Inbox className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <CardTitle className="font-headline text-lg font-bold text-foreground">No Spending Data Yet</CardTitle>
            <p className="text-xs text-muted-foreground leading-normal">
              Unlock professional charts and transaction breakdown analytics by adding your very first expense.
            </p>
          </div>
          {onAddExpense && (
            <Button
              onClick={onAddExpense}
              className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs h-9 px-4 mt-2"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Add First Expense
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Category Breakdown Donut */}
      <Card className="glass-card border-border/40 shadow-xl overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-border/20">
          <CardTitle className="flex items-center gap-2 font-headline text-base font-bold text-foreground">
            <PieIcon className="h-4.5 w-4.5 text-primary" />
            <span>Category Allocation</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Visual breakdown of expenses by category.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px] flex items-center justify-center pt-6">
          <div className="w-full h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name] || '#6366f1'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Spending Trend Spline Area */}
      <Card className="glass-card border-border/40 shadow-xl overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-border/20">
          <CardTitle className="flex items-center gap-2 font-headline text-base font-bold text-foreground">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            <span>Spending Trajectory</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Daily expenditure burn rate over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px] flex items-center justify-center pt-6">
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
