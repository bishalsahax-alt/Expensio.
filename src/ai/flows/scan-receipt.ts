'use server';

/**
 * @fileOverview Parses receipt images or text details to extract structured transaction info.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScanReceiptInputSchema = z.object({
  receiptText: z.string().describe('Raw receipt OCR text or image description.'),
});

export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  merchantName: z.string().describe('Name of the store, restaurant, or vendor.'),
  amount: z.number().describe('Total charged amount.'),
  category: z.enum([
    'Groceries',
    'Dining Out',
    'Transport',
    'Housing',
    'Utilities',
    'Health',
    'Entertainment',
    'Shopping',
    'Other'
  ]).describe('Most appropriate expense category.'),
  date: z.string().describe('Extracted transaction date (YYYY-MM-DD) or current date if unreadable.'),
  description: z.string().describe('Short description of purchased items or receipt overview.'),
});

export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: { schema: ScanReceiptInputSchema },
  output: { schema: ScanReceiptOutputSchema },
  prompt: `You are an expert AI financial receipt scanner. Extract structured expense details from the following receipt text or OCR dump:

Receipt details:
{{{receiptText}}}

Return merchantName, total amount as a clean number, category (must match one of: Groceries, Dining Out, Transport, Housing, Utilities, Health, Entertainment, Shopping, Other), ISO date string (YYYY-MM-DD), and a concise description of items.`,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
