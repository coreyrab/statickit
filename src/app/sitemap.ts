import { MetadataRoute } from 'next';
import { getAllPostSlugs, getPostMetadata } from '@/lib/blog-posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://statickit.ai';

  // Dynamic blog posts from shared data
  const blogUrls = getAllPostSlugs().map((slug) => {
    const metadata = getPostMetadata(slug);
    return {
      url: `${baseUrl}/blog/${slug}`,
      lastModified: metadata ? new Date(metadata.date) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogUrls,
  ];
}
