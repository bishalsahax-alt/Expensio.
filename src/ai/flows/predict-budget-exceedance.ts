'use server';

/**
 * @fileOverview Predicts when and by how much a user will exceed their monthly budget.
 *
 * - predictBudgetExceedance - A function that predicts budget exceedance based on spending habits.
 * - PredictBudgetExceedanceInput - The input type for the predictBudgetExceedance function.
 * - PredictBudgetExceedanceOutput - The return type for the predictBudgetExceedance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictBudgetExceedanceInputSchema = z.object({
  monthlyBudget: z.number().describe('The user\'s monthly budget.'),
  dailySpending: z.array(z.number()).describe('An array of the user\'s daily spending for the current month.'),
});
export type PredictBudgetExceedanceInput = z.infer<typeof PredictBudgetExceedanceInputSchema>;

const PredictBudgetExceedanceOutputSchema = z.object({
  exceedanceDate: z.string().describe('The predicted date when the user will exceed their budget (YYYY-MM-DD).'),
  exceedanceAmount: z.number().describe('The predicted amount by which the user will exceed their budget.'),
  analysis: z.string().describe('Daily spending analysis and factors contributing to the exceedance.'),
});
export type PredictBudgetExceedanceOutput = z.infer<typeof PredictBudgetExceedanceOutputSchema>;

export async function predictBudgetExceedance(input: PredictBudgetExceedanceInput): Promise<PredictBudgetExceedanceOutput> {
  return predictBudgetExceedanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictBudgetExceedancePrompt',
  input: {schema: PredictBudgetExceedanceInputSchema},
  output: {schema: PredictBudgetExceedanceOutputSchema},
  prompt: `You are a personal finance advisor. Given a user\'s monthly budget and daily spending habits for the current month, predict when and by how much they will exceed their budget. Provide a brief analysis of their daily spending.

Monthly Budget: {{monthlyBudget}}
Daily Spending: {{dailySpending}}

Analyze the daily spending and identify any trends or patterns.  Calculate the average daily spend. Based on the average daily spend, project when the user will exceed their monthly budget. Output the date in YYYY-MM-DD format, and the amount by which they will exceed their budget.

Consider these factors when making your prediction:
- Recent spending trends
- Any significant changes in spending habits
- The number of days remaining in the month
- Average Daily Spending

Make sure the date reflects the amount of days in each month. If today is January 30th, the date cannot be January 32nd.

Ensure the output is accurate and clearly explains the prediction and underlying factors. Be concise.

Output the date and the dollar amount the user will exceed their budget.

Analysis: Provide analysis on the user\'s daily spending habits. Identify how the user can reduce expenses, and how much they need to reduce expenses by.
`,
});

const predictBudgetExceedanceFlow = ai.defineFlow(
  {
    name: 'predictBudgetExceedanceFlow',
    inputSchema: PredictBudgetExceedanceInputSchema,
    outputSchema: PredictBudgetExceedanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
