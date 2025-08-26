import { MetadataRoute } from 'next'

export const dynamic = "force-static"

/**
 * Sitemap voor AlloyGator website
 * 
 * Deze sitemap bevat alle belangrijke pagina's van de website voor SEO doeleinden.
 * De sitemap wordt automatisch gegenereerd door Next.js en is beschikbaar op /sitemap.xml
 * 
 * Prioriteiten:
 * - 1.0: Homepage (hoogste prioriteit)
 * - 0.9: Winkel overzicht
 * - 0.8: Product categorieën en individuele producten
 * - 0.7: Belangrijke pagina's (over ons, contact, dealer zoeken)
 * - 0.6: Secundaire pagina's (fotos, returns, auth)
 * - 0.5: Checkout en betaling pagina's
 * - 0.4: Test en ontwikkel pagina's (laagste prioriteit)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://alloygator-nl.web.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/winkel`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/winkel/alloygator-set`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/winkel/accessoires`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/winkel/montagehulpmiddelen`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vind-een-dealer`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/fotos-media`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/forgot`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dealer-login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/checkout/cart`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/order-confirmation`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/payment/return`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/test-products`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }
  ]

  // Product pages - based on actual product structure
  const productPages = [
    {
      id: 'alloygator-set-17',
      name: 'AlloyGator Complete Set 17"',
    },
    {
      id: 'alloygator-set-18',
      name: 'AlloyGator Complete Set 18"',
    },
    {
      id: 'alloygator-set-19',
      name: 'AlloyGator Complete Set 19"',
    },
    {
      id: 'alloygator-set-20',
      name: 'AlloyGator Complete Set 20"',
    },
    {
      id: 'alloygator-set-21',
      name: 'AlloyGator Complete Set 21"',
    },
    {
      id: 'alloygator-set-22',
      name: 'AlloyGator Complete Set 22"',
    },
    {
      id: 'montage-tool-set',
      name: 'Montage Tool Set',
    },
    {
      id: 'vervangingsonderdelen-set',
      name: 'Vervangingsonderdelen Set',
    },
    {
      id: 'accessoires-set',
      name: 'Accessoires Set',
    },
    {
      id: 'montagehulpmiddelen-set',
      name: 'Montagehulpmiddelen Set',
    }
  ].map((product) => ({
    url: `${baseUrl}/winkel/product/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
} 