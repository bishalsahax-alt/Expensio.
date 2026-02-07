'use client';

import { toast } from '@/hooks/use-toast';
import { revalidateDashboard } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type DeleteExpenseAlertProps = {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  userId: string;
};

export default function DeleteExpenseAlert({
  isOpen,
  onClose,
  expenseId,
  userId,
}: DeleteExpenseAlertProps) {
  const firestore = useFirestore();

  const handleDelete = async () => {
    if (!firestore || !userId) {
      toast({
        title: 'Error',
        description: 'You must be signed in to delete an expense.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const expenseRef = doc(firestore, 'users', userId, 'expenses', expenseId);
      deleteDocumentNonBlocking(expenseRef);
      toast({
        title: 'Success',
        description: 'Expense deleted successfully.',
      });
      revalidateDashboard();
      onClose();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete expense.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            expense from your records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
