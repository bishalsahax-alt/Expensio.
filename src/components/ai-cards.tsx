
'use client';
import { useState } from 'react';
import type {
  Expense,
  ExpenseCategory,
  expenseCategories,
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
import { Wand2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { AnalyzeSpendingPatternsOutput } from '@/ai/flows/analyze-spending-patterns';
import type { ForecastSpendingTrendsOutput } from '@/ai/flows/forecast-spending-trends';
import type { GetSavingsSuggestionsOutput } from '@/ai/flows/get-savings-suggestions';
import type { PredictBudgetExceedanceOutput } from '@/ai/flows/predict-budget-exceedance';

type AiCardsProps = {
  expenses: Expense[];
  budget: number;
  loading: boolean;
};

export default function AiCards({ expenses, budget, loading }: AiCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <span>AI Financial Assistant</span>
        </CardTitle>
        <CardDescription>
          Get smart insights and predictions about your spending habits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prediction">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="prediction">Prediction</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          <div className="pt-4">
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Calculates your average daily spend to predict if and when you'll
        exceed your monthly budget.
      </p>
      <Button onClick={handleAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Predict Budget Exceedance'}
      </Button>
      {loading && <Skeleton className="h-32 w-full" />}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert>
          <AlertTitle>Budget Prediction Analysis</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Based on your current spending, you are predicted to exceed your
              budget on{' '}
              <strong className="text-primary">{result.exceedanceDate}</strong>{' '}
              by approximately{' '}
              <strong className="text-primary">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(result.exceedanceAmount)}
              </strong>
              .
            </p>
            <p>{result.analysis}</p>
          </AlertDescription>
        </Alert>
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Identifies your highest spending category and suggests how to save.
      </p>
      <Button onClick={handleAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get Savings Suggestions'}
      </Button>
      {loading && <Skeleton className="h-32 w-full" />}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert>
          <AlertTitle>Personalized Savings Suggestion</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Your highest spending category is{' '}
              <strong className="text-primary">
                {result.highestSpendingCategory}
              </strong>
              . By reducing spending here by 10%, you could save{' '}
              <strong className="text-primary">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(result.potentialSavings)}
              </strong>
              .
            </p>
            <p>{result.suggestion}</p>
          </AlertDescription>
        </Alert>
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
      <p className="text-sm text-muted-foreground">
        Provides a detailed analysis of your spending patterns to identify key
        spending areas.
      </p>
      <Button onClick={handleAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Spending Patterns'}
      </Button>
      {loading && <Skeleton className="h-32 w-full" />}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert>
          <AlertTitle>Spending Pattern Analysis</AlertTitle>
          <AlertDescription>
            <p>{result.analysis}</p>
          </AlertDescription>
        </Alert>
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
      <p className="text-sm text-muted-foreground">
        Compare expenses over recent periods to forecast future spending trends.
      </p>
      <div className="flex gap-2">
        <Select
          onValueChange={(v: 'week' | 'month' | 'quarter') => setPeriod(v)}
          defaultValue={period}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : 'Forecast Trends'}
        </Button>
      </div>
      {loading && <Skeleton className="h-48 w-full" />}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <Alert>
          <AlertTitle>Spending Trend Forecast</AlertTitle>
          <AlertDescription>
            <h4 className="font-semibold mt-2">Trend Analysis</h4>
            <p>{result.trendAnalysis}</p>
            <h4 className="font-semibold mt-2">Forecast</h4>
            <p>{result.forecast}</p>
            <h4 className="font-semibold mt-2">Recommendations</h4>
            <p>{result.recommendations}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
