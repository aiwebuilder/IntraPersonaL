
'use server';

/**

* @fileOverview Analyzes speech responses to generated questions and creates a detailed personality report.

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

report: z.string(),

chartsData: z.string(),

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

prompt: `You are an AI assistant designed to analyze user speech responses to questions based on a given topic and generate a detailed personality report.



Topic: {{{topic}}}


Questions and respective user answers:

{{#each questions}}

- Question: {{{this}}}

Answer: {{{lookup ../speechResponses @index}}}

{{/each}}



Analyze the speech responses, identify strengths and weaknesses, and generate a report with insights about the user's personality.

The report should be comprehensive and provide actionable feedback.


Also, create data for charts to visualize the user's personality traits. The charts data must be a raw JSON string of an array of objects. Each object should represent a chart and have 'type' ('bar' or 'pie'), 'title', 'data', and 'config' properties.


IMPORTANT: The 'chartsData' field in your output must be a valid JSON string ONLY. Do not include any markdown formatting like \`\`\`json or any other text outside of the JSON array.


For bar charts, the 'data' should be an array of objects with 'name' and 'score' properties. The 'config' should define the 'score' with a label and a color.

For pie charts, the 'data' should be an array of objects with 'name', 'value', and 'fill' properties.


Example for chartsData:

[

{

"type": "bar",

"title": "Communication Skills",

"data": [

{ "name": "Clarity", "score": 85 },

{ "name": "Conciseness", "score": 70 },

{ "name": "Confidence", "score": 90 }

],

"config": {

"score": { "label": "Score", "color": "hsl(var(--chart-1))" }

}

},

{

"type": "pie",

"title": "Personality Traits",

"data": [

{ "name": "Openness", "value": 30, "fill": "hsl(var(--chart-1))" },

{ "name": "Conscientiousness", "value": 25, "fill": "hsl(var(--chart-2))" },

{ "name": "Extraversion", "value": 20, "fill": "hsl(var(--chart-3))" }

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

);
