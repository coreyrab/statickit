import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiClientResult {
  genAI: GoogleGenerativeAI;
}

/**
 * Create a Gemini client with the provided API key.
 * The key is passed directly from the client request.
 */
export function createGeminiClient(apiKey: string): GeminiClientResult {
  return {
    genAI: new GoogleGenerativeAI(apiKey),
  };
}
