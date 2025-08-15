'use client'

import { useState, useEffect } from 'react'

interface CMSPage {
  id: string
  title: string
  slug: string
  content: string
  meta_description?: string
  is_published?: boolean
  created_at?: string
  updated_at?: string
}

export default function HomePage() {
  const [cmsHtml, setCmsHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const loadHomePage = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Starten met laden van home pagina...')
        
        // Probeer CMS content te laden uit Firebase
        try {
          const { FirebaseClientService } = await import('@/lib/firebase-client')
          console.log('📡 Firebase service geladen, ophalen van CMS pagina\'s...')
          
          const pages = await FirebaseClientService.getCmsPages() as CMSPage[]
          console.log('📄 Alle CMS pagina\'s opgehaald:', pages.length)
          
          // Zoek naar home pagina's - geef voorkeur aan de meest recente
          const homePages = pages.filter((p: CMSPage) => 
            String(p.slug || '').toLowerCase() === 'home' && 
            p.is_published !== false
          )
          
          console.log(`🎯 Gevonden ${homePages.length} home pagina's:`, homePages.map(p => ({ id: p.id, title: p.title, updated: p.updated_at })))
          
          if (homePages.length > 0) {
            // Kies de meest recente home pagina
            const homePage = homePages.sort((a: CMSPage, b: CMSPage) => {
              const dateA = new Date(a.updated_at || a.created_at || 0)
              const dateB = new Date(b.updated_at || b.created_at || 0)
              return dateB.getTime() - dateA.getTime()
            })[0]
            
            console.log('✅ Gekozen home pagina:', homePage.title, '(ID:', homePage.id, ')')
            console.log('📝 Content lengte:', homePage.content?.length)
            
            if (mounted && homePage.content) {
              setCmsHtml(homePage.content)
            } else {
              console.log('⚠️ Home pagina heeft geen content')
            }
          } else {
            console.log('⚠️ Geen gepubliceerde home pagina gevonden in CMS')
            console.log('🔍 Zoekcriteria: slug === "home" en is_published !== false')
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase error bij laden CMS:', firebaseError)
          setError('CMS verbinding mislukt')
        }
      } catch (e) {
        console.error('Error loading home page:', e)
        if (mounted) {
          setError('Onbekende fout bij laden')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadHomePage()
    
    return () => { mounted = false }
  }, [])

  // Post-process CMS HTML om Bebas toe te passen op hero-teksten
  useEffect(() => {
    if (!cmsHtml) return
    const root = document.getElementById('cms-home')
    if (!root) return
    const headings = root.querySelectorAll('h1, h2')
    const matches = [
      'uw ultieme lichtmetalen schild',
      'tegen kostbare stoeprandschade',
      'bescherm en upgrade je velgen met alloygator',
    ]
    headings.forEach((el) => {
      const t = (el.textContent || '').toLowerCase()
      if (matches.some((m) => t.includes(m))) {
        el.classList.add('font-bebas', 'uppercase', 'tracking-wide')
      }
    })
    // Zet altijd de eerste H1 in Bebas voor hero-stijl
    const firstH1 = root.querySelector('h1')
    if (firstH1) firstH1.classList.add('font-bebas', 'uppercase', 'tracking-wide')

    // Hero video(s): vergroot naar 150%, crop en maak donkerder
    const videos = Array.from(root.querySelectorAll('video')) as HTMLVideoElement[]
    videos.forEach((vid) => {
      vid.style.width = '100%'
      vid.style.height = '150%'
      vid.style.objectFit = 'cover'
      vid.style.display = 'block'
      // Donkerder maken
      vid.style.filter = 'brightness(0.55)'
      const parent = vid.parentElement
      if (parent && !parent.style.overflow) parent.style.overflow = 'hidden'
    })
  }, [cmsHtml])

  // Toon loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Home pagina laden…</p>
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
    console.log('🎨 Rendering CMS content met lengte:', cmsHtml.length)
    return (
      <div id="cms-home" className="min-h-screen bg-white" dangerouslySetInnerHTML={{ __html: cmsHtml }} />
    )
  }

  // Geen content beschikbaar - toon fallback
  console.log('❌ Geen CMS content gevonden, toon fallback')
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🏠</div>
        <h1 className="text-2xl md:text-5xl font-bebas uppercase tracking-wide text-gray-900 mb-4">Uw ultieme lichtmetalen schild</h1>
        <h2 className="text-xl md:text-3xl font-bebas uppercase tracking-wide text-gray-700 mb-6">tegen kostbare stoeprandschade</h2>
        <p className="text-gray-600 mb-6">
          Er is geen home pagina content gevonden in het CMS.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            • Controleer of er een home pagina bestaat in het CMS
          </p>
          <p className="text-sm text-gray-500">
            • Zorg ervoor dat de status op "Gepubliceerd" staat
          </p>
          <p className="text-sm text-gray-500">
            • De slug moet exact "home" zijn
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
  )
}
