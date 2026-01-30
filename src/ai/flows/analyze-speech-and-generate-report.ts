'use server';

/**
 * @fileOverview Analyzes user speech on a specific topic and generates a personality report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema matching what the frontend sends
const AnalyzeSpeechAndGenerateReportInputSchema = z.object({
  topic: z.string(),
  questions: z.array(z.string()),
  speechResponses: z.array(z.string()),
});

export type AnalyzeSpeechAndGenerateReportInput = z.infer<typeof AnalyzeSpeechAndGenerateReportInputSchema>;

// Define the output schema matching what the frontend expects
const AnalyzeSpeechAndGenerateReportOutputSchema = z.object({
  report: z.string().describe('A detailed personality report with strengths and weaknesses based on the speech analysis.'),
  chartsData: z.string().describe('The data to be used to generate charts for the report. This must be a raw JSON string of an array of chart objects, without any markdown formatting.'),
});

export type AnalyzeSpeechAndGenerateReportOutput = z.infer<typeof AnalyzeSpeechAndGenerateReportOutputSchema>;

// The main exported function called by the frontend
export async function analyzeSpeechAndGenerateReport(input: AnalyzeSpeechAndGenerateReportInput): Promise<AnalyzeSpeechAndGenerateReportOutput> {
  return analyzeSpeechAndGenerateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpeechAndGenerateReportPrompt',
  input: { schema: AnalyzeSpeechAndGenerateReportInputSchema },
  output: { schema: AnalyzeSpeechAndGenerateReportOutputSchema },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant designed to analyze a user's communication skills and personality traits based on their spoken responses to questions about a specific topic.

  Topic: {{{topic}}}

  Questions and Spoken Responses:
  {{#each questions}}
  - Question: {{{this}}}
    Response: {{{lookup ../speechResponses @index}}}
  {{/each}}

  Analyze the user's responses on the following parameters:
  1. **Clarity of Thought**: How well structured and logical were the answers?
  2. **Communication Style**: Was the tone confident, hesitant, formal, or casual?
  3. **Depth of Insight**: Did the user demonstrate a deep understanding of the topic?

  Generate a detailed personality report highlighting strengths and areas for improvement. Provide actionable feedback on how they can improve their public speaking or thought articulation.

  Also, create data for charts to visualize the user's skills. The charts data must be a raw JSON string of an array of objects. Each object should represent a chart and have 'type' ('bar' or 'pie'), 'title', 'data', and 'config' properties.

  IMPORTANT: The 'chartsData' field in your output must be a valid JSON string ONLY. Do not include any markdown formatting like \`\`\`json or any other text outside of the JSON array.

  Example for chartsData:
  [
    {
      "type": "bar",
      "title": "Communication Analysis",
      "data": [
        { "name": "Clarity", "score": 85 },
        { "name": "Confidence", "score": 75 },
        { "name": "Depth", "score": 80 }
      ],
      "config": {
        "score": { "label": "Score", "color": "hsl(var(--chart-1))" }
      }
    }
  ]
  `,
});

const analyzeSpeechAndGenerateReportFlow = ai.defineFlow(
  {
    name: 'analyzeSpeechAndGenerateReportFlow',
    inputSchema: AnalyzeSpeechAndGenerateReportInputSchema,
    outputSchema: AnalyzeSpeechAndGenerateReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
