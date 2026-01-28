
import { config } from 'dotenv';
config();

import '@/services/email.ts';
import '@/ai/flows/analyze-speech-and-generate-report.ts';
import '@/ai/flows/generate-topic-questions.ts';
import '@/ai/flows/send-report-email.ts';
import '@/ai/flows/get-book-summary.ts';
import '@/ai/flows/generate-book-questions.ts';
import '@/ai/flows/analyze-book-answers.ts';
