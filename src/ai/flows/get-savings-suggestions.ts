'use server';

/**
 * @fileOverview A flow to provide personalized savings suggestions by identifying a reduction target in the user's highest spending category.
 *
 * - getSavingsSuggestions - A function that returns personalized savings suggestions.
 * - GetSavingsSuggestionsInput - The input type for the getSavingsSuggestions function.
 * - GetSavingsSuggestionsOutput - The return type for the getSavingsSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSavingsSuggestionsInputSchema = z.object({
  spendingData: z
    .record(z.number())
    .describe(
      'An object where keys are spending categories and values are the total amount spent in that category.'
    ),
  reductionTargetPercentage: z
    .number()
    .default(10)
    .describe(
      'The percentage by which the user wants to reduce spending in their highest spending category. Defaults to 10%.'
    ),
});
export type GetSavingsSuggestionsInput = z.infer<typeof GetSavingsSuggestionsInputSchema>;

const GetSavingsSuggestionsOutputSchema = z.object({
  highestSpendingCategory: z.string().describe('The category in which the user spends the most.'),
  potentialSavings:
    z.number().describe(
      'The potential savings amount if the user reduces spending in the highest spending category by the specified percentage.'
    ),
  suggestion:
    z.string().describe(
      'A personalized suggestion on how the user can reduce spending in the highest spending category.'
    ),
});
export type GetSavingsSuggestionsOutput = z.infer<typeof GetSavingsSuggestionsOutputSchema>;

export async function getSavingsSuggestions(
  input: GetSavingsSuggestionsInput
): Promise<GetSavingsSuggestionsOutput> {
  return getSavingsSuggestionsFlow(input);
}

const savingsSuggestionsPrompt = ai.definePrompt({
  name: 'savingsSuggestionsPrompt',
  input: {schema: GetSavingsSuggestionsInputSchema},
  output: {schema: GetSavingsSuggestionsOutputSchema},
  prompt: `Given the following spending data:\n\nSpending Data: {{{spendingData}}}\n\nCalculate the category in which the user spends the most money. Then, calculate the potential savings if the user reduces spending in that category by {{reductionTargetPercentage}}%. Finally, provide a personalized suggestion on how the user can reduce spending in that category.\n\nRespond in the following format:\n{\n  "highestSpendingCategory": "The category in which the user spends the most.",\n  "potentialSavings": "The potential savings amount if the user reduces spending in the highest spending category by the specified percentage.",\n  "suggestion": "A personalized suggestion on how the user can reduce spending in that category."\n}\n`,
});

const getSavingsSuggestionsFlow = ai.defineFlow(
  {
    name: 'getSavingsSuggestionsFlow',
    inputSchema: GetSavingsSuggestionsInputSchema,
    outputSchema: GetSavingsSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await savingsSuggestionsPrompt(input);
    return output!;
  }
);
