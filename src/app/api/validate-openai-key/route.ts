import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required', valid: false },
        { status: 400 }
      );
    }

    // Basic format validation for OpenAI API keys
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format. OpenAI API keys start with "sk-"', valid: false },
        { status: 400 }
      );
    }

    // Test the key with a minimal API call
    try {
      const openai = new OpenAI({ apiKey });

      // List models is a cheap way to validate the key
      await openai.models.list();
    } catch (testError: any) {
      console.error('OpenAI API key validation failed:', testError?.message);

      if (testError?.status === 401 ||
          testError?.message?.includes('Incorrect API key') ||
          testError?.message?.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your key and try again.', valid: false },
          { status: 400 }
        );
      }

      if (testError?.status === 429 ||
          testError?.message?.includes('rate limit') ||
          testError?.message?.includes('quota')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.', valid: false },
          { status: 400 }
        );
      }

      if (testError?.message?.includes('billing') ||
          testError?.message?.includes('payment')) {
        return NextResponse.json(
          { error: 'Please add a payment method to your OpenAI account.', valid: false },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to validate API key. Please try again.', valid: false },
        { status: 400 }
      );
    }

    // Key is valid
    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('OpenAI key validation error:', error);
    return NextResponse.json(
      { error: 'Failed to process API key', valid: false },
      { status: 500 }
    );
  }
}
