
'use server';



import { ai } from '@/ai/genkit';

import { sendEmail } from '@/services/email';

import { z } from 'zod';



const SendReportEmailInputSchema = z.object({

  email: z.string().email('Invalid email address'),

  report: z.string().min(1, 'Report content is required'),

  title: z.string().min(1, 'Book title is required'),

  score: z.number(),

  grade: z.string(),

});

export type SendReportEmailInput = z.infer<typeof SendReportEmailInputSchema>;



const SendReportEmailOutputSchema = z.object({

  success: z.boolean(),

  message: z.string(),

});

export type SendReportEmailOutput = z.infer<

  typeof SendReportEmailOutputSchema

>;



const sendReportEmailFlow = ai.defineFlow(

  {

    name: 'sendReportEmailFlow',

    inputSchema: SendReportEmailInputSchema,

    outputSchema: SendReportEmailOutputSchema,

  },

  async ({ email, report, title, score, grade }) => {

    try {

      // Basic but clean HTML email template

      const htmlBody = `

        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 2rem;">

          <h1 style="color: #6366F1; text-align: center; font-size: 2.25rem;">IntraPersonaL Report</h1>

          <h2 style="color: #374151; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">Analysis for "${title}"</h2>

          

          <div style="background-color: #f8fafc; padding: 1.5rem; border-radius: 0.5rem; text-align: center; margin-top: 1rem; margin-bottom: 2rem;">

            <p style="font-size: 1.125rem; color: #4b5563; margin: 0;">Your Overall Score</p>

            <p style="font-size: 4rem; font-weight: bold; color: #6366F1; margin: 0.5rem 0;">${score}</p>

            <p style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; background-color: #e0e7ff; display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px;">${grade}</p>

          </div>



          <h3 style="color: #4b5563;">Detailed Insights:</h3>

          <div style="white-space: pre-wrap; background-color: #f8fafc; padding: 1rem; border-radius: 0.5rem; line-height: 1.6;">${report}</div>

          <p style="text-align: center; color: #9ca3af; font-size: 0.875rem; margin-top: 2rem;">Thank you for using IntraPersonaL.</p>

        </div>

      `;



      await sendEmail({

        to: email,

        subject: `Your IntraPersonaL report for "${title}"`,

        html: htmlBody,

      });



      return {

        success: true,

        message: 'Email sent successfully.',

      };

    } catch (err: any) {

      console.error('Error sending email:', err);

      const errorMessage = err.message?.includes('credentials')

        ? 'Email server is not configured. Please check server logs.'

        : 'Failed to send email. Please try again later.';

      

      return {

        success: false,

        message: errorMessage,

      };

    }

  }

);



export async function sendReportEmail(

  input: SendReportEmailInput

): Promise<SendReportEmailOutput> {

  return sendReportEmailFlow(input);

}
