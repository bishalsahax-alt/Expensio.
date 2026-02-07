'use server';

/**
 * @fileOverview Provides spending pattern analysis to identify key spending areas.
 *
 * - analyzeSpendingPatterns - Analyzes spending patterns to identify key spending areas.
 * - AnalyzeSpendingPatternsInput - The input type for the analyzeSpendingPatterns function.
 * - AnalyzeSpendingPatternsOutput - The return type for the analyzeSpendingPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSpendingPatternsInputSchema = z.object({
  expenses: z
    .string()
    .describe(
      'A JSON string containing an array of expenses. Each expense should have a category and amount field.'
    ),
});
export type AnalyzeSpendingPatternsInput = z.infer<
  typeof AnalyzeSpendingPatternsInputSchema
>;

const AnalyzeSpendingPatternsOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A detailed analysis of the users spending patterns, identifying key spending areas and providing insights to encourage balanced spending.'
    ),
});
export type AnalyzeSpendingPatternsOutput = z.infer<
  typeof AnalyzeSpendingPatternsOutputSchema
>;

export async function analyzeSpendingPatterns(
  input: AnalyzeSpendingPatternsInput
): Promise<AnalyzeSpendingPatternsOutput> {
  return analyzeSpendingPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpendingPatternsPrompt',
  input: {schema: AnalyzeSpendingPatternsInputSchema},
  output: {schema: AnalyzeSpendingPatternsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following spending data and provide insights into the user's spending habits. Identify key spending areas and suggest ways to achieve more balanced spending. expenses data: {{{expenses}}}`,
});

const analyzeSpendingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeSpendingPatternsFlow',
    inputSchema: AnalyzeSpendingPatternsInputSchema,
    outputSchema: AnalyzeSpendingPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
