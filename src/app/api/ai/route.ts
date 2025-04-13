import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (server-side only)
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key in server environment');
}

const openai = new OpenAI({
  apiKey,
});

export async function POST(request: Request) {
  try {
    const { prompt, model = 'gpt-3.5-turbo', max_tokens = 1000 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful D&D game master.' },
        { role: 'user', content: prompt }
      ],
      max_tokens,
    });

    return NextResponse.json({
      text: response.choices[0]?.message?.content || '',
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error generating AI response' },
      { status: 500 }
    );
  }
} 