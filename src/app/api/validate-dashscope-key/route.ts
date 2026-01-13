import { NextRequest, NextResponse } from 'next/server';
import { validateDashScopeKey } from '@/lib/dashscope-client';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required', valid: false },
        { status: 400 }
      );
    }

    // Basic format validation for DashScope API keys
    // DashScope keys typically start with "sk-" but we'll be lenient
    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Invalid API key format. Please check your DashScope API key.', valid: false },
        { status: 400 }
      );
    }

    // Test the key with a minimal API call
    const isValid = await validateDashScopeKey(apiKey);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your DashScope API key and try again.', valid: false },
        { status: 400 }
      );
    }

    // Key is valid
    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('DashScope key validation error:', error);
    return NextResponse.json(
      { error: 'Failed to process API key', valid: false },
      { status: 500 }
    );
  }
}
