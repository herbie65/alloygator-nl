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
// TODO: Vervang door database calls naar company_settings collection
export function generateLocalBusinessData() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AlloyGator B.V.", // TODO: uit database
    "description": "Specialist in velgen bescherming en auto accessoires", // TODO: uit database
    "url": "https://alloygator-nl.web.app", // TODO: uit database
    "logo": "https://alloygator-nl.web.app/media/AlloyGator_Logo.png", // TODO: uit database
    "image": "https://alloygator-nl.web.app/media/AlloyGator_Logo.png", // TODO: uit database
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kweekgrasstraat 36", // TODO: uit database
      "addressLocality": "Almere", // TODO: uit database
      "postalCode": "1313 BX", // TODO: uit database
      "addressCountry": "NL" // TODO: uit database
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "52.3508", // TODO: uit database
      "longitude": "5.2647" // TODO: uit database
    },
    "telephone": "+31853033400", // TODO: uit database
    "email": "info@alloygator.nl", // TODO: uit database
    "openingHours": [ // TODO: uit database
      "Mo-Fr 08:30-17:00"
    ],
    "priceRange": "€€", // TODO: uit database
    "currenciesAccepted": "EUR", // TODO: uit database
    "paymentAccepted": "Cash, Credit Card, Bank Transfer", // TODO: uit database
    "areaServed": "Netherlands", // TODO: uit database
    "serviceArea": {
      "@type": "Country",
      "name": "Netherlands" // TODO: uit database
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Velgen Bescherming Producten", // TODO: uit database
      "itemListElement": [ // TODO: uit database - dynamische producten
        // Lege array - geen hardcoded producten meer
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
