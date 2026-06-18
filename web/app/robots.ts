import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zhishuai.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/agent/', '/api/', '/payment/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
