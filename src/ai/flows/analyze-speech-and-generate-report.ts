'use server';
/**
 * @fileOverview Analyzes user answers to book-related questions and generates a personality report.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeBookAnswersInputSchema = z.object({
  bookTitle: z.string(),
  bookSummary: z.string(),
  rapidFireQuestions: z.array(z.string()),
  rapidFireAnswers: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  followUpAnswers: z.array(z.string()),
});
export type AnalyzeBookAnswersInput = z.infer<typeof AnalyzeBookAnswersInputSchema>;

// Define the chart structure explicitly so the model doesn't have to stringify it
const ChartDataSchema = z.object({
    type: z.enum(['bar', 'pie']),
    title: z.string(),
    data: z.array(z.object({
        name: z.string(),
        score: z.number(),
        fill: z.string().optional(), // optional color override
    })),
    config: z.record(z.any()).optional(),
});

const AnalyzeBookAnswersOutputSchema = z.object({
    report: z.string().describe('A detailed personality report with strengths and weaknesses...'),
    // Change from z.string() to z.array(...)
    chartsData: z.array(ChartDataSchema).describe('Array of chart objects for visualization.'),
});
export type AnalyzeBookAnswersOutput = z.infer<typeof AnalyzeBookAnswersOutputSchema>;

export async function analyzeBookAnswers(input: AnalyzeBookAnswersInput): Promise<AnalyzeBookAnswersOutput> {
  return analyzeBookAnswersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBookAnswersPrompt',
  input: {schema: AnalyzeBookAnswersInputSchema},
  output: {schema: AnalyzeBookAnswersOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant designed to analyze a user's reading comprehension...

  [... keep your existing inputs here ...]

  Analyze the user's answers on the following parameters:
  1. Reading Comprehension
  2. Critical Thinking
  3. Clarity of Expression

  Generate a detailed personality report highlighting strengths and weaknesses.

  Also, populate the 'chartsData' array with objects representing the user's skills.
  Example structure for a chart:
  {
      "type": "bar",
      "title": "Overall Performance",
      "data": [
        { "name": "Comprehension", "score": 85 },
        { "name": "Critical Thinking", "score": 70 }
      ]
  }
  `,
});

const analyzeBookAnswersFlow = ai.defineFlow(
  {
    name: 'analyzeBookAnswersFlow',
    inputSchema: AnalyzeBookAnswersInputSchema,
    outputSchema: AnalyzeBookAnswersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
