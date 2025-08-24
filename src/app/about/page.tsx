'use client'

import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { generateLocalBusinessData } from '../lib/structured-data'

export default function AboutPage() {
  const [cmsHtml, setCmsHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const loadAboutPage = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Probeer CMS content te laden uit Firebase
        try {
          const { FirebaseClientService } = await import('@/lib/firebase-client')
          const pages = await FirebaseClientService.getCmsPages()
          const aboutPage = pages.find((p: any) => 
            ['about', 'over-ons', 'overons'].includes(String(p.slug || '').toLowerCase()) && 
            p.is_published !== false
          )
          
          if (mounted && aboutPage && (aboutPage as any).content) {
            setCmsHtml((aboutPage as any).content)
            console.log('✅ CMS about pagina geladen:', (aboutPage as any).title)
          } else {
            console.log('⚠️ Geen gepubliceerde about pagina gevonden in CMS')
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase error bij laden CMS:', firebaseError)
          setError('CMS verbinding mislukt')
        }
      } catch (e) {
        console.error('Error loading about page:', e)
        if (mounted) {
          setError('Onbekende fout bij laden')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadAboutPage()
    
    return () => { mounted = false }
  }, [])

  // Toon loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Over ons pagina laden…</p>
          <p className="text-gray-400 text-sm mt-2">Dit kan enkele seconden duren</p>
          
          {error && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Toon CMS content als beschikbaar
  if (cmsHtml) {
    return (
      <>
        <SEO 
          title="Over Ons - AlloyGator Nederland | Dé Specialist in Velgbescherming"
          description="AlloyGator Nederland is exclusief importeur van originele velgbeschermers. Meer dan 10 jaar ervaring in de Benelux. Bescherm je lichtmetalen velgen tegen stoeprandschade."
          keywords="alloygator nederland, velgbescherming specialist, lichtmetalen velgen beschermen, stoeprandschade voorkomen, benelux importeur, autovelgen bescherming"
          canonical="/about"
          structuredData={generateLocalBusinessData()}
        />
        <div 
          className="min-h-screen bg-white"
          dangerouslySetInnerHTML={{ __html: cmsHtml }}
        />
      </>
    )
  }

  // Geen content beschikbaar - toon foutmelding
  return (
    <>
      <SEO 
        title="Over Ons - AlloyGator Nederland | Dé Specialist in Velgbescherming"
        description="AlloyGator Nederland is exclusief importeur van originele velgbeschermers. Meer dan 10 jaar ervaring in de Benelux. Bescherm je lichtmetalen velgen tegen stoeprandschade."
        keywords="alloygator nederland, velgbescherming specialist, lichtmetalen velgen beschermen, stoeprandschade voorkomen, benelux importeur, autovelgen bescherming"
        canonical="/about"
        structuredData={generateLocalBusinessData()}
      />
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Geen content beschikbaar</h1>
          <h2 className="text-2xl font-semibold text-red-600 mb-4">CMS data kon niet worden geladen</h2>
          <p className="text-lg text-gray-700 mb-6">
            Er is geen "Over Ons" pagina content gevonden in het CMS.
          </p>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-500">
              • Controleer of er een "Over Ons" pagina bestaat in het CMS
            </p>
            <p className="text-sm text-gray-500">
              • Zorg ervoor dat de status op "Gepubliceerd" staat
            </p>
            <p className="text-sm text-gray-500">
              • De slug moet exact "about" zijn
            </p>
            <p className="text-sm text-gray-500">
              • Controleer je database verbinding
            </p>
          </div>
          <div className="mt-6">
            <a 
              href="/admin/cms" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              CMS Beheren
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
