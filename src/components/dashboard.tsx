'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Budget, Expense } from '@/lib/types';
import BudgetCard from '@/components/budget-card';
import ExpenseTable from '@/components/expense-table';
import AiCards from '@/components/ai-cards';
import DashboardCharts from '@/components/dashboard-charts';
import Reports from '@/components/reports';
import SettingsView from '@/components/settings-view';
import Header from '@/components/header';
import { useExpenses } from '@/hooks/use-expenses';
import { useBudget } from '@/hooks/use-budget';
import Loading from '@/app/loading';
import AddExpenseDialog from '@/components/add-expense-dialog';
import ReceiptScannerDialog from '@/components/receipt-scanner-dialog';
import SavingsGoals from '@/components/savings-goals';
import CategoryBudgets from '@/components/category-budgets';
import AiChatAssistant from '@/components/ai-chat-assistant';
import ImportExportDialog from '@/components/import-export-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Sparkles,
  Wallet,
  FileText,
  Settings,
  PlusCircle,
  TrendingUp,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Camera,
  Target,
  FileSpreadsheet,
  Bot
} from 'lucide-react';

import { useCurrency } from '@/context/currency-context';

type DashboardProps = {
  userId: string;
};

export default function Dashboard({ userId }: DashboardProps) {
  const { formatCurrency } = useCurrency();
  const { budget, loading: budgetLoading } = useBudget(userId);
  const { expenses, loading: expensesLoading } = useExpenses(userId);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);

  // Dynamic AI Insight calculations
  const dashboardInsights = useMemo(() => {
    if (expenses.length === 0) return [];
    const list = [];
    
    // Group totals
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    
    // Find highest category
    const sortedCategories = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const [topCat, topAmt] = sortedCategories[0] || ['', 0];
    const topPercentage = totalSpent > 0 ? (topAmt / totalSpent) * 100 : 0;
    
    // 1. Spike Alert (top category represents > 30% of total spent)
    if (topPercentage > 30) {
      list.push({
        type: 'warning',
        icon: 'spike',
        message: `${topCat} is unusually high, taking up ${topPercentage.toFixed(0)}% of expenses!`,
        action: 'Consider shifting discretionary category allocations.'
      });
    } else {
      list.push({
        type: 'info',
        icon: 'trend',
        message: 'Your spending is relatively balanced across categories.',
        action: 'Great work maintaining diverse ledger allocations.'
      });
    }
    
    // 2. Savings Recommendation (10% of top category spend)
    const potentialSaving = topAmt * 0.1;
    if (potentialSaving > 0) {
      list.push({
        type: 'success',
        icon: 'savings',
        message: `Save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(potentialSaving)} by reducing ${topCat} by 10%.`,
        action: 'Try planning purchases or seeking alternatives.'
      });
    }
    
    // 3. Projected Spending (daily average projected to end of month)
    const uniqueDates = new Set(expenses.map(e => e.date.toDateString()));
    const daysCount = Math.max(1, uniqueDates.size);
    const dailyAvg = totalSpent / daysCount;
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const projectedSpend = dailyAvg * daysInMonth;
    
    list.push({
      type: 'info',
      icon: 'prediction',
      message: `Average daily spending is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dailyAvg)}.`,
      action: `Projected monthly total: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(projectedSpend)}.`
    });
    
    return list;
  }, [expenses, totalSpent]);

  // Analytics Metrics
  const topCategory = useMemo(() => {
    if (expenses.length === 0) return 'None';
    const totals: Record<string, number> = {};
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  }, [expenses]);

  const highestTx = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.max(...expenses.map(e => e.amount));
  }, [expenses]);

  const avgDaily = useMemo(() => {
    if (expenses.length === 0) return 0;
    const uniqueDates = new Set(expenses.map(e => e.date.toDateString()));
    return totalSpent / Math.max(1, uniqueDates.size);
  }, [expenses, totalSpent]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'advisor', label: 'AI Advisor', icon: Sparkles },
    { id: 'budgets', label: 'Budgets', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    expenses: 'Ledger Console',
    analytics: 'Visual Analytics',
    advisor: 'AI Assistant',
    budgets: 'Target Budget Controls',
    reports: 'Financial Statements',
    settings: 'Settings & Controls',
  };

  if (budgetLoading || expensesLoading) {
    return <Loading />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Top Budget Row */}
            <BudgetCard budget={budget} spent={totalSpent} expenses={expenses} userId={userId} />
            
            {/* Insights Row */}
            {expenses.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">Programmatic AI Insights</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {dashboardInsights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 transition-smooth hover:scale-[1.01] glass-card",
                        insight.type === 'warning' ? 'border-amber-500/10' :
                        insight.type === 'success' ? 'border-emerald-500/10' :
                        'border-primary/10'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-7 w-7 rounded-lg border flex items-center justify-center",
                          insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          'bg-primary/10 border-primary/20 text-primary'
                        )}>
                          {insight.icon === 'spike' ? <AlertTriangle className="h-4 w-4" /> :
                           insight.icon === 'savings' ? <Percent className="h-4 w-4" /> :
                           <TrendingUp className="h-4 w-4" />}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                          {insight.icon === 'spike' ? 'Spend Spike' :
                           insight.icon === 'savings' ? 'Savings target' :
                           'Burn Projection'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground leading-normal">{insight.message}</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">{insight.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Middle Section Charts */}
            <DashboardCharts expenses={expenses} onAddExpense={() => setIsAddOpen(true)} />
            
            {/* Bottom Transactions Summary */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">Ledger Summary</h4>
              <ExpenseTable 
                userId={userId} 
                expenses={expenses} 
                loading={expensesLoading} 
                isSummary={true}
                onViewAll={() => setActiveTab('expenses')}
              />
            </div>
          </div>
        );
      case 'expenses':
        return (
          <div className="h-full">
            <ExpenseTable 
              userId={userId} 
              expenses={expenses} 
              loading={expensesLoading} 
              isSummary={false}
            />
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Metric Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card border-border/40 p-4 flex items-center gap-4 hover:scale-[1.01] transition-smooth">
                <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <Percent className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Top Category</p>
                  <p className="text-base font-bold text-foreground font-headline truncate max-w-[150px]">{topCategory}</p>
                </div>
              </Card>
              <Card className="glass-card border-border/40 p-4 flex items-center gap-4 hover:scale-[1.01] transition-smooth">
                <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Highest Charge</p>
                  <p className="text-base font-bold text-foreground font-headline">{formatCurrency(highestTx)}</p>
                </div>
              </Card>
              <Card className="glass-card border-border/40 p-4 flex items-center gap-4 hover:scale-[1.01] transition-smooth">
                <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Daily Burn Rate</p>
                  <p className="text-base font-bold text-foreground font-headline">{formatCurrency(avgDaily)}</p>
                </div>
              </Card>
              <Card className="glass-card border-border/40 p-4 flex items-center gap-4 hover:scale-[1.01] transition-smooth">
                <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Accumulated Total</p>
                  <p className="text-base font-bold text-foreground font-headline">{formatCurrency(totalSpent)}</p>
                </div>
              </Card>
            </div>
            {/* Full Charts View */}
            <DashboardCharts expenses={expenses} onAddExpense={() => setIsAddOpen(true)} />
          </div>
        );
      case 'advisor':
        return (
          <div className="space-y-6">
            <AiChatAssistant expenses={expenses} monthlyBudget={budget.amount} />
            <AiCards expenses={expenses} budget={budget.amount} loading={expensesLoading} />
          </div>
        );
      case 'budgets':
        return (
          <div className="space-y-6">
            <BudgetCard budget={budget} spent={totalSpent} expenses={expenses} userId={userId} />
            <CategoryBudgets userId={userId} expenses={expenses} initialCategoryBudgets={budget.categoryBudgets} />
            <SavingsGoals userId={userId} />
          </div>
        );
      case 'reports':
        return (
          <Reports expenses={expenses} budget={budget} userId={userId} />
        );
      case 'settings':
        return (
          <SettingsView />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
      {/* Glow background orbs */}
      <div className="glowing-orb bg-primary w-[380px] h-[380px] -top-40 -left-40 animate-pulse-glow" />
      <div className="glowing-orb bg-accent w-[350px] h-[350px] top-[30%] -right-40 animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Fixed Left Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/30 min-h-screen fixed left-0 top-0 text-foreground z-40 p-4 justify-between no-print">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-3 border-b border-border/20">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm overflow-hidden p-1">
              <Image src="/logo.png" alt="Expensio Logo" width={28} height={28} className="object-contain rounded-lg" />
            </div>
            <span className="text-sm font-extrabold font-headline tracking-tight text-foreground bg-gradient-to-r from-white via-indigo-100 to-primary bg-clip-text text-transparent">
              Expensio Console
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold border border-transparent transition-smooth",
                    active 
                      ? "bg-primary/10 text-primary border-primary/10 font-bold" 
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-2 bg-muted/10 border border-white/5 rounded-xl space-y-1">
          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Local Session Status</p>
          <div className="flex items-center gap-1.5 text-[10px] text-foreground font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Agent Online</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Mobile Horizontal Navigation */}
        <div className="flex md:hidden overflow-x-auto gap-2 py-3 px-4 border-b border-border/20 bg-card/60 backdrop-blur-md sticky top-0 z-40 scrollbar-none no-print">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "text-[10px] h-8 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap border border-transparent transition-smooth",
                  active 
                    ? "bg-primary/10 text-primary border-primary/20 font-semibold" 
                    : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Top Header bar with dynamic title */}
        <div className="border-b border-border/10 bg-card/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-6 pb-4">
            <Header pageTitle={pageTitles[activeTab] || 'Expensio Dashboard'} />
            
            {/* Quick Actions top-right (active on Dashboard Home) */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-wrap items-center gap-2 sm:self-center self-start pl-2 sm:pl-0 no-print">
                <Button
                  onClick={() => setIsAddOpen(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs h-8 px-3.5"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  <span>Add Expense</span>
                </Button>
                <Button
                  onClick={() => setIsScanOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs h-8 px-3.5"
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  <span>Scan Receipt</span>
                </Button>
                <Button
                  onClick={() => setIsImportExportOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-border/60 hover:bg-muted/50 text-foreground rounded-lg text-xs h-8 px-3.5"
                >
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  <span>Import/Export</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('budgets')}
                  variant="outline"
                  size="sm"
                  className="border-border/60 hover:bg-muted/50 text-foreground rounded-lg text-xs h-8 px-3.5"
                >
                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                  <span>Set Budget</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Viewport Content Panel */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Add Expense Dialog */}
      <AddExpenseDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        userId={userId}
      />

      {/* AI Receipt Scanner Dialog */}
      <ReceiptScannerDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        userId={userId}
      />

      {/* Import / Export CSV Dialog */}
      <ImportExportDialog
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        expenses={expenses}
        userId={userId}
      />
    </div>
  );
}
