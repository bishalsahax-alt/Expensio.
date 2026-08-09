'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Calendar, Wallet, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Expense, Budget } from '@/lib/types';

import { useCurrency } from '@/context/currency-context';

type ReportsProps = {
  expenses: Expense[];
  budget: Budget;
  userId: string;
};

export default function Reports({ expenses, budget, userId }: ReportsProps) {
  const { formatCurrency } = useCurrency();
  const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const remaining = budget.amount - totalSpent;
  const isOverBudget = remaining < 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-xl font-bold font-headline text-foreground">Financial Statements</h2>
          <p className="text-xs text-muted-foreground">Print or export your transaction summaries.</p>
        </div>
        <Button 
          onClick={handlePrint}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg text-xs h-9 px-4"
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print / PDF Export
        </Button>
      </div>

      {/* Main Printable Card */}
      <Card className="glass-card border-border/40 shadow-xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Print Header */}
        <CardHeader className="border-b border-border/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary print:text-black print:border-black">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg font-extrabold text-foreground print:text-black">
                  Expensio Ledger Statement
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground print:text-black/80">
                  Detailed expenditure reconciliation sheet.
                </CardDescription>
              </div>
            </div>
            
            <div className="text-left sm:text-right text-xs space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5 text-muted-foreground print:text-black/80">
                <Calendar className="h-3.5 w-3.5" />
                <span>Issued: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
              </div>
              <p className="text-muted-foreground print:text-black/80">User ID: <code className="bg-muted/30 px-1 py-0.5 rounded text-[10px] print:bg-none print:text-black font-mono">{userId.slice(0, 15)}...</code></p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-6">
          {/* Summary Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] print:border-black/20 print:bg-black/5">
              <div className="flex items-center gap-2.5 text-muted-foreground print:text-black/80 mb-1.5">
                <Wallet className="h-4 w-4 text-primary print:text-black" />
                <span className="text-[10px] uppercase font-semibold tracking-wider">Allocated Target</span>
              </div>
              <p className="text-lg font-bold font-headline text-foreground print:text-black">
                {formatCurrency(budget.amount)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] print:border-black/20 print:bg-black/5">
              <div className="flex items-center gap-2.5 text-muted-foreground print:text-black/80 mb-1.5">
                <CreditCard className="h-4 w-4 text-cyan-400 print:text-black" />
                <span className="text-[10px] uppercase font-semibold tracking-wider">Accumulated Spent</span>
              </div>
              <p className="text-lg font-bold font-headline text-foreground print:text-black">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className={`p-4 rounded-xl border print:border-black/20 print:bg-black/5 ${
              isOverBudget ? 'bg-red-500/5 border-red-500/10 text-red-400 print:text-black' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 print:text-black'
            }`}>
              <div className="flex items-center gap-2.5 mb-1.5 text-muted-foreground print:text-black/80">
                {isOverBudget ? <AlertTriangle className="h-4 w-4 text-red-400 print:text-black" /> : <ShieldCheck className="h-4 w-4 text-emerald-400 print:text-black" />}
                <span className="text-[10px] uppercase font-semibold tracking-wider">
                  {isOverBudget ? 'Over Budget' : 'Remaining Target'}
                </span>
              </div>
              <p className="text-lg font-bold font-headline">
                {formatCurrency(Math.abs(remaining))}
              </p>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-headline uppercase text-muted-foreground tracking-wider print:text-black">
              Expenditures by Category
            </h3>
            
            {categoryTotals.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center print:text-black">No transaction records logged.</p>
            ) : (
              <div className="border border-border/20 rounded-xl overflow-hidden print:border-black/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/20 print:bg-black/5 print:border-black/20">
                      <th className="p-3 pl-4 font-semibold text-muted-foreground print:text-black">Category</th>
                      <th className="p-3 font-semibold text-muted-foreground print:text-black text-right">Transactions</th>
                      <th className="p-3 pr-4 font-semibold text-muted-foreground print:text-black text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryTotals.map(([cat, total]) => {
                      const count = expenses.filter(e => e.category === cat).length;
                      return (
                        <tr key={cat} className="border-b border-border/10 print:border-black/10 print:text-black">
                          <td className="p-3 pl-4 font-medium">{cat}</td>
                          <td className="p-3 text-right text-muted-foreground print:text-black/80">{count} {count === 1 ? 'charge' : 'charges'}</td>
                          <td className="p-3 pr-4 text-right font-semibold">{formatCurrency(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Statement Footer */}
          <div className="border-t border-border/20 pt-6 text-center text-[10px] text-muted-foreground print:text-black/80 print:border-black/20">
            <p>Expensio Ledger Statement is a computer-generated summary. No signature required.</p>
            <p className="mt-1">Generated dynamically from Cloud Firestore security nodes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
