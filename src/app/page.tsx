'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function Home() {
  const [cmsHtml, setCmsHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const pages = await FirebaseClientService.getCmsPages()
        const page = (pages as any[]).find(p => ['home','homepage','index'].includes(String(p.slug || '').toLowerCase()) && p.is_published !== false)
        if (mounted) setCmsHtml(page?.content || null)
      } catch (e) {
        if (mounted) setCmsHtml(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 text-gray-600">Startpagina laden…</div>
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
