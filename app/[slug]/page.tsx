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
        // If Firestore version is missing critical links, try static HTML override
        try {
          const res = await fetch(`/cms/${slug}.html`)
          if (res.ok) {
            const html = await res.text()
            const needsLink = !(found?.content || '').includes('/returns')
            const hasLinkInStatic = html.includes('/returns')
            if (mounted && hasLinkInStatic && needsLink) {
              const override = {
                id: found?.id || `static-${slug}`,
                title: found?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                slug: String(slug),
                content: html,
                is_published: true,
              } as any
              setPage(override)
              // Try to update Firestore so CMS shows the corrected version next time
              try {
                if (found?.id) {
                  await FirebaseClientService.updateDocumentInCollection('cms_pages', found.id, {
                    content: html,
                    updated_at: new Date().toISOString(),
                  })
                }
              } catch (_) {}
            }
          }
        } catch (_) {}
        // Fallback: try static HTML in /public/cms/{slug}.html when not found in Firestore
        if (mounted && !found) {
          try {
            const res = await fetch(`/cms/${slug}.html`)
            if (res.ok) {
              const html = await res.text()
              if (html && html.trim().length > 0) {
                // Derive a reasonable title from first heading or slug
                const headingMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<h2[^>]*>(.*?)<\/h2>/i)
                const derivedTitle = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '') : undefined
                const fallback: CmsPage = {
                  id: `static-${slug}`,
                  title: derivedTitle || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                  slug: String(slug),
                  content: html,
                  is_published: true,
                }
                if (mounted) setPage(fallback)
                // Do not auto-seed here to prevent duplicate entries; CMS admin seeds if missing.
              }
            }
          } catch (_) {
            // ignore fallback errors
          }
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
          <div className="bg-white rounded-lg shadow-md p-8 text-gray-600">Pagina niet gevonden.</div>
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