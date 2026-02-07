'use client';

import { useState } from 'react';
import type { Expense, ExpenseCategory } from '@/lib/types';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import AddExpenseDialog from '@/components/add-expense-dialog';
import DeleteExpenseAlert from '@/components/delete-expense-alert';
import { CategoryIcon } from './icons';
import { Skeleton } from './ui/skeleton';
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

export default function ExpenseTable({
  expenses,
  loading,
  userId,
}: {
  expenses: Expense[];
  loading: boolean;
  userId: string;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<ExpenseCategory | 'all'>('all');

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
    if (categoryFilter === 'all') return true;
    return expense.category === categoryFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Recent Expenses</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(value: ExpenseCategory | 'all') =>
                setCategoryFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="whitespace-nowrap"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredExpenses.length > 0 ? (
              filteredExpenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        category={expense.category}
                        className="h-4 w-4 text-muted-foreground"
                      />
                      <span className="hidden md:inline">
                        {expense.category}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.date.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(expense)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(expense)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {expenses.length === 0
                    ? 'No expenses found. Add one to get started!'
                    : `No expenses in the "${categoryFilter}" category.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

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
