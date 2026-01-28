
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
        // Other models are available, like gemini-1.5-flash-latest, gemini-1.5-pro-latest, etc.
        // See all available models at https://genkit.dev/docs/models#google-genai
        // gemini-pro is a good default for most use cases.
        // By default, the model is looked up from the GENAI_MODEL environment variable.
    }),
  ],
  // The model to use for all generate() calls.
  // This can be overridden in the generate() call.
  // By default, the model is looked up from the GENAI_MODEL environment variable.
  model: 'googleai/gemini-1.5-flash-latest',
  // Log all traces to the console.
  // This is useful for debugging.
  // You can also use the Genkit UI to inspect traces.
  // TODO: Add telemetry plugin to export traces to a backend.
  //logLevel: 'debug',
  // Enable the Genkit developer UI
  // You can inspect traces, see your model and flow configurations, and more.
  //ui: {
  //  enabled: true,
  //  port: 4001,
  //},
});
