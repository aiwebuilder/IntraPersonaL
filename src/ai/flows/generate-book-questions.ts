
'use server';

/**
 * @fileOverview A flow to generate questions based on a book summary.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateBookQuestionsInputSchema = z.object({
  bookTitle: z.string(),
  summary: z.string(),
});
export type GenerateBookQuestionsInput = z.infer<typeof GenerateBookQuestionsInputSchema>;

const GenerateBookQuestionsOutputSchema = z.object({
  rapidFireQuestions: z.array(z.string().max(100)).length(5).describe('Five rapid-fire questions, each 10 words or less, based on the summary.'),
  followUpQuestions: z.array(z.string()).length(2).describe('Two open-ended follow-up questions to assess deeper understanding.'),
});
export type GenerateBookQuestionsOutput = z.infer<typeof GenerateBookQuestionsOutputSchema>;

export async function generateBookQuestions(input: GenerateBookQuestionsInput): Promise<GenerateBookQuestionsOutput> {
  return generateBookQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBookQuestionsPrompt',
  input: {schema: GenerateBookQuestionsInputSchema},
  output: {schema: GenerateBookQuestionsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant who creates questions based on a book summary.

  Book Title: {{{bookTitle}}}
  Summary: {{{summary}}}

  Based on the summary, generate two sets of questions:
  1.  **Rapid-Fire Questions**: Create exactly five short questions to test factual recall from the summary. Each question MUST be 10 words or less.
  2.  **Follow-Up Questions**: Create exactly two open-ended questions that encourage the user to think more deeply about the book's themes, implications, or characters.

  Return the questions in the specified JSON format.
  `,
});

const generateBookQuestionsFlow = ai.defineFlow(
  {
    name: 'generateBookQuestionsFlow',
    inputSchema: GenerateBookQuestionsInputSchema,
    outputSchema: GenerateBookQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
