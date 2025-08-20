'use client'

import Head from 'next/head'
import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  structuredData?: any
  noIndex?: boolean
  noFollow?: boolean
}

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/media/AlloyGator_Logo.png',
  ogType = 'website',
  structuredData,
  noIndex = false,
  noFollow = false
}: SEOProps) {
  const baseUrl = 'https://alloygator-nl.web.app'
  const fullTitle = `${title} | AlloyGator - Velgen Bescherming Specialist`
  const fullDescription = `${description} Ontdek AlloyGator's premium velgen bescherming producten. Bescherm je velgen tegen krassen en beschadigingen.`
  
  // Default keywords if none provided
  const defaultKeywords = 'velgen bescherming, alloygator, velgen bescherming set, montage hulpmiddelen, velgen accessoires, auto onderdelen, velgen verzorging'
  const finalKeywords = keywords || defaultKeywords

  useEffect(() => {
    // Add structured data to page
    if (structuredData) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)
      
      return () => {
        document.head.removeChild(script)
      }
    }
  }, [structuredData])

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content="AlloyGator B.V." />
      <meta name="robots" content={noIndex ? 'noindex' : noFollow ? 'nofollow' : 'index, follow'} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`${baseUrl}${canonical}`} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical ? `${baseUrl}${canonical}` : baseUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AlloyGator" />
      <meta property="og:locale" content="nl_NL" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical ? `${baseUrl}${canonical}` : baseUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={fullDescription} />
      <meta property="twitter:image" content={`${baseUrl}${ogImage}`} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#16a34a" />
      <meta name="msapplication-TileColor" content="#16a34a" />
      
      {/* Language and Region */}
      <meta httpEquiv="Content-Language" content="nl" />
      <meta name="language" content="Dutch" />
      <meta name="geo.region" content="NL" />
      <meta name="geo.placename" content="Almere" />
      
      {/* Business Information */}
      <meta name="business:contact_data:street_address" content="Kweekgrasstraat 36" />
      <meta name="business:contact_data:locality" content="Almere" />
      <meta name="business:contact_data:postal_code" content="1313 BX" />
      <meta name="business:contact_data:country_name" content="Netherlands" />
      <meta name="business:contact_data:phone_number" content="+31853033400" />
      <meta name="business:contact_data:email" content="info@alloygator.nl" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}
