'use client'

import { useEffect, useState } from 'react'

interface MediaItem {
  name: string
  url: string
  size?: number
  mtime?: number
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowUpload = true,
  title = 'Kies uit Media'
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  allowUpload?: boolean
  title?: string
}) {
  const [files, setFiles] = useState<MediaItem[]>([])
  const [filtered, setFiltered] = useState<MediaItem[]>([])
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/media/list')
      const data = await res.json()
      if (res.ok && Array.isArray(data.files)) {
        setFiles(data.files)
        setFiltered(data.files)
      }
    } catch (e) {
      console.error('Media load error', e)
    }
  }

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen])

  useEffect(() => {
    if (!query) return setFiltered(files)
    const q = query.toLowerCase()
    setFiltered(files.filter(f => f.name.toLowerCase().includes(q)))
  }, [query, files])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        await load()
      } else {
        alert('Upload mislukt: ' + (data.error || ''))
      }
    } finally { setUploading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Zoeken op bestandsnaam…"
              value={query}
              onChange={(e)=> setQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {allowUpload && (
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                {uploading ? 'Uploaden…' : 'Uploaden'}
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((f) => (
              <button
                key={f.url}
                className="border rounded p-2 hover:shadow focus:outline-none focus:ring-2 focus:ring-green-500 text-left"
                onClick={() => { onSelect(f.url); onClose() }}
              >
                <img src={f.url} alt={f.name} className="w-full h-28 object-cover rounded" />
                <div className="mt-2 text-xs break-all">{f.name}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 col-span-full">Geen bestanden gevonden</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




