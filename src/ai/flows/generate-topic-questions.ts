
'use server';

/**
 * @fileOverview A flow to generate three questions based on the selected topic and initial speech analysis.
 *
 * - generateTopicQuestions - A function that generates the questions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateTopicQuestionsInputSchema = z.object({
  topic: z.string(),
  speechAnalysis: z.string(),
});
export type GenerateTopicQuestionsInput = z.infer<typeof GenerateTopicQuestionsInputSchema>;

const GenerateTopicQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).length(3),
});
export type GenerateTopicQuestionsOutput = z.infer<typeof GenerateTopicQuestionsOutputSchema>;


export async function generateTopicQuestions(input: GenerateTopicQuestionsInput): Promise<GenerateTopicQuestionsOutput> {
  return generateTopicQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTopicQuestionsPrompt',
  input: {schema: GenerateTopicQuestionsInputSchema},
  output: {schema: GenerateTopicQuestionsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an AI assistant designed to generate thought-provoking questions based on a given topic and initial speech analysis.

  Topic: {{{topic}}}
  Initial Speech Analysis: {{{speechAnalysis}}}

  Generate three questions that encourage the user to elaborate further on the topic, taking into account their initial responses. The questions should be clear, concise, and relevant to both the topic and the user's initial input.

  Output the three questions as a JSON array of strings.
  Ensure that questions are open ended, so that maximum relevant information is collected from the user's answers.
  `,
});

const generateTopicQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTopicQuestionsFlow',
    inputSchema: GenerateTopicQuestionsInputSchema,
    outputSchema: GenerateTopicQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
