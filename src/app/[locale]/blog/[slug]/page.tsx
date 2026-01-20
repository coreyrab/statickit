import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPostSlugs, getPostMetadata, type BlogMessages } from '@/lib/blog-posts';
import { getMessages, getLocale } from 'next-intl/server';
import BlogPostContent from './BlogPostContent';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Generate static params for all blog posts across all locales
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const messages = await getMessages();
  const blogMessages = (messages as { blog?: BlogMessages }).blog;

  if (!blogMessages) {
    return {
      title: 'Post Not Found - StaticKit Blog',
    };
  }

  const post = getPostBySlug(slug, blogMessages);

  if (!post) {
    return {
      title: 'Post Not Found - StaticKit Blog',
    };
  }

  const baseUrl = 'https://statickit.ai';
  const url = locale === 'en' ? `${baseUrl}/blog/${slug}` : `${baseUrl}/${locale}/blog/${slug}`;

  return {
    title: `${post.title} - StaticKit Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url,
      siteName: 'StaticKit',
      locale: locale,
      images: post.coverImage ? [
        {
          url: `${baseUrl}${post.coverImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      creator: '@coreyrab',
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
      languages: {
        'en': `${baseUrl}/blog/${slug}`,
        'es': `${baseUrl}/es/blog/${slug}`,
        'de': `${baseUrl}/de/blog/${slug}`,
        'fr': `${baseUrl}/fr/blog/${slug}`,
        'ja': `${baseUrl}/ja/blog/${slug}`,
        'zh': `${baseUrl}/zh/blog/${slug}`,
        'ko': `${baseUrl}/ko/blog/${slug}`,
        'pt': `${baseUrl}/pt/blog/${slug}`,
      },
      types: {
        'text/markdown': `${baseUrl}/blog/md/${slug}.md`,
      },
    },
  };
}

// JSON-LD structured data for Article schema
function generateArticleSchema(slug: string, post: NonNullable<ReturnType<typeof getPostBySlug>>, locale: string) {
  const baseUrl = 'https://statickit.ai';
  const url = locale === 'en' ? `${baseUrl}/blog/${slug}` : `${baseUrl}/${locale}/blog/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.coverImage ? `${baseUrl}${post.coverImage}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    author: {
      '@type': 'Person',
      name: post.author,
      url: post.authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'StaticKit',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

// JSON-LD structured data for FAQPage schema
function generateFAQSchema(post: NonNullable<ReturnType<typeof getPostBySlug>>) {
  if (!post.faqs || post.faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const messages = await getMessages();
  const blogMessages = (messages as { blog?: BlogMessages }).blog;

  if (!blogMessages) {
    notFound();
  }

  const post = getPostBySlug(slug, blogMessages);

  if (!post) {
    notFound();
  }

  const articleSchema = generateArticleSchema(slug, post, locale);
  const faqSchema = generateFAQSchema(post);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostContent post={post} />
    </>
  );
}
