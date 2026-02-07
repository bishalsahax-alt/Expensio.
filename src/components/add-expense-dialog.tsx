'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { revalidateDashboard } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { expenseCategories, type Expense } from '@/lib/types';
import {
  useFirestore,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  category: z.enum(expenseCategories, {
    required_error: 'Please select a category.',
  }),
  description: z.string().min(1, 'Description is required.'),
});

type AddExpenseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  expense?: Expense | null;
};

export default function AddExpenseDialog({
  isOpen,
  onClose,
  userId,
  expense,
}: AddExpenseDialogProps) {
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      category: undefined,
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        form.reset({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
        });
      } else {
        form.reset({
          amount: '' as any, // Use empty string for uncontrolled to controlled fix
          category: undefined,
          description: '',
        });
      }
    }
  }, [expense, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !userId) {
      toast({
        title: 'Error',
        description: 'You must be signed in to add an expense.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (expense) {
        // Update existing expense
        const expenseRef = doc(
          firestore,
          'users',
          userId,
          'expenses',
          expense.id
        );
        // Note: 'date' is not updated here. We only update the form fields.
        updateDocumentNonBlocking(expenseRef, values);
        toast({
          title: 'Success!',
          description: 'Expense updated successfully.',
        });
      } else {
        // Add new expense
        const expenseData = {
          ...values,
          userId,
          date: Timestamp.now(),
        };
        const collectionRef = collection(firestore, 'users', userId, 'expenses');
        addDocumentNonBlocking(collectionRef, expenseData);
        toast({
          title: 'Success!',
          description: 'Expense added successfully.',
        });
      }
      revalidateDashboard();
      onClose();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={event =>
                        field.onChange(
                          event.target.value === ''
                            ? ''
                            : Number(event.target.value)
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : expense
                  ? 'Save Changes'
                  : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
