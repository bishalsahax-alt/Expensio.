'use server';

/**
 * @fileOverview Forecasts spending trends by comparing expenses over recent periods.
 *
 * - forecastSpendingTrends - A function that forecasts spending trends.
 * - ForecastSpendingTrendsInput - The input type for the forecastSpendingTrends function.
 * - ForecastSpendingTrendsOutput - The return type for the forecastSpendingTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastSpendingTrendsInputSchema = z.object({
  expenses: z.array(
    z.object({
      category: z.string().describe('The category of the expense.'),
      amount: z.number().describe('The amount of the expense.'),
      date: z.string().describe('The date of the expense in ISO format.'),
    })
  ).describe('A list of recent expenses.'),
  period: z.enum(['week', 'month', 'quarter']).default('month').describe('The period to analyze spending trends over.'),
});
export type ForecastSpendingTrendsInput = z.infer<typeof ForecastSpendingTrendsInputSchema>;

const ForecastSpendingTrendsOutputSchema = z.object({
  trendAnalysis: z.string().describe('An analysis of spending trends over the specified period.'),
  forecast: z.string().describe('A forecast of future spending based on the identified trends.'),
  recommendations: z.string().describe('Recommendations for adjusting the budget based on the forecast.'),
});
export type ForecastSpendingTrendsOutput = z.infer<typeof ForecastSpendingTrendsOutputSchema>;

export async function forecastSpendingTrends(input: ForecastSpendingTrendsInput): Promise<ForecastSpendingTrendsOutput> {
  return forecastSpendingTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastSpendingTrendsPrompt',
  input: {schema: ForecastSpendingTrendsInputSchema},
  output: {schema: ForecastSpendingTrendsOutputSchema},
  prompt: `Analyze the user\'s spending trends over the past {{period}}, and provide a forecast of future spending.

Here are the user\'s recent expenses:
{{#each expenses}}
- Date: {{date}}, Category: {{category}}, Amount: {{amount}}
{{/each}}

Based on this analysis, provide the following:

*  trendAnalysis: An analysis of spending trends over the specified period.
*  forecast: A forecast of future spending based on the identified trends.
*  recommendations: Recommendations for adjusting the budget based on the forecast.
`,
});

const forecastSpendingTrendsFlow = ai.defineFlow(
  {
    name: 'forecastSpendingTrendsFlow',
    inputSchema: ForecastSpendingTrendsInputSchema,
    outputSchema: ForecastSpendingTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
