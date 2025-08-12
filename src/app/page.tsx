'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function Home() {
  const [cmsHtml, setCmsHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout
    
    ;(async () => {
      try {
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Firebase connection timeout, showing fallback homepage')
            setLoading(false)
          }
        }, 5000) // 5 second timeout
        
        const pages = await FirebaseClientService.getCmsPages()
        const page = pages.find((p: any) => ['home','homepage','index'].includes(String(p.slug || '').toLowerCase()) && p.is_published !== false)
        if (mounted) setCmsHtml((page as any)?.content || null)
      } catch (e) {
        console.error('Error loading CMS pages:', e)
        if (mounted) setCmsHtml(null)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (mounted) setLoading(false)
      }
    })()
    
    // Fallback timeout - always show fallback homepage after 6 seconds
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Fallback timeout reached, forcing fallback homepage')
        setLoading(false)
        setCmsHtml(null)
      }
    }, 6000)
    
    return () => { 
      mounted = false 
      if (timeoutId) clearTimeout(timeoutId)
      if (fallbackTimeout) clearTimeout(fallbackTimeout)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Startpagina laden…</p>
          <p className="text-gray-400 text-sm mt-2">Dit kan enkele seconden duren</p>
          {/* Debug button for testing Firebase connection */}
          <button
            onClick={async () => {
              try {
                console.log('🔍 Testing Firebase connection...')
                console.log('📍 Current location:', window.location.href)
                console.log('🌐 Environment:', process.env.NODE_ENV)
                
                const pages = await FirebaseClientService.getCmsPages()
                console.log('✅ Firebase connection successful:', pages.length, 'pages found')
                console.log('📄 CMS pages data:', pages)
                
                // Check if there's a home page
                const homePage = pages.find((p: any) => ['home','homepage','index'].includes(String(p.slug || '').toLowerCase()) && p.is_published !== false)
                if (homePage) {
                   console.log('🏠 Home page found:', homePage)
                   setCmsHtml((homePage as any).content || null)
                } else {
                   console.log('🏠 No home page found, showing fallback')
                   setCmsHtml(null)
                }
                setLoading(false)
              } catch (error) {
                console.error('❌ Firebase connection failed:', error)
                console.warn('⚠️ Showing fallback homepage due to Firebase error')
                setCmsHtml(null) // Force fallback homepage
                setLoading(false)
              }
            }}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Test Firebase Verbinding
          </button>
          <button
            onClick={() => {
              console.log('🚀 Force fallback homepage')
              setCmsHtml(null)
              setLoading(false)
            }}
            className="mt-2 ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Toon Fallback Homepage
          </button>
          <div className="mt-4 text-xs text-gray-400">
            <p>Als de pagina niet laadt, klik dan op de knop hierboven</p>
            <p>Of wacht 6 seconden voor automatische fallback</p>
            <p>Of klik op "Toon Fallback Homepage" voor directe weergave</p>
          </div>
        </div>
      </div>
    )
  }

  if (cmsHtml) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cmsHtml }} />
        </div>
      </div>
    )
  }

  // Fallback: clean default homepage
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Bescherm uw velgen met AlloyGator</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">Duurzame, stijlvolle velgbescherming. Onzichtbaar, eenvoudig te monteren.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/winkel/alloygator-set" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors">Shop nu</Link>
              <Link href="/vind-een-dealer" className="inline-block bg-gray-900 hover:bg-black text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors">Vind een dealer</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{icon:'🛡️',title:'Sterke bescherming',text:'Beschermt velgen tegen stoeprandschade.'},{icon:'🔧',title:'Snel te monteren',text:'Montage in ca. 30 minuten.'},{icon:'🎨',title:'Stijlvolle kleuren',text:'Past bij elke auto.'}].map((f)=> (
              <div key={f.title} className="text-center p-8 bg-white rounded-2xl border shadow-sm">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
