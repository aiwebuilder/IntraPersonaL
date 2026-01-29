'use server';

/**
 * @fileOverview Generate a concise book summary (120–140 words) using Gemini 2.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema
const GetBookSummaryInputSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
});
export type GetBookSummaryInput = z.infer<typeof GetBookSummaryInputSchema>;

// Output schema
const GetBookSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise 120–140 word summary of the book.'),
});
export type GetBookSummaryOutput = z.infer<typeof GetBookSummaryOutputSchema>;

// Define the Gemini prompt
const bookSummaryPrompt = ai.definePrompt({
  name: 'bookSummaryPrompt',
  input: { schema: GetBookSummaryInputSchema },
  output: { schema: GetBookSummaryOutputSchema },
  model: 'googleai/gemini-2.5-flash', // This model name is valid
  prompt: `
You are a professional book summarizer.
Summarize the book "{{{title}}}" in 120–140 words.
Focus on key plot elements, main characters, and central themes.
Avoid spoilers and ensure it reads naturally, engagingly, and concisely.
`,
// REMOVED: "Return only the summary text." - This was causing the JSON parse error.
  config: {
    safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
    ]
  }
});

// Define flow
const getBookSummaryFlow = ai.defineFlow(
  {
    name: 'getBookSummaryFlow',
    inputSchema: GetBookSummaryInputSchema,
    outputSchema: GetBookSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await bookSummaryPrompt(input);
    if (!output) {
        throw new Error("Failed to generate summary: Output was null.");
    }
    return output;
  }
);

export async function getBookSummary(input: GetBookSummaryInput): Promise<GetBookSummaryOutput> {
  return getBookSummaryFlow(input);
}
