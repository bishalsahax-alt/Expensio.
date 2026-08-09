'use client';

import { useState, useEffect } from 'react';
import type {
  Expense,
  ExpenseCategory,
} from '@/lib/types';
import {
  runAnalyzeSpendingPatterns,
  runForecastSpendingTrends,
  runGetSavingsSuggestions,
  runPredictBudgetExceedance,
} from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { 
  Wand2, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  ArrowUpRight, 
  ShieldCheck,
  Percent,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';
import type { AnalyzeSpendingPatternsOutput } from '@/ai/flows/analyze-spending-patterns';
import type { ForecastSpendingTrendsOutput } from '@/ai/flows/forecast-spending-trends';
import type { GetSavingsSuggestionsOutput } from '@/ai/flows/get-savings-suggestions';
import type { PredictBudgetExceedanceOutput } from '@/ai/flows/predict-budget-exceedance';

type AiCardsProps = {
  expenses: Expense[];
  budget: number;
  loading: boolean;
};

// Custom interactive loader cycling through state messages
function AiLoader() {
  const [currentMsg, setCurrentMsg] = useState("Initializing AI core...");
  
  useEffect(() => {
    const messages = [
      "Parsing transaction histories...",
      "Clustering spending categories...",
      "Running regression and forecasting algorithms...",
      "Formulating customized savings strategies...",
      "Formatting advice dashboard..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setCurrentMsg(messages[idx]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-10 border border-white/5 rounded-2xl bg-white/[0.01] animate-pulse">
      <div className="relative flex h-14 w-14 items-center justify-center mb-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
        <div className="relative rounded-full bg-primary/10 border border-primary/20 p-3 shadow-inner">
          <Sparkles className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>
      <p className="text-xs font-bold text-foreground tracking-wide font-headline text-center">
        {currentMsg}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">Usually resolves in a few seconds</p>
    </div>
  );
}

export default function AiCards({ expenses, budget, loading }: AiCardsProps) {
  return (
    <Card className="glass-card border-border/40 shadow-xl flex flex-col h-full">
      <CardHeader className="pb-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 font-headline text-lg font-bold tracking-tight text-foreground md:text-xl">
              <Wand2 className="h-5 w-5 text-primary animate-pulse" />
              <span>AI Advisor Hub</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Get predictive intelligence and optimization insights.
            </CardDescription>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            LLM Core v1
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-5 flex-grow">
        <Tabs defaultValue="prediction" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/20 border border-border/40 rounded-xl p-1">
            <TabsTrigger value="prediction" className="text-xs rounded-lg py-1.5">Predict</TabsTrigger>
            <TabsTrigger value="savings" className="text-xs rounded-lg py-1.5">Savings</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs rounded-lg py-1.5">Patterns</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs rounded-lg py-1.5">Trends</TabsTrigger>
          </TabsList>
          
          <div className="pt-5">
            <TabsContent value="prediction">
              <BudgetPredictionTab expenses={expenses} budget={budget} />
            </TabsContent>
            <TabsContent value="savings">
              <SavingsSuggestionsTab expenses={expenses} />
            </TabsContent>
            <TabsContent value="patterns">
              <SpendingPatternsTab expenses={expenses} />
            </TabsContent>
            <TabsContent value="trends">
              <TrendForecastTab expenses={expenses} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BudgetPredictionTab({
  expenses,
  budget,
}: Omit<AiCardsProps, 'loading'>) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictBudgetExceedanceOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (budget <= 0 || expenses.length === 0) {
      alert('Please set a budget and add some expenses first.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const today = new Date();
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      const dailySpending = Array(daysInMonth).fill(0);
      expenses.forEach(exp => {
        const expenseDate = new Date(exp.date);
        if (
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getFullYear() === today.getFullYear()
        ) {
          dailySpending[expenseDate.getDate() - 1] += exp.amount;
        }
      });

      const res = await runPredictBudgetExceedance(
        budget,
        dailySpending.slice(0, today.getDate())
      );
      setResult(res);
    } catch (e: any) {
      setError(
        'The AI model is currently unavailable. Please try again later.'
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const isExceeded = result && result.exceedanceAmount > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Calculates daily spending trajectory and runs projection regressions to predict if and when you will run out of funds.
      </p>
      
      {!loading && !result && (
        <Button 
          onClick={handleAnalysis} 
          className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs h-9 rounded-lg"
        >
          <Target className="mr-2 h-4 w-4" />
          Run Predictive Projection
        </Button>
      )}

      {loading && <AiLoader />}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Projection Fault</p>
            <p className="mt-1 leading-normal text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-accordion-down">
          {/* Status highlight */}
          <div className={cn(
            "rounded-xl border p-4 text-xs flex items-start gap-3",
            isExceeded 
              ? "bg-red-500/5 border-red-500/10 text-red-400" 
              : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-lg border flex items-center justify-center flex-shrink-0",
              isExceeded 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}>
              {isExceeded ? <AlertTriangle className="h-4 w-4 animate-bounce" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="space-y-0.5">
              <p className="font-bold font-headline text-foreground">
                {isExceeded ? 'Exceedance Warned' : 'Budget Stable'}
              </p>
              <p className="leading-normal text-muted-foreground">
                {isExceeded ? (
                  <span>
                    Predicted to exceed limit on <strong className="text-red-400 font-semibold">{result.exceedanceDate}</strong> by roughly <strong className="text-red-400 font-semibold">{formatCurrency(result.exceedanceAmount)}</strong>.
                  </span>
                ) : (
                  <span>Trajectory forecasts that your budget will remain stable throughout the cycle.</span>
                )}
              </p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
            <h4 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Reasoning Report
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {result.analysis}
            </p>
          </div>

          <Button 
            onClick={handleAnalysis} 
            variant="outline" 
            className="w-full h-8 text-xs border border-border/60 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            Re-run Projection
          </Button>
        </div>
      )}
    </div>
  );
}

function SavingsSuggestionsTab({ expenses }: { expenses: Expense[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GetSavingsSuggestionsOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (expenses.length === 0) {
      alert('Please add some expenses first.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const spendingData = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);
      const res = await runGetSavingsSuggestions(spendingData);
      setResult(res);
    } catch (e: any) {
      setError(
        'The AI model is currently unavailable. Please try again later.'
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Compares spending volume across components to identify savings leaks and suggest immediate micro-target savings.
      </p>

      {!loading && !result && (
        <Button 
          onClick={handleAnalysis} 
          className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs h-9 rounded-lg"
        >
          <Percent className="mr-2 h-4 w-4" />
          Obtain Savings Recommendations
        </Button>
      )}

      {loading && <AiLoader />}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Advisor Fault</p>
            <p className="mt-1 leading-normal text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-accordion-down">
          {/* Savings Summary Banner */}
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex flex-col items-center text-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Target Category: {result.highestSpendingCategory}
              </p>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent font-headline mt-1">
                {formatCurrency(result.potentialSavings)} Potential Saving
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-normal">
                Reduce monthly spending in <strong className="text-foreground">{result.highestSpendingCategory}</strong> by just 10% to achieve this goal.
              </p>
            </div>
          </div>

          {/* Savings suggestion reasoning */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
            <h4 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-accent" />
              Strategic Savings Suggestion
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {result.suggestion}
            </p>
          </div>

          <Button 
            onClick={handleAnalysis} 
            variant="outline" 
            className="w-full h-8 text-xs border border-border/60 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            Re-calculate Targets
          </Button>
        </div>
      )}
    </div>
  );
}

function SpendingPatternsTab({ expenses }: { expenses: Expense[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeSpendingPatternsOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (expenses.length === 0) {
      alert('Please add some expenses first.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await runAnalyzeSpendingPatterns(expenses);
      setResult(res);
    } catch (e: any) {
      setError(
        'The AI model is currently unavailable. Please try again later.'
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Conducts clustering and recurring behavior checks across all cataloged purchases to isolate spending triggers.
      </p>

      {!loading && !result && (
        <Button 
          onClick={handleAnalysis} 
          className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs h-9 rounded-lg"
        >
          <Bookmark className="mr-2 h-4 w-4" />
          Extract Spending Patterns
        </Button>
      )}

      {loading && <AiLoader />}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Analysis Fault</p>
            <p className="mt-1 leading-normal text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-accordion-down">
          {/* Analysis Cards */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
            <h4 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Pattern Analysis Results
            </h4>
            
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line p-3 rounded-lg border border-white/5 bg-white/[0.01]">
              {result.analysis}
            </div>
          </div>

          <Button 
            onClick={handleAnalysis} 
            variant="outline" 
            className="w-full h-8 text-xs border border-border/60 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            Refresh Patterns
          </Button>
        </div>
      )}
    </div>
  );
}

function TrendForecastTab({ expenses }: { expenses: Expense[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastSpendingTrendsOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const handleAnalysis = async () => {
    if (expenses.length === 0) {
      alert('Please add some expenses first.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await runForecastSpendingTrends(expenses, period);
      setResult(res);
    } catch (e: any) {
      setError(
        'The AI model is currently unavailable. Please try again later.'
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Analyzes macro trajectories over custom intervals (week, month, quarter) to forecast your net monthly burn rate.
      </p>
      
      <div className="flex gap-2">
        <Select
          onValueChange={(v: 'week' | 'month' | 'quarter') => setPeriod(v)}
          defaultValue={period}
        >
          <SelectTrigger className="w-[130px] h-9 border-border/60 bg-muted/20 focus:ring-primary/40 rounded-lg text-xs">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/40">
            <SelectItem value="week" className="text-xs">This Week</SelectItem>
            <SelectItem value="month" className="text-xs">This Month</SelectItem>
            <SelectItem value="quarter" className="text-xs">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleAnalysis} 
          disabled={loading}
          className="flex-grow bg-primary hover:bg-primary/95 text-white font-medium text-xs h-9 rounded-lg"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Forecast Trends
        </Button>
      </div>

      {loading && <AiLoader />}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Forecast Fault</p>
            <p className="mt-1 leading-normal text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-accordion-down">
          {/* Trend Sections */}
          <div className="space-y-3">
            {/* Section 1: Analysis */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
              <h5 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                Trend Analysis
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.trendAnalysis}
              </p>
            </div>

            {/* Section 2: Forecast */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
              <h5 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-accent" />
                Burn Rate Projection
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.forecast}
              </p>
            </div>

            {/* Section 3: Recommendations */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
              <h5 className="text-xs font-semibold text-foreground font-headline flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                Advisor Recommendations
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.recommendations}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleAnalysis} 
            variant="outline" 
            className="w-full h-8 text-xs border border-border/60 rounded-lg hover:bg-muted/50 transition-smooth"
          >
            Re-run Forecast
          </Button>
        </div>
      )}
    </div>
  );
}
