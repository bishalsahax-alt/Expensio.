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
import { DollarSign } from 'lucide-react';
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
import { expenseCategories, paymentMethods, recurringFrequencies, type Expense } from '@/lib/types';
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
  paymentMethod: z.enum(paymentMethods).optional(),
  tag: z.string().optional(),
  recurring: z.enum(recurringFrequencies).optional(),
});

type AddExpenseDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  expense?: Expense | null;
};

import { useCurrency } from '@/context/currency-context';

export default function AddExpenseDialog({
  isOpen,
  onClose,
  userId,
  expense,
}: AddExpenseDialogProps) {
  const { currency } = useCurrency();
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      category: undefined,
      description: '',
      paymentMethod: 'Credit Card',
      tag: '',
      recurring: 'none',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        form.reset({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          paymentMethod: expense.paymentMethod || 'Credit Card',
          tag: expense.tag || '',
          recurring: expense.recurring || 'none',
        });
      } else {
        form.reset({
          amount: '' as any,
          category: undefined,
          description: '',
          paymentMethod: 'Credit Card',
          tag: '',
          recurring: 'none',
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
      <DialogContent className="sm:max-w-[425px] bg-card border-border/40 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold text-foreground">
            {expense ? 'Edit Transaction Details' : 'Record New Expense'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">Amount ({currency.code} {currency.symbol})</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9 bg-muted/20 border-border/60 focus-visible:ring-primary/40 rounded-lg text-sm h-9"
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
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-muted/20 border-border/60 focus:ring-primary/40 rounded-lg text-sm h-9 text-foreground">
                        <SelectValue placeholder="Select transaction category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border/40 max-h-[200px]">
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs cursor-pointer">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px] text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Weekly grocery stock or electricity bill"
                      className="bg-muted/20 border-border/60 focus-visible:ring-primary/40 rounded-lg text-sm h-9"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] text-destructive" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/20 border-border/60 focus:ring-primary/40 rounded-lg text-xs h-9 text-foreground">
                          <SelectValue placeholder="Payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border/40">
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm} value={pm} className="text-xs cursor-pointer">
                            {pm}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold text-muted-foreground">Tag (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#work, #travel"
                        className="bg-muted/20 border-border/60 focus-visible:ring-primary/40 rounded-lg text-xs h-9"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
                className="border-border/60 hover:bg-muted/50 rounded-lg text-xs h-9"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="bg-primary hover:bg-primary/95 text-white rounded-lg text-xs h-9 px-5"
              >
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : expense
                  ? 'Save Changes'
                  : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
