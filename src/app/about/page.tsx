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

  // Geen content beschikbaar - toon fallback
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
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">Over Ons</h1>
              <h2 className="text-2xl font-semibold text-green-600 mb-4">Dé specialist in velgbescherming voor de Benelux</h2>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                AlloyGator Nederland is exclusief importeur en distributeur van de originele AlloyGator velgbeschermers. 
                Vanuit onze vestiging in Almere bedienen wij al meer dan 10 jaar zowel particuliere als zakelijke klanten in Nederland, België en Luxemburg. 
                Onze missie is helder: je lichtmetalen velgen beschermen tegen stoeprandschade, zonder in te leveren op uitstraling.
              </p>
              
              <p className="text-lg text-gray-700 mb-6">
                Onze producten combineren stijl met functionaliteit. Of je nu kiest voor een discrete kleur of juist wilt opvallen met een opvallende tint 
                die past bij je autolak, remklauwen of bedrijfslogo — met AlloyGator geef je je auto een persoonlijke én beschermende upgrade.
              </p>
              
              <p className="text-lg text-gray-700 mb-6">
                Dankzij ons uitgebreide netwerk van professionele dealers en montagepartners ben je altijd verzekerd van vakkundige service in jouw regio. 
                Kies voor duurzaamheid, stijl en zekerheid. Kies voor AlloyGator.
              </p>
            </div>
            
            <div className="mt-12 bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Waarom kiezen voor AlloyGator?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Meer dan 10 jaar ervaring in de Benelux</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-green-600 text-xl">✓</div>
                  <span className="text-gray-700">Exclusief importeur van originele producten</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Uitgebreid netwerk van erkende dealers</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Professionele montage en service</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
