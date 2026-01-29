'use server';
/**
 * @fileOverview Analyzes speech responses to generated questions and creates a detailed IntraPersonaL report.
 *
 * - analyzeSpeechAndGenerateReport - A function that analyzes user speech and generates a personality report.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeSpeechAndGenerateReportInputSchema = z.object({
  topic: z.string(),
  questions: z.array(z.string()),
  speechResponses: z.array(z.string()),
});
export type AnalyzeSpeechAndGenerateReportInput = z.infer<typeof AnalyzeSpeechAndGenerateReportInputSchema>;

const AnalyzeSpeechAndGenerateReportOutputSchema = z.object({
  report: z.string().describe('A detailed IntraPersonaL personality report with strengths and weaknesses based on competency, understanding, logical reasoning, and critical thinking.'),
  chartsData: z.string().describe('The data to be used to generate charts for the report. This must be a raw JSON string of an array of chart objects, without any markdown formatting.'),
});
export type AnalyzeSpeechAndGenerateReportOutput = z.infer<typeof AnalyzeSpeechAndGenerateReportOutputSchema>;


export async function analyzeSpeechAndGenerateReport(input: AnalyzeSpeechAndGenerateReportInput): Promise<AnalyzeSpeechAndGenerateReportOutput> {
  return analyzeSpeechAndGenerateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSpeechAndGenerateReportPrompt',
  input: {schema: AnalyzeSpeechAndGenerateReportInputSchema},
  output: {schema: AnalyzeSpeechAndGenerateReportOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are "IntraPersonaL", an AI assistant designed to analyze user speech responses to questions based on a given topic and generate a detailed personality report.

  Topic: {{{topic}}}
  
  Questions and respective user answers:
  {{#each questions}}
  - Question: {{{this}}}
    Answer: {{{lookup ../speechResponses @index}}}
  {{/each}}

  Analyze the user's responses on the following parameters:
  1.  **Competency**: How well did the user demonstrate specific skills and knowledge related to the topic?
  2.  **Understanding**: How well did the user grasp the core concepts of the questions?
  3.  **Logical and Reasoning**: Did the user build arguments logically and sequentially?
  4.  **Critical Thinking**: How well did the user evaluate the information and form independent judgments?

  Generate a detailed IntraPersonaL personality report highlighting strengths and weaknesses across these parameters. Provide actionable feedback.
  
  Also, create data for a variety of charts to visualize the user's personality traits and skills. You should generate data for multiple types of visualizations, such as **Bar Charts, Pie Charts, Line Graphs, or Radar Charts**.

  The charts data must be a raw JSON string of an array of objects. Each object should represent a chart and have:
  - 'type': one of 'bar', 'pie', 'line', 'radar', or 'area'.
  - 'title': A string title for the chart.
  - 'data': An array of objects containing the data points.
  - 'config': A configuration object for colors and labels (optional/adaptive based on chart type).
  
  IMPORTANT: The 'chartsData' field in your output must be a valid JSON string ONLY. Do not include any markdown formatting like \`\`\`json or any other text outside of the JSON array.
  
  Example for chartsData:
  [
    {
      "type": "radar",
      "title": "Cognitive Analysis",
      "data": [
        { "subject": "Competency", "A": 85, "fullMark": 100 },
        { "subject": "Understanding", "A": 70, "fullMark": 100 },
        { "subject": "Logic", "A": 90, "fullMark": 100 },
        { "subject": "Critical Thinking", "A": 75, "fullMark": 100 }
      ],
      "config": {
        "A": { "label": "User Score", "color": "hsl(var(--chart-1))" }
      }
    },
    {
      "type": "bar",
      "title": "Key Strengths",
      "data": [
        { "name": "Clarity", "score": 85 },
        { "name": "Conciseness", "score": 70 },
        { "name": "Confidence", "score": 90 }
      ],
      "config": {
        "score": { "label": "Score", "color": "hsl(var(--chart-2))" }
      }
    },
    {
      "type": "pie",
      "title": "Skill Distribution",
      "data": [
        { "name": "Logical", "value": 40, "fill": "hsl(var(--chart-3))" },
        { "name": "Creative", "value": 30, "fill": "hsl(var(--chart-4))" },
        { "name": "Analytical", "value": 30, "fill": "hsl(var(--chart-5))" }
      ]
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);    name: 'analyzeSpeechAndGenerateReportFlow',
    inputSchema: AnalyzeSpeechAndGenerateReportInputSchema,
    outputSchema: AnalyzeSpeechAndGenerateReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
