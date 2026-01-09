import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'StaticKit Blog';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Blog posts titles - must match the slugs in blog-posts.ts
const postTitles: Record<string, string> = {
  'iterate-meta-ads-ai-image-editing': 'How to Iterate on Winning Meta Ads Without Killing Performance',
  'gemini-image-generation-no-watermark': 'How to use Gemini image generation without watermarks',
  'natural-language-image-editing': 'Edit images by describing what you want',
  'best-free-ai-image-editors': 'Best free AI image editors in 2026',
};

export default async function Image({ params }: { params: { slug: string } }) {
  const title = postTitles[params.slug] || 'StaticKit Blog';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: '900px',
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* Logo at bottom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: 'auto',
          }}
        >
          {/* StaticKit Logo SVG inline */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 101 101"
            fill="none"
          >
            <path d="M59.9691 26.3024C59.9691 28.6266 61.8532 30.5107 64.1774 30.5107C66.5016 30.5107 68.3857 28.6266 68.3857 26.3024C68.3857 23.9782 66.5016 22.0941 64.1774 22.0941C61.8532 22.0941 59.9691 23.9782 59.9691 26.3024Z" fill="white"/>
            <path d="M74.6982 26.3024C74.6982 28.6266 76.5824 30.5107 78.9066 30.5107C81.2308 30.5107 83.1149 28.6266 83.1149 26.3024C83.1149 23.9782 81.2308 22.0941 78.9066 22.0941C76.5824 22.0941 74.6982 23.9782 74.6982 26.3024Z" fill="white"/>
            <path d="M59.9691 74.6982C59.9691 77.0224 61.8532 78.9066 64.1774 78.9066C66.5016 78.9066 68.3857 77.0224 68.3857 74.6982C68.3857 72.374 66.5016 70.4899 64.1774 70.4899C61.8532 70.4899 59.9691 72.374 59.9691 74.6982Z" fill="white"/>
            <path d="M61.0212 13.6774C61.0212 15.4206 62.4343 16.8337 64.1774 16.8337C65.9206 16.8337 67.3337 15.4206 67.3337 13.6774C67.3337 11.9343 65.9206 10.5212 64.1774 10.5212C62.4343 10.5212 61.0212 11.9343 61.0212 13.6774Z" fill="white"/>
            <path d="M87.3232 42.0837C87.3232 43.8268 88.7363 45.2399 90.4795 45.2399C92.2226 45.2399 93.6357 43.8268 93.6357 42.0837C93.6357 40.3405 92.2226 38.9274 90.4795 38.9274C88.7363 38.9274 87.3232 40.3405 87.3232 42.0837Z" fill="white"/>
            <path d="M87.3232 58.917C87.3232 60.6601 88.7363 62.0732 90.4795 62.0732C92.2226 62.0732 93.6357 60.6601 93.6357 58.917C93.6357 57.1738 92.2226 55.7607 90.4795 55.7607C88.7363 55.7607 87.3232 57.1738 87.3232 58.917Z" fill="white"/>
            <path d="M61.0212 87.3232C61.0212 89.0664 62.4343 90.4795 64.1774 90.4795C65.9206 90.4795 67.3337 89.0664 67.3337 87.3232C67.3337 85.5801 65.9206 84.167 64.1774 84.167C62.4343 84.167 61.0212 85.5801 61.0212 87.3232Z" fill="white"/>
            <path d="M57.8649 42.0837C57.8649 45.57 60.6911 48.3962 64.1774 48.3962C67.6637 48.3962 70.4899 45.57 70.4899 42.0837C70.4899 38.5974 67.6637 35.7712 64.1774 35.7712C60.6911 35.7712 57.8649 38.5974 57.8649 42.0837Z" fill="white"/>
            <path d="M57.8649 58.917C57.8649 62.4033 60.6911 65.2295 64.1774 65.2295C67.6637 65.2295 70.4899 62.4033 70.4899 58.917C70.4899 55.4307 67.6637 52.6045 64.1774 52.6045C60.6911 52.6045 57.8649 55.4307 57.8649 58.917Z" fill="white"/>
            <path d="M74.6982 42.0837C74.6982 44.4079 76.5824 46.292 78.9066 46.292C81.2308 46.292 83.1149 44.4079 83.1149 42.0837C83.1149 39.7595 81.2308 37.8753 78.9066 37.8753C76.5824 37.8753 74.6982 39.7595 74.6982 42.0837Z" fill="white"/>
            <path d="M74.6982 58.917C74.6982 61.2412 76.5824 63.1253 78.9066 63.1253C81.2308 63.1253 83.1149 61.2412 83.1149 58.917C83.1149 56.5928 81.2308 54.7087 78.9066 54.7087C76.5824 54.7087 74.6982 56.5928 74.6982 58.917Z" fill="white"/>
            <path d="M74.6982 74.6982C74.6982 77.0224 76.5824 78.9066 78.9066 78.9066C81.2308 78.9066 83.1149 77.0224 83.1149 74.6982C83.1149 72.374 81.2308 70.4899 78.9066 70.4899C76.5824 70.4899 74.6982 72.374 74.6982 74.6982Z" fill="white"/>
            <path d="M50.5003 8.41699C52.2435 8.41699 53.6566 9.83009 53.6566 11.5732V89.4274C53.6566 91.1706 52.2435 92.5837 50.5003 92.5837C27.2583 92.5837 8.41699 73.7423 8.41699 50.5003C8.41699 27.2583 27.2583 8.41699 50.5003 8.41699Z" fill="white"/>
          </svg>
          <span
            style={{
              fontSize: 24,
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            StaticKit
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
