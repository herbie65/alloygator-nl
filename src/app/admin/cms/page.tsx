'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import dynamic from 'next/dynamic'
const TipTapEditor = dynamic(() => import('./TipTapEditor'), { ssr: false })
const MediaPickerModal = dynamic(() => import('../components/MediaPickerModal'), { ssr: false })

interface CMSPage {
  id: string
  title: string
  slug: string
  content: string
  meta_description?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

interface HeaderFooter {
  id: string
  type: 'header' | 'footer'
  content: string
  updated_at: string
}

export default function CMSPage() {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [headerFooter, setHeaderFooter] = useState<HeaderFooter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null)
  const [showPageModal, setShowPageModal] = useState(false)
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null)
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState(false)
  const [editingHeaderFooter, setEditingHeaderFooter] = useState<HeaderFooter | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Try to load Firebase data first
        try {
          const pagesData = await FirebaseService.getCMSPages()

          // Helpers: dedupe by slug and robust date parsing/formatting
          const parseTs = (v: any): number => {
            if (!v) return 0
            if (typeof v === 'string') { const d = new Date(v); return isNaN(+d) ? 0 : +d }
            if (v instanceof Date) return +v
            if (typeof v?.toDate === 'function') return +v.toDate()
            if (typeof v?.seconds === 'number') return v.seconds * 1000
            return 0
          }
          const dedupeBySlug = (list: any[]): any[] => {
            const map = new Map<string, any>()
            for (const p of list || []) {
              const key = String(p.slug || '').toLowerCase()
              const prev = map.get(key)
              if (!prev || parseTs(p.updated_at) >= parseTs(prev.updated_at)) {
                map.set(key, p)
              }
            }
            return Array.from(map.values())
          }

          if (pagesData && pagesData.length > 0) {
            let normalized = dedupeBySlug(pagesData as any)
            setPages(normalized)

            // Auto-fix: ensure retourvoorwaarden content contains link to /returns and PDF
            try {
              const existingRetour = normalized.find((p:any)=> (p.slug||'').toLowerCase() === 'wat-zijn-onze-retourvoorwaarden')
              if (existingRetour && existingRetour.id && typeof existingRetour.content === 'string' && !existingRetour.content.includes('/returns')) {
                const res = await fetch('/cms/wat-zijn-onze-retourvoorwaarden.html')
                if (res.ok) {
                  const html = await res.text()
                  await FirebaseService.updateCMSPage(existingRetour.id, {
                    ...existingRetour,
                    content: html,
                    updated_at: new Date().toISOString(),
                  })
                  normalized = normalized.map((p:any)=> p.id===existingRetour.id ? { ...p, content: html, updated_at: new Date().toISOString() } : p)
                  setPages(normalized)
                }
              }
            } catch (_) {}
            // Ensure 'algemene-voorwaarden' exists; if missing, seed from public HTML
            if (!pagesData.some((p: any) => (p.slug || '').toLowerCase() === 'algemene-voorwaarden')) {
              try {
                const res = await fetch('/cms/algemene-voorwaarden.html')
                if (res.ok) {
                  const html = await res.text()
                  const newPage: CMSPage = {
                    id: `seed-${Date.now()}-av`,
                    title: 'Algemene voorwaarden',
                    slug: 'algemene-voorwaarden',
                    content: html,
                    meta_description: 'Algemene voorwaarden AlloyGator',
                    is_published: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                  try {
                    const created = await FirebaseService.createCMSPage(newPage)
                    setPages(prev => dedupeBySlug([...(prev || []), created as any]))
                  } catch (_) {}
                }
              } catch (_) {}
            }
            // Ensure 'privacy-policy' exists; if missing, seed from public HTML
            if (!pagesData.some((p: any) => (p.slug || '').toLowerCase() === 'privacy-policy')) {
              try {
                const res = await fetch('/cms/privacy-policy.html')
                if (res.ok) {
                  const html = await res.text()
                  const newPage: CMSPage = {
                    id: `seed-${Date.now()}-privacy`,
                    title: 'Privacy Policy',
                    slug: 'privacy-policy',
                    content: html,
                    meta_description: 'Privacyverklaring AlloyGator',
                    is_published: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                  try {
                    const created = await FirebaseService.createCMSPage(newPage)
                    setPages(prev => dedupeBySlug([...(prev || []), created as any]))
                  } catch (_) {}
                }
              } catch (_) {}
            }
            // Ensure 'wat-zijn-onze-retourvoorwaarden' exists; if missing, seed from public HTML
            if (!pagesData.some((p: any) => (p.slug || '').toLowerCase() === 'wat-zijn-onze-retourvoorwaarden')) {
              try {
                const res = await fetch('/cms/wat-zijn-onze-retourvoorwaarden.html')
                if (res.ok) {
                  const html = await res.text()
                  const newPage: CMSPage = {
                    id: `seed-${Date.now()}-retour`,
                    title: 'Ruilen en retourneren',
                    slug: 'wat-zijn-onze-retourvoorwaarden',
                    content: html,
                    meta_description: 'Ruilen en retourneren bij AlloyGator',
                    is_published: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                  try {
                    const created = await FirebaseService.createCMSPage(newPage)
                    setPages(prev => dedupeBySlug([...(prev || []), created as any]))
                  } catch (_) {}
                }
              } catch (_) {}
            }
          } else {
            // Fallback to dummy data
            const dummyPages: CMSPage[] = [
              {
                id: '1',
                title: 'Over Ons',
                slug: 'over-ons',
                content: '<h1>Over AlloyGator</h1><p>AlloyGator is de specialist in velgbescherming...</p>',
                meta_description: 'Leer meer over AlloyGator en onze innovatieve velgbescherming oplossingen.',
                is_published: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
              },
              {
                id: '2',
                title: 'Contact',
                slug: 'contact',
                content: '<h1>Contact</h1><p>Neem contact met ons op...</p>',
                meta_description: 'Contact informatie voor AlloyGator.',
                is_published: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
              },
              {
                id: '3',
                title: 'Privacy Policy',
                slug: 'privacy-policy',
                content: '<h1>Privacy Policy</h1><p>Onze privacy policy...</p>',
                meta_description: 'Privacy policy van AlloyGator.',
                is_published: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
              }
            ]
            setPages(dummyPages)
            // Also try to seed 'algemene-voorwaarden' from static HTML when Firestore returned empty
            try {
              const res = await fetch('/cms/algemene-voorwaarden.html')
              if (res.ok) {
                const html = await res.text()
                const newPage: CMSPage = {
                  id: `seed-${Date.now()}-av`,
                  title: 'Algemene voorwaarden',
                  slug: 'algemene-voorwaarden',
                  content: html,
                  meta_description: 'Algemene voorwaarden AlloyGator',
                  is_published: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                try { await FirebaseService.createCMSPage(newPage) } catch (_) {}
                setPages(prev => [...prev, newPage])
              }
            } catch (_) {}

            // And seed 'privacy-policy' similarly
            try {
              const res2 = await fetch('/cms/privacy-policy.html')
              if (res2.ok) {
                const html2 = await res2.text()
                const newPage2: CMSPage = {
                  id: `seed-${Date.now()}-privacy`,
                  title: 'Privacy Policy',
                  slug: 'privacy-policy',
                  content: html2,
                  meta_description: 'Privacyverklaring AlloyGator',
                  is_published: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                try { const created2 = await FirebaseService.createCMSPage(newPage2); setPages(prev => [...(prev||[]), created2 as any]) } catch (_) {}
              }
            } catch (_) {}

            // And seed 'wat-zijn-onze-retourvoorwaarden' similarly
            try {
              const res3 = await fetch('/cms/wat-zijn-onze-retourvoorwaarden.html')
              if (res3.ok) {
                const html3 = await res3.text()
                const newPage3: CMSPage = {
                  id: `seed-${Date.now()}-retour`,
                  title: 'Ruilen en retourneren',
                  slug: 'wat-zijn-onze-retourvoorwaarden',
                  content: html3,
                  meta_description: 'Ruilen en retourneren bij AlloyGator',
                  is_published: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                try { const created3 = await FirebaseService.createCMSPage(newPage3); setPages(prev => [...(prev||[]), created3 as any]) } catch (_) {}
              }
            } catch (_) {}
          }

          // Load header/footer data
          const headerFooterData = await FirebaseService.getHeaderFooter()
          if (headerFooterData && headerFooterData.length > 0) {
            setHeaderFooter(headerFooterData)
          } else {
            // Fallback to dummy header/footer
            const dummyHeaderFooter: HeaderFooter[] = [
              {
                id: 'header',
                type: 'header',
                content: '<header class="bg-white shadow-lg"><nav class="max-w-7xl mx-auto px-4">...</nav></header>',
                updated_at: '2024-01-01'
              },
              {
                id: 'footer',
                type: 'footer',
                content: '<footer class="bg-gray-800 text-white"><div class="max-w-7xl mx-auto px-4">...</div></footer>',
                updated_at: '2024-01-01'
              }
            ]
            setHeaderFooter(dummyHeaderFooter)
          }
        } catch (firebaseError) {
          console.log('Firebase data not available, using dummy data')
          // Use dummy data if Firebase fails
          const dummyPages: CMSPage[] = [
            {
              id: '1',
              title: 'Over Ons',
              slug: 'over-ons',
              content: '<h1>Over AlloyGator</h1><p>AlloyGator is de specialist in velgbescherming...</p>',
              meta_description: 'Leer meer over AlloyGator en onze innovatieve velgbescherming oplossingen.',
              is_published: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-01'
            },
            {
              id: '2',
              title: 'Contact',
              slug: 'contact',
              content: '<h1>Contact</h1><p>Neem contact met ons op...</p>',
              meta_description: 'Contact informatie voor AlloyGator.',
              is_published: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-01'
            },
            {
              id: '3',
              title: 'Privacy Policy',
              slug: 'privacy-policy',
              content: '<h1>Privacy Policy</h1><p>Onze privacy policy...</p>',
              meta_description: 'Privacy policy van AlloyGator.',
              is_published: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-01'
            }
          ]
          setPages(dummyPages)

          const dummyHeaderFooter: HeaderFooter[] = [
            {
              id: 'header',
              type: 'header',
              content: '<header class="bg-white shadow-lg"><nav class="max-w-7xl mx-auto px-4">...</nav></header>',
              updated_at: '2024-01-01'
            },
            {
              id: 'footer',
              type: 'footer',
              content: '<footer class="bg-gray-800 text-white"><div class="max-w-7xl mx-auto px-4">...</div></footer>',
              updated_at: '2024-01-01'
            }
          ]
          setHeaderFooter(dummyHeaderFooter)
        }
      } catch (error) {
        console.error('Error fetching CMS data:', error)
        setError('Fout bij het laden van CMS data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSavePage = async (pageData: CMSPage) => {
    try {
      setSaving(true)
      setError('')

      if (editingPage && pageData.id) {
        // Update existing page
        try {
          await FirebaseService.updateCMSPage(pageData.id, pageData)
          setPages(prev => prev.map(p => 
            p.id === pageData.id ? pageData : p
          ))
        } catch (error) {
          console.log('Firebase update not available, local update')
          setPages(prev => prev.map(p => 
            p.id === pageData.id ? pageData : p
          ))
        }
      } else {
        // Create new page
        const newPage = {
          ...pageData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        try {
          const created = await FirebaseService.createCMSPage(newPage)
          if (created) {
            setPages(prev => [...prev, created as any])
          } else {
            setPages(prev => [...prev, newPage])
          }
        } catch (error) {
          console.log('Firebase create not available, local create')
          setPages(prev => [...prev, newPage])
        }
      }

      setShowPageModal(false)
      setSelectedPage(null)
      setEditingPage(null)
    } catch (error) {
      console.error('Error saving page:', error)
      setError('Fout bij het opslaan van pagina')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveHeaderFooter = async (headerFooterData: HeaderFooter) => {
    try {
      setSaving(true)
      setError('')

      if (editingHeaderFooter && editingHeaderFooter.id) {
        try {
          await FirebaseService.updateHeaderFooter(String(editingHeaderFooter.id), { ...headerFooterData, updated_at: new Date().toISOString() })
          setHeaderFooter(prev => prev.map(hf => hf.id === editingHeaderFooter.id ? { ...headerFooterData, id: editingHeaderFooter.id } : hf))
        } catch (error) {
          console.log('Firebase update not available, local update')
          setHeaderFooter(prev => prev.map(hf => hf.id === editingHeaderFooter.id ? { ...headerFooterData, id: editingHeaderFooter.id } : hf))
        }
      } else {
        try {
          const created = await FirebaseService.createHeaderFooter({ ...headerFooterData, updated_at: new Date().toISOString() })
          if (created) {
            setHeaderFooter(prev => [...prev, created as any])
          } else {
            setHeaderFooter(prev => [...prev, { ...headerFooterData, id: Date.now().toString(), updated_at: new Date().toISOString() }])
          }
        } catch (error) {
          console.log('Firebase create not available, local create')
          setHeaderFooter(prev => [...prev, { ...headerFooterData, id: Date.now().toString(), updated_at: new Date().toISOString() }])
        }
      }

      setShowHeaderFooterModal(false)
      setEditingHeaderFooter(null)
    } catch (error) {
      console.error('Error saving header/footer:', error)
      setError('Fout bij het opslaan van header/footer')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (confirm('Weet je zeker dat je deze pagina wilt verwijderen?')) {
      try {
        try {
          await FirebaseService.deleteCMSPage(pageId)
          setPages(prev => prev.filter(p => p.id !== pageId))
        } catch (error) {
          console.log('Firebase delete not available, local delete')
          setPages(prev => prev.filter(p => p.id !== pageId))
        }
      } catch (error) {
        console.error('Error deleting page:', error)
        setError('Fout bij het verwijderen van pagina')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">CMS data laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-600">Beheer pagina's, header en footer</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setEditingHeaderFooter(headerFooter.find(hf => hf.type === 'header') || null)
              setShowHeaderFooterModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Header Bewerken
          </button>
          <button
            onClick={() => {
              setEditingHeaderFooter(headerFooter.find(hf => hf.type === 'footer') || null)
              setShowHeaderFooterModal(true)
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Footer Bewerken
          </button>
          <button
            onClick={() => {
              setEditingPage(null)
              setShowPageModal(true)
            }}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            + Nieuwe Pagina
          </button>
          <button
            onClick={() => {
              // Open media picker modal directly for media management
              setShowMediaModal(true)
            }}
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            📁 Media Beheer
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totaal Pagina's</p>
              <p className="text-2xl font-bold text-gray-900">{pages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gepubliceerd</p>
              <p className="text-2xl font-bold text-gray-900">{pages.filter(p => p.is_published).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concept</p>
              <p className="text-2xl font-bold text-gray-900">{pages.filter(p => !p.is_published).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pagina's ({pages.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pagina
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Laatst Bijgewerkt
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page, index) => (
                <tr key={`${page.id || page.slug || 'row'}-${index}`} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                        📄
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {page.title}
                        </div>
                        {page.meta_description && (
                          <div className="text-sm text-gray-500">
                            {page.meta_description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    /{page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      page.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {page.is_published ? 'Gepubliceerd' : 'Concept'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const v: any = (page as any).updated_at
                      const d = typeof v?.toDate === 'function' ? v.toDate() : (typeof v === 'object' && typeof v?.seconds === 'number' ? new Date(v.seconds * 1000) : new Date(v))
                      return isNaN(+d) ? '-' : d.toLocaleDateString('nl-NL')
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedPage(page)
                        setShowPageModal(true)
                      }}
                      className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                    >
                      Bekijken
                    </button>
                    <button 
                      onClick={() => {
                        setEditingPage(page)
                        setShowPageModal(true)
                      }}
                      className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                    >
                      Bewerken
                    </button>
                    <button 
                      onClick={() => handleDeletePage(page.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Modal */}
      {showPageModal && (
        <PageModal
          page={selectedPage}
          editingPage={editingPage}
          onSave={handleSavePage}
          onClose={() => {
            setShowPageModal(false)
            setSelectedPage(null)
            setEditingPage(null)
          }}
          saving={saving}
        />
      )}

      {/* Header/Footer Modal */}
      {showHeaderFooterModal && (
        <HeaderFooterModal
          headerFooter={editingHeaderFooter}
          onSave={handleSaveHeaderFooter}
          onClose={() => {
            setShowHeaderFooterModal(false)
            setEditingHeaderFooter(null)
          }}
          saving={saving}
        />
      )}

      {/* Media Management Modal */}
      {showMediaModal && (
        <MediaPickerModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          onSelect={(url) => {
            // Just close the modal when selecting media in this context
            setShowMediaModal(false)
          }}
          allowUpload={true}
          title="Media Beheer - Upload en beheer afbeeldingen"
        />
      )}
    </div>
  )
}

// Page Modal Component
interface PageModalProps {
  page: CMSPage | null
  editingPage: CMSPage | null
  onSave: (page: CMSPage) => void
  onClose: () => void
  saving: boolean
}

function PageModal({ page, editingPage, onSave, onClose, saving }: PageModalProps) {
  const [formData, setFormData] = useState<CMSPage>({
    id: '',
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: false,
    created_at: '',
    updated_at: ''
  })
  const [mode, setMode] = useState<'visual' | 'source'>('visual')

  useEffect(() => {
    if (editingPage) {
      setFormData(editingPage)
      const html = editingPage.content || ''
      setMode(/<h1|<h2|<h3|<p|<div|<section|<article/i.test(html) ? 'source' : 'visual')
    } else if (page) {
      setFormData(page)
      const html = page.content || ''
      setMode(/<h1|<h2|<h3|<p|<div|<section|<article/i.test(html) ? 'source' : 'visual')
    }
  }, [page, editingPage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEditing = !!editingPage
  const isViewing = !!page && !editingPage

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Bewerk Pagina' : isViewing ? 'Pagina Details' : 'Nieuwe Pagina'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
                placeholder="over-ons"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Beschrijving
              </label>
              <textarea
                value={formData.meta_description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                rows={2}
                disabled={isViewing}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                {!isViewing && (
                  <div className="space-x-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setMode('visual')} 
                      className={`px-2 py-1 border rounded ${mode === 'visual' ? 'bg-green-600 text-white border-green-600' : 'bg-white'}`}
                    >
                      Visueel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setMode('source')} 
                      className={`px-2 py-1 border rounded ${mode === 'source' ? 'bg-green-600 text-white border-green-600' : 'bg-white'}`}
                    >
                      HTML bron
                    </button>
                  </div>
                )}
              </div>
              {mode === 'visual' ? (
                <TipTapEditor 
                  value={formData.content} 
                  onChange={(html) => setFormData(prev => ({ ...prev, content: html }))} 
                />
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  rows={15}
                  required
                  disabled={isViewing}
                  placeholder="<h1>Titel</h1><p>Content hier...</p>"
                />
              )}
              {mode === 'visual' && !isViewing && (
                <p className="text-xs text-gray-500 mt-1">
                  Let op: de visuele editor toont alleen gangbare elementen (koppen, lijsten, paragrafen, afbeeldingen). Voor complexe lay-out kun je overschakelen naar HTML.
                </p>
              )}
            </div>

            {!isViewing && (
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Gepubliceerd</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {isViewing ? 'Sluiten' : 'Annuleren'}
            </button>
            {!isViewing && (
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Opslaan...' : (isEditing ? 'Bijwerken' : 'Aanmaken')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Header/Footer Modal Component
interface HeaderFooterModalProps {
  headerFooter: HeaderFooter | null
  onSave: (headerFooter: HeaderFooter) => void
  onClose: () => void
  saving: boolean
}

function HeaderFooterModal({ headerFooter, onSave, onClose, saving }: HeaderFooterModalProps) {
  const [formData, setFormData] = useState<HeaderFooter>({
    id: '',
    type: 'header',
    content: '',
    updated_at: ''
  })
  const [mode, setMode] = useState<'visual' | 'source'>('visual')

  useEffect(() => {
    if (headerFooter) {
      setFormData(headerFooter)
      const html = headerFooter.content || ''
      setMode(/<header|<footer|<div|<section/i.test(html) ? 'source' : 'visual')
    }
  }, [headerFooter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Bewerk {headerFooter?.type === 'header' ? 'Header' : 'Footer'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Inhoud</label>
              <div className="space-x-2 text-xs">
                <button type="button" onClick={()=>setMode('visual')} className={`px-2 py-1 border rounded ${mode==='visual'?'bg-green-600 text-white border-green-600':'bg-white'}`}>Visueel</button>
                <button type="button" onClick={()=>setMode('source')} className={`px-2 py-1 border rounded ${mode==='source'?'bg-green-600 text-white border-green-600':'bg-white'}`}>HTML bron</button>
              </div>
            </div>
            {mode==='visual' ? (
              <TipTapEditor value={formData.content} onChange={(html)=> setFormData(prev => ({ ...prev, content: html }))} />
            ) : (
              <textarea
                value={formData.content}
                onChange={(e)=> setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                rows={20}
                placeholder={headerFooter?.type === 'header' ? '<header>...</header>' : '<footer>...</footer>'}
              />
            )}
            {mode==='visual' && (
              <p className="text-xs text-gray-500 mt-1">Let op: de visuele editor toont alleen gangbare elementen (koppen, lijsten, paragrafen, afbeeldingen). Voor complexe lay-out kun je overschakelen naar HTML.</p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? 'Opslaan...' : 'Bijwerken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
