'use client';

import { useState } from 'react';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { useCurrency } from '@/context/currency-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Search, 
  SlidersHorizontal,
  Calendar,
  Inbox,
  Edit2,
  Trash2,
  ArrowUpRight
} from 'lucide-react';
import AddExpenseDialog from '@/components/add-expense-dialog';
import DeleteExpenseAlert from '@/components/delete-expense-alert';
import { CategoryIcon } from './icons';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { expenseCategories } from '@/lib/types';

const categoryColors: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
  Groceries: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Dining Out': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Transport: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Housing: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  Utilities: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Health: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  Entertainment: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  Shopping: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  Other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

type ExpenseTableProps = {
  expenses: Expense[];
  loading: boolean;
  userId: string;
  isSummary?: boolean;
  onViewAll?: () => void;
};

export default function ExpenseTable({
  expenses,
  loading,
  userId,
  isSummary = false,
  onViewAll,
}: ExpenseTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<ExpenseCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsAddOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleAddDialogClose = () => {
    setIsAddOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteAlertClose = () => {
    setIsDeleteOpen(false);
    setSelectedExpense(null);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedExpenses = isSummary ? filteredExpenses.slice(0, 5) : filteredExpenses;

  const { formatCurrency } = useCurrency();

  return (
    <Card className="glass-card border-border/40 shadow-xl flex flex-col h-full">
      <CardHeader className="pb-4 border-b border-border/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="font-headline text-lg font-bold tracking-tight text-foreground md:text-xl">
              {isSummary ? 'Recent Ledger Entries' : 'Expenses Registry'}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isSummary 
                ? 'Your 5 latest transactions recorded in this cycle.' 
                : 'Review, search, and edit your recorded expenses.'}
            </p>
          </div>
          
          {!isSummary && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-full sm:w-[180px] border-border/60 bg-muted/20 focus-visible:ring-primary/40 rounded-lg text-xs"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onValueChange={(value: ExpenseCategory | 'all') =>
                  setCategoryFilter(value)
                }
              >
                <SelectTrigger className="w-[140px] h-9 border-border/60 bg-muted/20 focus:ring-primary/40 rounded-lg text-xs">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/40">
                  <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Button */}
              <Button
                size="sm"
                onClick={() => setIsAddOpen(true)}
                className="h-9 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-medium"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/20 bg-muted/10 hover:bg-muted/10">
              <TableHead className="font-semibold text-xs py-3 w-[130px] pl-6">Category</TableHead>
              <TableHead className="font-semibold text-xs py-3">Description</TableHead>
              <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
              <TableHead className="font-semibold text-xs py-3 text-right pr-6 w-[110px]">Date</TableHead>
              <TableHead className="w-[50px] pr-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/20">
                  <TableCell className="pl-6 py-4">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[160px] rounded" />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <Skeleton className="h-4 w-20 ml-auto rounded" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : displayedExpenses.length > 0 ? (
              displayedExpenses.map(expense => {
                const colorScheme = categoryColors[expense.category] || {
                  bg: 'bg-muted/10',
                  text: 'text-muted-foreground',
                  border: 'border-border/20'
                };
                
                return (
                  <TableRow 
                    key={expense.id}
                    className="border-b border-border/20 hover:bg-muted/20 transition-smooth group/row"
                  >
                    <TableCell className="py-3.5 pl-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                        colorScheme.bg,
                        colorScheme.text,
                        colorScheme.border
                      )}>
                        <CategoryIcon
                          category={expense.category}
                          className="h-3 w-3"
                        />
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-xs text-foreground">{expense.description}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {expense.paymentMethod && (
                            <span className="text-[9px] bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                              {expense.paymentMethod}
                            </span>
                          )}
                          {expense.tag && (
                            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                              {expense.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-headline text-xs font-bold text-foreground py-3.5">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-medium py-3.5 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
                        <span>{expense.date.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-7 w-7 p-0 rounded-lg hover:bg-muted/50 transition-smooth opacity-60 group-hover/row:opacity-100"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border/40">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(expense)}
                            className="text-xs flex items-center py-2 cursor-pointer"
                          >
                            <Edit2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(expense)}
                            className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center py-2 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                      <Inbox className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1.5 max-w-xs mx-auto">
                      <p className="text-sm font-semibold text-foreground">No Ledger Entries Yet</p>
                      <p className="text-xs text-muted-foreground leading-normal">
                        {expenses.length === 0
                          ? 'Start tracking your spending patterns by adding your very first transaction.'
                          : `There are no transactions matching "${searchTerm}" or filtered categories.`}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsAddOpen(true)}
                      className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs h-8 px-3 mt-2"
                    >
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                      Add Expense
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {isSummary && expenses.length > 5 && (
        <div className="p-3 border-t border-border/20 text-center">
          <Button 
            variant="ghost" 
            onClick={onViewAll}
            className="text-xs text-primary hover:text-primary/95 hover:bg-primary/5 flex items-center justify-center gap-1.5 mx-auto font-semibold"
          >
            <span>View all transactions</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <AddExpenseDialog
        isOpen={isAddOpen}
        onClose={handleAddDialogClose}
        expense={selectedExpense}
        userId={userId}
      />
      {selectedExpense && (
        <DeleteExpenseAlert
          isOpen={isDeleteOpen}
          onClose={handleDeleteAlertClose}
          expenseId={selectedExpense.id}
          userId={userId}
        />
      )}
    </Card>
  );
}
