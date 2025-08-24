'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { FirebaseClientService } from '@/lib/firebase-client'

type CmsPage = {
  id: string
  title: string
  slug: string
  content: string
  meta_description?: string
  is_published?: boolean
}

export default function CmsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ''
  const [page, setPage] = useState<CmsPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const all = await FirebaseClientService.getCmsPages()
        const found = (all as any[]).find(p => (p.slug || '').toLowerCase() === String(slug).toLowerCase())
        if (mounted) setPage(found || null)
        // Geen fallback meer - alleen Firestore data gebruiken
        if (mounted && !found) {
          setPage(null)
        }
      } catch (e) {
        if (mounted) setPage(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [slug])

  const title = useMemo(() => page?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), [page, slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-gray-600">Pagina laden…</div>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pagina niet gevonden</h1>
            <p className="text-gray-600 mb-4">
              De pagina "{slug}" bestaat niet in het CMS.
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-500">
                • Controleer of de pagina bestaat in het CMS
              </p>
              <p className="text-sm text-gray-500">
                • Zorg ervoor dat de status op "Gepubliceerd" staat
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          {page.is_published === false && (
            <div className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Concept</div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </div>
  )
}