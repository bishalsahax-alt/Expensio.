'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Sparkles, Upload, CheckCircle2, Loader2, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { runScanReceipt } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import type { ExpenseCategory } from '@/lib/types';

type ReceiptScannerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onExpenseAdded?: () => void;
};

export default function ReceiptScannerDialog({
  isOpen,
  onClose,
  userId,
  onExpenseAdded,
}: ReceiptScannerDialogProps) {
  const firestore = useFirestore();
  const [receiptInput, setReceiptInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [parsedData, setParsedData] = useState<{
    merchantName: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    description: string;
  } | null>(null);

  const handleScan = async () => {
    if (!receiptInput.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please paste receipt details or raw OCR text to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    try {
      const res = await runScanReceipt(receiptInput);
      setParsedData(res as any);
      toast({
        title: 'Receipt Scanned Successfully',
        description: `Extracted ${res.merchantName} - $${res.amount}`,
      });
    } catch (err: any) {
      toast({
        title: 'Scan Failed',
        description: err.message || 'Could not parse receipt text.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedData || !firestore || !userId) return;

    try {
      const expensesColRef = collection(firestore, 'users', userId, 'expenses');
      await addDocumentNonBlocking(expensesColRef, {
        amount: parsedData.amount,
        category: parsedData.category,
        description: `${parsedData.merchantName} - ${parsedData.description}`,
        date: Timestamp.fromDate(new Date(parsedData.date || Date.now())),
        paymentMethod: 'Credit Card',
        tag: '#scanned-receipt',
      });

      toast({
        title: 'Expense Added',
        description: `Successfully logged $${parsedData.amount} under ${parsedData.category}.`,
      });

      setParsedData(null);
      setReceiptInput('');
      if (onExpenseAdded) onExpenseAdded();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save expense.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-card border-border/40">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-headline">AI Receipt Scanner</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste receipt details or raw store notes for instant AI itemization.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Receipt / Store Note Dump</label>
              <Textarea
                placeholder="Example: Walmart 2026-08-09. Apples $4.99, Milk $3.50, Bread $2.99. Total: $11.48"
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value)}
                className="h-32 text-xs bg-card/50 border-border/40 focus:border-primary/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleScan}
                disabled={isScanning || !receiptInput.trim()}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs gap-1.5"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Scanning with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Parse Receipt</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Structured AI Extraction
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ${parsedData.amount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Merchant</p>
                  <p className="font-semibold text-foreground">{parsedData.merchantName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Category</p>
                  <p className="font-semibold text-primary">{parsedData.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Date</p>
                  <p className="font-semibold text-foreground">{parsedData.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tag</p>
                  <p className="font-semibold text-indigo-400">#scanned-receipt</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Itemization</p>
                <p className="text-xs text-muted-foreground leading-normal">{parsedData.description}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParsedData(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Scan Another
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Discard
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save to Ledger
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
