
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

async function buffer(readable: ReadableStream) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

  if (!deepgramApiKey) {
    console.error("DEEPGRAM_API_KEY is not set in the environment variables.");
    return NextResponse.json(
      { error: 'Server configuration error: Missing Deepgram API Key.' },
      { status: 500 }
    );
  }

  const deepgram = createClient(deepgramApiKey);
  
  try {
    if (!request.body) {
         return NextResponse.json(
            { error: 'No audio file found in the request.' },
            { status: 400 }
        );
    }
    
    const bodyBuffer = await buffer(request.body);

    if (!bodyBuffer || bodyBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Empty audio file received.' },
        { status: 400 }
      );
    }
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        bodyBuffer,
        {
            model: 'nova-2',
            smart_format: true,
        }
    );

    if (error) {
        console.error('Deepgram API Error:', error);
        return NextResponse.json({ error: 'Error processing audio with Deepgram.' }, { status: 500 });
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript ?? "";

    return NextResponse.json({ transcript });

  } catch (error: any) {
    console.error('Server Error in /api/transcribe:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred processing the audio.' },
      { status: 500 }
    );
  }
}
