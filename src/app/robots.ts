import { MetadataRoute } from 'next'

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/checkout/',
        '/account/',
        '/auth/',
        '/cart',
        '/wishlist',
        '/order-confirmation/',
        '/payment/',
      ],
    },
    sitemap: 'https://alloygator-nl.web.app/sitemap.xml',
  }
} 