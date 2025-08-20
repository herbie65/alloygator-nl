// Structured Data (JSON-LD) helpers voor SEO optimalisatie

export interface OrganizationData {
  name: string
  url: string
  logo: string
  description: string
  address: {
    streetAddress: string
    addressLocality: string
    postalCode: string
    addressCountry: string
  }
  contactPoint: {
    telephone: string
    contactType: string
    email: string
  }
  sameAs: string[]
}

export interface ProductData {
  name: string
  description: string
  image: string
  url: string
  brand: string
  category: string
  price?: number
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
}

export interface BreadcrumbData {
  items: Array<{
    name: string
    url: string
  }>
}

export interface WebPageData {
  name: string
  description: string
  url: string
  breadcrumb?: BreadcrumbData
}

// Organization structured data
export function generateOrganizationData(data: OrganizationData) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.name,
    "url": data.url,
    "logo": data.logo,
    "description": data.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address.streetAddress,
      "addressLocality": data.address.addressLocality,
      "postalCode": data.address.postalCode,
      "addressCountry": data.address.addressCountry
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": data.contactPoint.telephone,
      "contactType": data.contactPoint.contactType,
      "email": data.contactPoint.email
    },
    "sameAs": data.sameAs,
    "foundingDate": "2020",
    "areaServed": "Netherlands",
    "serviceArea": {
      "@type": "Country",
      "name": "Netherlands"
    }
  }
}

// Product structured data
export function generateProductData(data: ProductData) {
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.name,
    "description": data.description,
    "image": data.image,
    "url": data.url,
    "brand": {
      "@type": "Brand",
      "name": data.brand
    },
    "category": data.category,
    "offers": {
      "@type": "Offer",
      "url": data.url,
      "availability": data.availability || "InStock"
    }
  }

  if (data.price) {
    structuredData.offers.price = data.price
    structuredData.offers.priceCurrency = data.priceCurrency || "EUR"
  }

  if (data.aggregateRating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": data.aggregateRating.ratingValue,
      "reviewCount": data.aggregateRating.reviewCount
    }
  }

  return structuredData
}

// Breadcrumb structured data
export function generateBreadcrumbData(data: BreadcrumbData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": data.items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
}

// WebPage structured data
export function generateWebPageData(data: WebPageData) {
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": data.name,
    "description": data.description,
    "url": data.url
  }

  if (data.breadcrumb) {
    structuredData.breadcrumb = generateBreadcrumbData(data.breadcrumb)
  }

  return structuredData
}

// Local Business structured data
export function generateLocalBusinessData() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AlloyGator B.V.",
    "description": "Specialist in velgen bescherming en auto accessoires",
    "url": "https://alloygator-nl.web.app",
    "logo": "https://alloygator-nl.web.app/media/AlloyGator_Logo.png",
    "image": "https://alloygator-nl.web.app/media/AlloyGator_Logo.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kweekgrasstraat 36",
      "addressLocality": "Almere",
      "postalCode": "1313 BX",
      "addressCountry": "NL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "52.3508",
      "longitude": "5.2647"
    },
    "telephone": "+31853033400",
    "email": "info@alloygator.nl",
    "openingHours": [
      "Mo-Fr 08:30-17:00"
    ],
    "priceRange": "€€",
    "currenciesAccepted": "EUR",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer",
    "areaServed": "Netherlands",
    "serviceArea": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Velgen Bescherming Producten",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "AlloyGator Complete Set",
            "description": "Complete velgen bescherming set"
          }
        }
      ]
    }
  }
}

// FAQ structured data
export function generateFAQData(questions: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  }
}
