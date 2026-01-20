// Blog posts data - shared between server and client components
// Translations are loaded from messages/{locale}.json

export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  title: string;
  description: string; // SEO meta description
  excerpt: string; // Short excerpt for listing pages
  readTime: string;
  date: string;
  author: string;
  authorUrl?: string;
  coverImage?: string;
  content: string;
  faqs?: FAQ[]; // Optional FAQs for FAQ schema
}

// Base post metadata that doesn't need translation
export interface PostMetadata {
  slug: string;
  date: string;
  author: string;
  authorUrl?: string;
  coverImage?: string;
}

// All posts with their non-translatable metadata
export const postsMetadata: PostMetadata[] = [
  {
    slug: 'how-statickit-works',
    date: '2025-01-01',
    author: 'Corey Rabazinski',
    coverImage: '/blog/how_statickit_works.jpg',
  },
  {
    slug: 'nano-banana-pro-without-watermarks',
    date: '2025-01-12',
    author: 'Corey Rabazinski',
    coverImage: '/blog/nano_banana_no_watermark.jpg',
  },
  {
    slug: 'iterate-meta-ads-ai-image-editing',
    date: '2025-01-09',
    author: 'Corey Rabazinski',
    coverImage: '/blog/meta-ads-iteration.jpg',
  },
  {
    slug: 'gemini-image-generation-no-watermark',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/geminiwatermark_blog.jpg',
  },
  {
    slug: 'natural-language-image-editing',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/painting_with_words.jpg',
  },
  {
    slug: 'best-free-ai-image-editors',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/statickit_before_after.jpg',
  },
];

// Type for translated post content from messages
export interface TranslatedPostContent {
  title: string;
  description: string;
  excerpt: string;
  readTime: string;
  content: string;
  faqs?: FAQ[];
}

// Type for blog messages structure
export interface BlogMessages {
  pageTitle: string;
  pageDescription: string;
  back: string;
  noPosts: string;
  posts: Record<string, TranslatedPostContent>;
}

// Get all post slugs for static generation
export function getAllPostSlugs(): string[] {
  return postsMetadata.map(post => post.slug);
}

// Get post metadata by slug
export function getPostMetadata(slug: string): PostMetadata | undefined {
  return postsMetadata.find(post => post.slug === slug);
}

// Get full translated post by slug using messages
export function getPostBySlug(slug: string, blogMessages: BlogMessages): BlogPost | undefined {
  const metadata = getPostMetadata(slug);
  if (!metadata) return undefined;

  const translatedContent = blogMessages.posts[slug];
  if (!translatedContent) return undefined;

  return {
    ...translatedContent,
    date: metadata.date,
    author: metadata.author,
    authorUrl: metadata.authorUrl,
    coverImage: metadata.coverImage,
  };
}

// Get all posts with translations for listing page
export function getAllPosts(blogMessages: BlogMessages): (BlogPost & { slug: string })[] {
  const posts: (BlogPost & { slug: string })[] = [];

  for (const metadata of postsMetadata) {
    const translatedContent = blogMessages.posts[metadata.slug];
    if (!translatedContent) continue;

    posts.push({
      slug: metadata.slug,
      ...translatedContent,
      date: metadata.date,
      author: metadata.author,
      authorUrl: metadata.authorUrl,
      coverImage: metadata.coverImage,
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Legacy exports for backwards compatibility during migration
// These use English as the default - will be removed after full migration
export const posts: Record<string, BlogPost> = {};

// Initialize posts from English messages (loaded lazily)
let postsInitialized = false;

async function initializeLegacyPosts() {
  if (postsInitialized) return;
  try {
    const enMessages = await import('../../messages/en.json');
    const blogMessages = enMessages.blog as BlogMessages;

    for (const metadata of postsMetadata) {
      const translatedContent = blogMessages.posts[metadata.slug];
      if (translatedContent) {
        posts[metadata.slug] = {
          ...translatedContent,
          date: metadata.date,
          author: metadata.author,
          authorUrl: metadata.authorUrl,
          coverImage: metadata.coverImage,
        };
      }
    }
    postsInitialized = true;
  } catch {
    // Messages not available yet during build
  }
}

// Initialize on module load for backwards compatibility
initializeLegacyPosts();
