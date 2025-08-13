'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [cmsHtml, setCmsHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout
    
    const loadHomepage = async () => {
      try {
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Loading timeout, showing fallback homepage')
            setLoading(false)
            setFirebaseError('Timeout bij laden van pagina')
          }
        }, 3000) // Reduced timeout to 3 seconds
        
        // Try to load Firebase data
        try {
          const { FirebaseClientService } = await import('@/lib/firebase-client')
          const pages = await FirebaseClientService.getCmsPages()
          const page = pages.find((p: any) => ['home','homepage','index'].includes(String(p.slug || '').toLowerCase()) && p.is_published !== false)
          if (mounted && page && (page as any).content) {
            setCmsHtml((page as any).content)
            setFirebaseError(null)
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase error, showing fallback homepage:', firebaseError)
          setFirebaseError('Firebase verbinding mislukt')
        }
        
      } catch (e) {
        console.error('Error loading homepage:', e)
        if (mounted) {
          setFirebaseError('Onbekende fout bij laden')
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (mounted) setLoading(false)
      }
    }
    
    loadHomepage()
    
    return () => { 
      mounted = false 
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Fallback homepage content
  const fallbackContent = (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bescherm en upgrade je velgen met AlloyGator
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Duurzame velgbescherming in stijlvolle kleuren. Eenvoudig te monteren, direct resultaat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/winkel" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
                Shop nu
              </Link>
              <Link href="/vind-een-dealer" className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
                Vind een dealer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sterke bescherming</h3>
              <p className="text-gray-600">Beschermt velgen tegen stoeprandschade.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.372-.836 1.372-2.942 0-2.106a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Snel te monteren</h3>
              <p className="text-gray-600">Montage in ca. 30 minuten.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Stijlvolle kleuren</h3>
              <p className="text-gray-600">Past bij elke auto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Startpagina laden…</p>
          <p className="text-gray-400 text-sm mt-2">Dit kan enkele seconden duren</p>
          
          {firebaseError && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
              <p className="text-yellow-800 text-sm">{firebaseError}</p>
            </div>
          )}
          
          <button
            onClick={() => {
              console.log('🚀 Force fallback homepage')
              setCmsHtml(null)
              setLoading(false)
            }}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Toon Standaard Homepage
          </button>
        </div>
      </div>
    )
  }

  // Show CMS content if available, otherwise fallback
  if (cmsHtml) {
    return (
      <div 
        className="min-h-screen bg-white"
        dangerouslySetInnerHTML={{ __html: cmsHtml }}
      />
    )
  }

  // Show fallback homepage
  return fallbackContent
}
