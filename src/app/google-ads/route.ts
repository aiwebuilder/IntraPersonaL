import { NextResponse } from 'next/server';

export async function GET() {
  // The content of your ads.txt
  const text = 'google.com, pub-6675484914269982, DIRECT, f08c47fec0942fa0';

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
