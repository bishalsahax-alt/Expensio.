'use server';

/**
 * @fileOverview Interactive conversational AI financial assistant flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialAdvisorChatInputSchema = z.object({
  userQuery: z.string().describe('The user question or request.'),
  expenseContext: z.string().describe('JSON summary of recent expenses, totals, categories, and monthly budget.'),
});

export type FinancialAdvisorChatInput = z.infer<typeof FinancialAdvisorChatInputSchema>;

const FinancialAdvisorChatOutputSchema = z.object({
  reply: z.string().describe('Helpful, friendly, and actionable financial advice or answer.'),
  suggestedAction: z.string().optional().describe('Short optional action recommendation.'),
});

export type FinancialAdvisorChatOutput = z.infer<typeof FinancialAdvisorChatOutputSchema>;

export async function financialAdvisorChat(input: FinancialAdvisorChatInput): Promise<FinancialAdvisorChatOutput> {
  return financialAdvisorChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAdvisorChatPrompt',
  input: { schema: FinancialAdvisorChatInputSchema },
  output: { schema: FinancialAdvisorChatOutputSchema },
  prompt: `You are Expensio AI, an intelligent, empathetic, and highly practical personal financial coach.

Context about user's financial state:
{{{expenseContext}}}

User question:
{{{userQuery}}}

Provide a clear, engaging, concise reply with actionable insights. If appropriate, include a suggestedAction (e.g., "Set a $200 Dining limit" or "Review recurring subscriptions").`,
});

const financialAdvisorChatFlow = ai.defineFlow(
  {
    name: 'financialAdvisorChatFlow',
    inputSchema: FinancialAdvisorChatInputSchema,
    outputSchema: FinancialAdvisorChatOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
