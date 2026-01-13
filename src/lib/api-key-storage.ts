// Gemini API Key Storage
const GEMINI_STORAGE_KEY = 'statickit_gemini_api_key';

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_STORAGE_KEY, key);
}

export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_STORAGE_KEY);
}

export function hasStoredApiKey(): boolean {
  return !!getStoredApiKey();
}

// OpenAI API Key Storage
const OPENAI_STORAGE_KEY = 'statickit_openai_api_key';

export function getStoredOpenAIKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPENAI_STORAGE_KEY);
}

export function setStoredOpenAIKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OPENAI_STORAGE_KEY, key);
}

export function removeStoredOpenAIKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OPENAI_STORAGE_KEY);
}

export function hasStoredOpenAIKey(): boolean {
  return !!getStoredOpenAIKey();
}

// DashScope (Qwen) API Key Storage
const DASHSCOPE_STORAGE_KEY = 'statickit_dashscope_api_key';

export function getStoredDashScopeKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DASHSCOPE_STORAGE_KEY);
}

export function setStoredDashScopeKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DASHSCOPE_STORAGE_KEY, key);
}

export function removeStoredDashScopeKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DASHSCOPE_STORAGE_KEY);
}

export function hasStoredDashScopeKey(): boolean {
  return !!getStoredDashScopeKey();
}

// Helper to check if any API key is available
export function hasAnyApiKey(): boolean {
  return hasStoredApiKey() || hasStoredOpenAIKey() || hasStoredDashScopeKey();
}
