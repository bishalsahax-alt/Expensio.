'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Key, 
  ShieldAlert, 
  HelpCircle,
  Laptop
} from 'lucide-react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
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

import AuthDialog from '@/components/auth-dialog';
import { CurrencySelect } from '@/components/currency-select';

export default function SettingsView() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleResetData = async () => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to reset data.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      // 1. Reset budget to 0
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, { monthlyBudget: 0 }, { merge: true });

      // 2. Delete all expenses
      const expensesColRef = collection(firestore, 'users', user.uid, 'expenses');
      const snapshot = await getDocs(expensesColRef);
      
      if (snapshot.size > 0) {
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(docVal => {
          batch.delete(docVal.ref);
        });
        await batch.commit();
      }

      toast({
        title: 'Success!',
        description: 'Monthly budget has been reset to $0.00 and all expenses cleared.',
      });
      
      await revalidateDashboard();
      setIsResetOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset data.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold font-headline text-foreground">Account Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your credentials, preferences, and database records.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Stats */}
        <Card className="glass-card border-border/40 shadow-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="flex items-center gap-2 font-headline text-base font-bold text-foreground">
              <UserIcon className="h-4.5 w-4.5 text-primary" />
              <span>Identity Profile</span>
            </CardTitle>
            <CardDescription className="text-[11px]">Your authenticated login session credentials.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Session Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Account Class</span>
              <span className="text-foreground font-semibold">
                {user?.isAnonymous ? 'Temporary Anonymous' : 'Registered Member'}
              </span>
            </div>
            <div className="space-y-1.5 py-1">
              <span className="text-muted-foreground font-medium block">Unique Token ID (UID)</span>
              <code className="bg-muted/40 p-2 rounded text-[10px] block font-mono text-foreground border border-white/5 break-all">
                {user?.uid || 'Not available'}
              </code>
            </div>
            <Button
              onClick={() => setIsAuthOpen(true)}
              variant="outline"
              size="sm"
              className="w-full text-xs h-8.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              {user?.isAnonymous ? 'Sign In / Upgrade Account' : 'Switch Account'}
            </Button>
          </CardContent>
        </Card>

        <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        {/* Preferences */}
        <Card className="glass-card border-border/40 shadow-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="flex items-center gap-2 font-headline text-base font-bold text-foreground">
              <SettingsIcon className="h-4.5 w-4.5 text-primary" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription className="text-[11px]">System styling and layout toggles.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Theme Interface</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <Laptop className="h-3.5 w-3.5 text-primary" />
                <span>Midnight Dark</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-muted-foreground font-medium">Primary Currency</span>
              <CurrencySelect />
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground font-medium">Analytical Intervals</span>
              <span className="text-foreground font-semibold">Daily Grouped</span>
            </div>
          </CardContent>
        </Card>

        {/* Reset Zone */}
        <Card className="glass-card border-red-500/10 hover:border-red-500/20 shadow-xl md:col-span-2">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="flex items-center gap-2 font-headline text-base font-bold text-red-400">
              <ShieldAlert className="h-4.5 w-4.5" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">Actions here are permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h4 className="text-xs font-bold text-foreground font-headline">Re-initialize Ledger Database</h4>
              <p className="text-xs text-muted-foreground leading-normal">
                This clears all recorded debit transactions and sets your monthly target limits to zero. This is useful when beginning a new tracking cycle.
              </p>
            </div>
            <Button
              onClick={() => setIsResetOpen(true)}
              className="bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs h-9 px-4 flex-shrink-0"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset Account Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent className="bg-card border-border/40 rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-lg font-bold text-foreground">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-normal">
              This action cannot be undone. It will permanently clear all recorded expenses from your transaction history and set your monthly budget target back to $0.00.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isResetting} className="border-border/60 hover:bg-muted/50 rounded-lg text-xs h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetData();
              }}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs h-9 px-5"
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
