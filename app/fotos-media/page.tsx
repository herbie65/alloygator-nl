'use client'

import { useEffect, useState } from 'react'

type SocialItem = {
  id: string
  platform: 'facebook' | 'instagram'
  image_url: string
  permalink: string
  caption?: string
}

export default function FotosMediaPage() {
  const [items, setItems] = useState<SocialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/social/feed', { cache: 'no-store' })
        const json = await res.json()
        setItems(Array.isArray(json.items) ? json.items : [])
        setError(json.note || null)
      } catch (e: any) {
        setError('Kon social media niet laden')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <main className="min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1>Foto's &amp; Media</h1>
          <p className="text-gray-600">Een selectie posts die wij delen op Facebook en Instagram.</p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-gray-500">Laden…</div>
          ) : items.length === 0 ? (
            <div className="p-6 rounded-xl border bg-gray-50">
              <p className="font-medium">Geen berichten beschikbaar</p>
              <p className="text-sm text-gray-600 mt-2">
                {error || 'Zodra er social media berichten beschikbaar zijn, verschijnen ze hier.'}
              </p>
              <div className="text-sm text-gray-500 mt-2">
                Configureer tokens in Admin → Instellingen: <code>facebook_page_id</code>, <code>facebook_access_token</code>, <code>instagram_user_id</code>, <code>instagram_access_token</code> of via env.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <a
                  key={it.id}
                  href={it.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-lg border bg-white"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image_url}
                      alt={it.caption || 'Social post'}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-600">
                    <span className="uppercase tracking-wide">{it.platform}</span>
                    <span className="text-gray-400">Bekijken →</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}



