import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required', valid: false },
        { status: 400 }
      );
    }

    // Basic format validation for Google API keys
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json(
        { error: 'Invalid API key format. Google API keys start with "AIza"', valid: false },
        { status: 400 }
      );
    }

    // Test the key with a simple API call
    try {
      const testAI = new GoogleGenerativeAI(apiKey);
      const model = testAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Simple test prompt that uses minimal tokens
      await model.generateContent('Say "ok"');
    } catch (testError: any) {
      console.error('API key validation failed:', testError?.message);

      if (testError?.message?.includes('API_KEY_INVALID') ||
          testError?.message?.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your key and try again.', valid: false },
          { status: 400 }
        );
      }

      if (testError?.message?.includes('quota') ||
          testError?.message?.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'API key quota exceeded. Please check your Google AI billing.', valid: false },
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
    console.error('Key validation error:', error);
    return NextResponse.json(
      { error: 'Failed to process API key', valid: false },
      { status: 500 }
    );
  }
}
