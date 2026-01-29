
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

const AnalyzeBookAnswersOutputSchema = z.object({
    report: z.string().describe('A detailed personality report with strengths and weaknesses based on reading comprehension, critical thinking, and communication skills.'),
    chartsData: z.string().describe('The data to be used to generate charts for the report. This must be a raw JSON string of an array of chart objects, without any markdown formatting.'),
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
  prompt: `You are an AI assistant designed to analyze a user's reading comprehension, critical thinking, and communication skills based on their answers to questions about a book summary.

  Book Title: {{{bookTitle}}}
  Book Summary: {{{bookSummary}}}
  
  Rapid-Fire Questions and Answers (text-based):
  {{#each rapidFireQuestions}}
  - Question: {{{this}}}
    Answer: {{{lookup ../rapidFireAnswers @index}}}
  {{/each}}

  Follow-Up Questions and Answers (speech-based):
  {{#each followUpQuestions}}
  - Question: {{{this}}}
    Answer: {{{lookup ../followUpAnswers @index}}}
  {{/each}}

  Analyze the user's answers on the following parameters:
  1.  **Reading Comprehension**: How well did the user understand and recall details from the summary? (Assessed from rapid-fire answers).
  2.  **Critical Thinking**: How well did the user analyze the themes and concepts of the book? (Assessed from follow-up answers).
  3.  **Clarity of Expression**: How clear and articulate were the user's spoken responses? (Assessed from follow-up answers).

  Generate a detailed personality report highlighting strengths and weaknesses across these parameters. Provide actionable feedback.

  Also, create data for charts to visualize the user's skills. The charts data must be a raw JSON string of an array of objects. Each object should represent a chart and have 'type' ('bar' or 'pie'), 'title', 'data', and 'config' properties.
  
  IMPORTANT: The 'chartsData' field in your output must be a valid JSON string ONLY. Do not include any markdown formatting like \`\`\`json or any other text outside of the JSON array.
  
  Example for chartsData:
  [
    {
      "type": "bar",
      "title": "Overall Performance",
      "data": [
        { "name": "Comprehension", "score": 85 },
        { "name": "Critical Thinking", "score": 70 },
        { "name": "Expression", "score": 90 }
      ],
      "config": {
        "score": { "label": "Score", "color": "hsl(var(--chart-1))" }
      }
    }
  ]
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
