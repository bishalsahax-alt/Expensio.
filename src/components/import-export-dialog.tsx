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
import { Download, Upload, FileSpreadsheet, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';

type ImportExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  userId: string;
  onImportComplete?: () => void;
};

export default function ImportExportDialog({
  isOpen,
  onClose,
  expenses,
  userId,
  onImportComplete,
}: ImportExportDialogProps) {
  const firestore = useFirestore();
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Export Expenses as CSV File
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast({
        title: 'No Expenses',
        description: 'There are no expenses in your ledger to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Category', 'Description', 'Amount', 'PaymentMethod', 'Tag'];
    const csvRows = [
      headers.join(','),
      ...expenses.map((e) =>
        [
          e.date.toISOString().split('T')[0],
          `"${e.category}"`,
          `"${e.description.replace(/"/g, '""')}"`,
          e.amount,
          `"${e.paymentMethod || 'Credit Card'}"`,
          `"${e.tag || ''}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Expensio_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'CSV Export Downloaded',
      description: `Exported ${expenses.length} records to CSV file.`,
    });
  };

  // Bulk CSV Import logic
  const handleImportCSV = async () => {
    if (!csvText.trim() || !firestore || !userId) return;

    setIsImporting(true);
    try {
      const lines = csvText.trim().split('\n');
      let count = 0;
      const expensesColRef = collection(firestore, 'users', userId, 'expenses');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith('date')) continue; // skip header

        const parts = line.split(',');
        if (parts.length >= 3) {
          const dateStr = parts[0].trim().replace(/^"|"$/g, '');
          const category = parts[1].trim().replace(/^"|"$/g, '') as ExpenseCategory;
          const description = parts[2].trim().replace(/^"|"$/g, '');
          const amount = parseFloat(parts[3] || '0');

          if (!isNaN(amount) && amount > 0) {
            await addDocumentNonBlocking(expensesColRef, {
              amount,
              category: category || 'Other',
              description: description || 'Imported Expense',
              date: Timestamp.fromDate(new Date(dateStr || Date.now())),
              paymentMethod: 'Credit Card',
              tag: '#imported',
            });
            count++;
          }
        }
      }

      toast({
        title: 'CSV Import Completed',
        description: `Successfully imported ${count} expenses into your ledger.`,
      });

      setCsvText('');
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Error processing CSV rows.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/40 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-headline">Import & Export Ledger</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Export statements or import bank transaction records in CSV format.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Export Section */}
        <div className="p-4 rounded-2xl border border-border/30 bg-card/30 space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            Export Expense Ledger
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Download your full transaction history as a formatted CSV file compatible with Excel, Google Sheets, and accounting software.
          </p>
          <Button
            onClick={handleExportCSV}
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV Statement ({expenses.length} records)</span>
          </Button>
        </div>

        {/* Bulk CSV Import Section */}
        <div className="p-4 rounded-2xl border border-border/30 bg-card/30 space-y-3">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-primary" />
            Bulk CSV Import
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Paste raw CSV content (Format: Date, Category, Description, Amount)
          </p>
          <Textarea
            placeholder="2026-08-01, Groceries, Supermarket, 45.50&#10;2026-08-02, Dining Out, Pizza Restaurant, 24.00"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="h-24 text-xs font-mono bg-background/50"
          />
          <Button
            onClick={handleImportCSV}
            disabled={isImporting || !csvText.trim()}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8 gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Expenses to Ledger</span>
          </Button>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
