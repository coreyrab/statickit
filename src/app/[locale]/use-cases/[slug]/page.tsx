import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUseCaseBySlug, getAllUseCaseSlugs } from '@/lib/use-cases';
import UseCaseContent from './UseCaseContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for English only
export async function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ locale: 'en', slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return {
      title: 'Use Case Not Found - StaticKit',
    };
  }

  const url = `https://statickit.ai/use-cases/${slug}`;

  return {
    title: `AI ${useCase.title} - StaticKit`,
    description: useCase.description,
    keywords: useCase.keywords,
    openGraph: {
      title: `AI ${useCase.title} - StaticKit`,
      description: useCase.description,
      type: 'website',
      url,
      siteName: 'StaticKit',
      images: useCase.coverImage ? [
        {
          url: `https://statickit.ai${useCase.coverImage}`,
          width: 1200,
          height: 630,
          alt: useCase.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `AI ${useCase.title} - StaticKit`,
      description: useCase.description,
      creator: '@coreyrab',
    },
    alternates: {
      canonical: url,
    },
  };
}

// JSON-LD structured data for WebPage schema
function generateWebPageSchema(slug: string, useCase: NonNullable<ReturnType<typeof getUseCaseBySlug>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: useCase.title,
    description: useCase.description,
    url: `https://statickit.ai/use-cases/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'StaticKit',
      logo: {
        '@type': 'ImageObject',
        url: 'https://statickit.ai/logo.svg',
      },
    },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'StaticKit',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  };
}

// JSON-LD structured data for FAQPage schema
function generateFAQSchema(useCase: NonNullable<ReturnType<typeof getUseCaseBySlug>>) {
  if (!useCase.faqs || useCase.faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: useCase.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  const webPageSchema = generateWebPageSchema(slug, useCase);
  const faqSchema = generateFAQSchema(useCase);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <UseCaseContent useCase={useCase} />
    </>
  );
}
