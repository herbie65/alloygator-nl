'use client'

import { useEffect, useState } from 'react'

export default function MediaPage() {
  const [files, setFiles] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const listMedia = async () => {
    try {
      const res = await fetch('/api/media/list')
      const data = await res.json()
      if (res.ok && data.files) {
        setFiles(data.files.map((f:any)=> f.url))
      }
    } catch {}
  }
  useEffect(()=>{ listMedia() }, [])

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
        alert('Geüpload: ' + data.url)
        setFiles(prev => [data.url, ...prev])
      } else {
        alert('Upload mislukt: ' + (data.error || ''))
      }
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Media</h1>
        <p className="text-gray-600">Upload afbeeldingen voor gebruik in content</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((src)=> {
          const name = src.split('/').pop() as string
          return (
            <div key={src} className="border rounded p-2">
              <img src={src} alt="media" className="w-full h-24 object-cover" />
              <div className="mt-2 text-xs break-all">{name}</div>
              <div className="flex gap-2 mt-1">
                <button onClick={()=> navigator.clipboard.writeText(src)} className="text-xs text-green-700">Kopieer URL</button>
                <button onClick={async ()=> {
                  const next = prompt('Nieuwe naam (incl. extensie):', name)
                  if (!next || next === name) return
                  const res = await fetch('/api/media/rename', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ currentName: name, nextName: next }) })
                  if (res.ok) listMedia()
                }} className="text-xs text-green-700">Hernoem</button>
                <button onClick={async ()=> {
                  if (!confirm('Verwijderen?')) return
                  const res = await fetch('/api/media/delete', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name }) })
                  if (res.ok) setFiles(prev => prev.filter(u => u !== src))
                }} className="text-xs text-red-700">Verwijder</button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">Let op: voor productie adviseren we Firebase Storage; deze pagina is een basis om media te beheren.</p>
    </div>
  )
}


