import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AlloyGator Nederland - Professionele Velgbescherming',
    template: '%s | AlloyGator Nederland'
  },
  description: 'AlloyGator Nederland - Professionele velgbescherming tegen stoeprandschade. Complete sets voor alle velgmaten. Gratis verzending vanaf €50.',
  keywords: [
    'velgbescherming',
    'alloygator',
    'stoeprandschade',
    'velgbeschermer',
    'auto onderdelen',
    'velg bescherming',
    'alloy wheels',
    'rim protection',
    'curb damage'
  ],
  authors: [{ name: 'AlloyGator Nederland' }],
  creator: 'AlloyGator Nederland',
  publisher: 'AlloyGator Nederland',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://alloygator-nl.web.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://alloygator-nl.web.app',
    siteName: 'AlloyGator Nederland',
    title: 'AlloyGator Nederland - Professionele Velgbescherming',
    description: 'Professionele velgbescherming tegen stoeprandschade. Complete sets voor alle velgmaten.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AlloyGator Nederland - Velgbescherming',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlloyGator Nederland - Professionele Velgbescherming',
    description: 'Professionele velgbescherming tegen stoeprandschade. Complete sets voor alle velgmaten.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "AlloyGator Nederland",
              "url": "https://alloygator-nl.web.app",
              "logo": "https://alloygator-nl.web.app/logo.png",
              "description": "Professionele velgbescherming tegen stoeprandschade",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Kweekgrasstraat 36",
                "addressLocality": "Almere",
                "postalCode": "1313 BX",
                "addressCountry": "NL"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+31-85-3033400",
                "contactType": "customer service",
                "availableLanguage": "Dutch"
              },
              "sameAs": [
                "https://www.facebook.com/alloygatornl",
                "https://www.instagram.com/alloygatornl"
              ]
            })
          }}
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Bebas Neue font */}
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
        
        {/* Theme Color for Browser Tab */}
        <meta name="theme-color" content="#a2c614" />
        <meta name="msapplication-TileColor" content="#a2c614" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
