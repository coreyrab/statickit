import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPostSlugs } from '@/lib/blog-posts';
import BlogPostContent from './BlogPostContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found - StaticKit Blog',
    };
  }

  const url = `https://statickit.ai/blog/${slug}`;

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
      images: post.coverImage ? [
        {
          url: `https://statickit.ai${post.coverImage}`,
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
      canonical: url,
      types: {
        'text/markdown': `https://statickit.ai/blog/md/${slug}.md`,
      },
    },
  };
}

// JSON-LD structured data for Article schema
function generateArticleSchema(slug: string, post: NonNullable<ReturnType<typeof getPostBySlug>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.coverImage ? `https://statickit.ai${post.coverImage}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
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
        url: 'https://statickit.ai/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://statickit.ai/blog/${slug}`,
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
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleSchema = generateArticleSchema(slug, post);
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
