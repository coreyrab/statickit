import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { generalRateLimiter, checkRateLimit } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Virality level descriptions - from standard ads to scroll-stopping viral content
const WEIRDNESS_LEVELS = {
  conservative: {
    range: [0, 20],
    name: 'Standard',
    description: 'Clean, professional, brand-safe',
    modifiers: [
      'clean studio lighting',
      'professional product photography style',
      'subtle lifestyle context',
      'polished commercial look',
      'minimal distraction background',
    ],
    style: 'Create a clean, professional ad that would fit perfectly in any brand campaign. Focus on clarity and product visibility. Safe for all audiences.',
  },
  different: {
    range: [21, 40],
    name: 'Lifestyle',
    description: 'Relatable, aspirational contexts',
    modifiers: [
      'authentic lifestyle moment',
      'relatable everyday scenario',
      'aspirational but achievable setting',
      'warm human connection',
      'real-world use case',
    ],
    style: 'Place the product in relatable, aspirational contexts that make viewers imagine owning it. Think "I could see myself there."',
  },
  creative: {
    range: [41, 60],
    name: 'Attention-Grabbing',
    description: 'Bold visuals that stop the scroll',
    modifiers: [
      'dramatic lighting that pops',
      'unexpected but striking angle',
      'bold color contrast',
      'cinematic mood',
      'visual hook in first glance',
      'pattern interrupt composition',
    ],
    style: 'Create something that stops the scroll. Use dramatic visuals, unexpected angles, or bold contrasts that demand attention in a feed full of noise.',
  },
  bold: {
    range: [61, 80],
    name: 'Share-Worthy',
    description: 'Creative enough to screenshot and share',
    modifiers: [
      'visually surprising concept',
      'clever visual metaphor',
      'aesthetic that sparks curiosity',
      'artistic statement piece',
      'conversation-starting composition',
      'Instagram-worthy styling',
      'unexpected juxtaposition',
    ],
    style: 'Create something people would screenshot and share. Think of ads that make people say "have you seen this?" - visually clever, aesthetically striking, worth talking about.',
  },
  unhinged: {
    range: [81, 100],
    name: 'Viral',
    description: 'Meme-worthy, culture-breaking content',
    modifiers: [
      'absurdist humor that lands',
      'meme-ready composition',
      'culturally relevant reference',
      'intentionally chaotic energy',
      'comment-bait visual',
      'polarizing but memorable',
      'TikTok-brain aesthetic',
      '"why does this work" energy',
      'unhinged brand voice',
      'internet culture fluency',
    ],
    style: 'Go full viral mode. Think Duolingo unhinged, Nutter Butter chaos, Scrub Daddy attitude. Create something so unexpected, so meme-able, that people HAVE to engage. The goal is comments, shares, stitches, screenshots. Make the algorithm happy.',
  },
};

function getWeirdnessLevel(value: number) {
  if (value <= 20) return WEIRDNESS_LEVELS.conservative;
  if (value <= 40) return WEIRDNESS_LEVELS.different;
  if (value <= 60) return WEIRDNESS_LEVELS.creative;
  if (value <= 80) return WEIRDNESS_LEVELS.bold;
  return WEIRDNESS_LEVELS.unhinged;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (200 requests/day for lighter operations)
    const rateLimitResult = await checkRateLimit(generalRateLimiter, userId, 'API requests');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { analysis, weirdnessLevel = 50 } = await request.json();

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis is required' },
        { status: 400 }
      );
    }

    const level = getWeirdnessLevel(weirdnessLevel);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Pick random modifiers based on level
    const numModifiers = Math.min(3, level.modifiers.length);
    const shuffled = [...level.modifiers].sort(() => Math.random() - 0.5);
    const selectedModifiers = shuffled.slice(0, numModifiers);

    const prompt = `You are a social media advertising expert who understands what makes content perform. Generate a single ad variation prompt.

ORIGINAL AD INFO:
- Product: ${analysis.product}
- Brand Style: ${analysis.brand_style}
- Target Audience: ${analysis.target_audience}
- Current Mood: ${analysis.mood}
- Colors: ${analysis.colors?.join(', ') || 'brand colors'}

VIRALITY LEVEL: ${level.name} (${weirdnessLevel}/100)
${level.description}

CREATIVE DIRECTION: ${level.style}

INCORPORATE THESE ELEMENTS:
${selectedModifiers.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Generate a single, detailed prompt (2-4 sentences) for an image variation that:
1. Keeps the product EXACTLY the same (especially any screens/UI)
2. ${weirdnessLevel <= 20 ? 'Creates a clean, professional ad that builds trust' : weirdnessLevel <= 40 ? 'Places the product in a relatable, desirable context' : weirdnessLevel <= 60 ? 'Creates a thumb-stopping visual that demands attention' : weirdnessLevel <= 80 ? 'Makes something screenshot-worthy that people want to share' : 'Goes full viral - meme-able, shareable, comment-worthy chaos'}
3. ${weirdnessLevel <= 60 ? `Would resonate with ${analysis.target_audience}` : `Would make ${analysis.target_audience} stop, engage, and share`}

${weirdnessLevel >= 80 ? 'VIRAL MODE: Think Duolingo owl energy, Nutter Butter unhinged posts, Scrub Daddy attitude. The algorithm rewards engagement - create something people HAVE to comment on, share, or screenshot. Absurdist but intentional.' : ''}
${weirdnessLevel >= 60 && weirdnessLevel < 80 ? 'SHARE-WORTHY: Create something aesthetically striking enough that people would screenshot it or send to a friend saying "have you seen this?"' : ''}

Return ONLY the prompt text, no quotes, no explanation.`;

    const result = await model.generateContent(prompt);
    const generatedPrompt = result.response.text().trim();

    return NextResponse.json({
      prompt: generatedPrompt,
      level: level.name,
      weirdnessLevel,
    });
  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
