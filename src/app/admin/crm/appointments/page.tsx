'use client'

import { useEffect, useMemo, useState } from 'react'

type View = 'day' | 'week' | 'month' | 'year'

export default function AppointmentsOverviewPage() {
  const [view, setView] = useState<View>('week')
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => weekRange(new Date()))
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editAppt, setEditAppt] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/crm/appointments?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`)
        const list = res.ok ? await res.json() : []
        setItems(Array.isArray(list) ? list : [])
      } catch {
        setItems([])
      } finally { setLoading(false) }
    }
    load()
  }, [range.from, range.to])

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/crm/appointments?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`)
      const list = res.ok ? await res.json() : []
      setItems(Array.isArray(list) ? list : [])
    } finally { setLoading(false) }
  }

  const openEdit = (a: any) => {
    setEditAppt(a)
    setEditOpen(true)
  }

  const groupedByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const a of items) {
      const d = a.start_at ? new Date(a.start_at) : new Date(0)
      const key = localDateKey(d)
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    return map
  }, [items])

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Afspraken</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/crm/appointments/ics`}
            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
            title="Abonneer in Apple Agenda via webcal"
          >
            Apple Agenda koppelen
          </a>
          <select value={view} onChange={(e)=>{
            const v = e.target.value as View
            setView(v)
            if (v === 'day') setRange(dayRange(new Date()))
            else if (v === 'week') setRange(weekRange(new Date()))
            else if (v === 'month') setRange(monthRange(new Date()))
            else setRange(yearRange(new Date()))
          }} className="border rounded px-2 py-1 text-sm">
            <option value="day">Dag</option>
            <option value="week">Week</option>
            <option value="month">Maand</option>
            <option value="year">Jaar</option>
          </select>
          <button onClick={()=> {
            if (view==='day') setRange(dayRange(new Date()))
            else if (view==='week') setRange(weekRange(new Date()))
            else if (view==='month') setRange(monthRange(new Date()))
            else setRange(yearRange(new Date()))
          }} className="px-3 py-1 border rounded text-sm">Vandaag</button>
        </div>
      </div>

      {view==='day' ? (
        <div className="grid grid-cols-1 gap-3">
          {(() => {
            const d = range.from
            const key = localDateKey(d)
            const list = groupedByDay[key] || []
            return (
              <div className="bg-white rounded-lg shadow p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{d.toLocaleDateString('nl-NL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  <span className="text-xs text-gray-500">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.length === 0 && (
                    <div className="text-sm text-gray-500">Geen afspraken</div>
                  )}
                  {list.map((a:any, i:number)=> (
                    <div key={i} className="text-sm border-l-2 border-green-500 pl-2 bg-green-50 py-1 cursor-pointer hover:bg-green-100" onClick={()=> openEdit(a)}>
                      <div className="font-medium truncate">{a.title || 'Afspraak'}</div>
                      <div className="text-gray-600 truncate">{a.start_at ? new Date(a.start_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''} • {a.type || 'call'}</div>
                      {(a.location || a.meeting_url) && <div className="text-xs text-gray-500 truncate">{a.location || a.meeting_url}</div>}
                      {a.customer_id && (
                        <a href={`/admin/crm/${encodeURIComponent(a.customer_id)}`} className="text-[11px] text-green-700 hover:underline">Naar klant</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      ) : view==='week' ? (
        <div className="grid grid-cols-7 gap-3">
          {daysOfWeek(range.from).map((d) => {
            const key = localDateKey(d)
            const list = groupedByDay[key] || []
            return (
              <div key={key} className="bg-white rounded-lg shadow p-3 min-h-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{d.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                  <span className="text-xs text-gray-500">{list.length}</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {list.map((a:any, i:number)=> (
                    <div key={i} className="text-xs border-l-2 border-green-500 pl-2 bg-green-50 py-1 cursor-pointer hover:bg-green-100" onClick={()=> openEdit(a)}>
                      <div className="font-medium truncate">{a.title || 'Afspraak'}</div>
                      <div className="text-gray-600 truncate">{a.start_at ? new Date(a.start_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''} • {a.type || 'call'}</div>
                      {a.customer_id && (
                        <a href={`/admin/crm/${encodeURIComponent(a.customer_id)}`} className="text-[11px] text-green-700 hover:underline">Naar klant</a>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="text-xs text-gray-500">Laden…</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : view==='month' ? (
        <div className="grid grid-cols-7 gap-3">
          {daysOfMonth(range.from).map((d) => {
            const key = localDateKey(d)
            const list = groupedByDay[key] || []
            return (
              <div key={key} className="bg-white rounded-lg shadow p-2 min-h-[110px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] font-medium">{d.getDate()}</div>
                  <span className="text-[10px] text-gray-500">{list.length}</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {list.slice(0,3).map((a:any, i:number)=> (
                    <div key={i} className="text-[11px] border-l-2 border-green-500 pl-1 bg-green-50 py-0.5 truncate cursor-pointer hover:bg-green-100" title={a.title} onClick={()=> openEdit(a)}>
                      {a.start_at ? new Date(a.start_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''} {a.title || 'Afspraak'}
                    </div>
                  ))}
                  {list.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{list.length-3} meer</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {monthsOfYear(range.from).map((m) => {
            const monthKey = `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`
            const count = items.reduce((acc, a:any)=>{
              if (!a.start_at) return acc
              const d = new Date(a.start_at)
              const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
              return acc + (k === monthKey ? 1 : 0)
            }, 0)
            return (
              <div key={monthKey} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{m.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-500">Afspraken</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold">{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    {editOpen && editAppt && (
      <EditAppointmentModal
        appt={editAppt}
        onClose={()=> { setEditOpen(false); setEditAppt(null) }}
        onSaved={async ()=> { setEditOpen(false); setEditAppt(null); await refresh() }}
      />
    )}
    </>
  )
}

function weekRange(base: Date) {
  const d = new Date(base)
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  monday.setHours(0,0,0,0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23,59,59,999)
  return { from: monday, to: sunday }
}

function dayRange(base: Date) {
  const d = new Date(base)
  const from = new Date(d)
  from.setHours(0,0,0,0)
  const to = new Date(d)
  to.setHours(23,59,59,999)
  return { from, to }
}

function monthRange(base: Date) {
  const d = new Date(base)
  const from = new Date(d.getFullYear(), d.getMonth(), 1)
  const to = new Date(d.getFullYear(), d.getMonth()+1, 0)
  to.setHours(23,59,59,999)
  return { from, to }
}

function daysOfWeek(from: Date) {
  const days: Date[] = []
  for (let i=0;i<7;i++) {
    const d = new Date(from)
    d.setDate(from.getDate()+i)
    days.push(d)
  }
  return days
}

function daysOfMonth(from: Date) {
  const days: Date[] = []
  const year = from.getFullYear()
  const month = from.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month+1, 0)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    days.push(new Date(d))
  }
  return days
}

function yearRange(base: Date) {
  const d = new Date(base)
  const from = new Date(d.getFullYear(), 0, 1)
  const to = new Date(d.getFullYear(), 11, 31)
  to.setHours(23,59,59,999)
  return { from, to }
}

function monthsOfYear(from: Date) {
  const list: Date[] = []
  const y = from.getFullYear()
  for (let i=0;i<12;i++) {
    list.push(new Date(y, i, 1))
  }
  return list
}

function toLocalInput(dt?: string) {
  if (!dt) return ''
  try {
    const d = new Date(dt)
    const pad = (n:number)=> String(n).padStart(2,'0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth()+1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  } catch { return '' }
}

function localDateKey(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000)
  return local.toISOString().slice(0,10)
}

function EditAppointmentModal({ appt, onClose, onSaved }: { appt: any; onClose: ()=>void; onSaved: ()=>void }) {
  const initialDuration = (() => {
    try {
      const s = new Date(appt.start_at)
      const e = new Date(appt.end_at)
      const isFullDay = s.getHours()===0 && s.getMinutes()===0 && e.getHours()===23 && e.getMinutes()===59
      if (isFullDay) return 1440
      const diff = Math.max(5, Math.round((e.getTime()-s.getTime())/60000))
      return diff
    } catch { return 15 }
  })()
  const [formData, setFormData] = useState({
    title: String(appt.title || ''),
    type: String(appt.type || 'call'),
    start_at: toLocalInput(appt.start_at),
    duration_minutes: initialDuration,
    location: String(appt.location || ''),
    meeting_url: String(appt.meeting_url || ''),
    notes: String(appt.notes || ''),
    status: String(appt.status || 'gepland')
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const start = new Date(formData.start_at)
      let startIso = start.toISOString()
      let endIso: string
      if (Number(formData.duration_minutes) === 1440) {
        const s = new Date(start)
        s.setHours(0,0,0,0)
        const e = new Date(s)
        e.setHours(23,59,59,999)
        startIso = s.toISOString()
        endIso = e.toISOString()
      } else {
        const end = new Date(start.getTime() + Number(formData.duration_minutes)*60000)
        endIso = end.toISOString()
      }
      await fetch('/api/crm/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appt.id,
          title: formData.title,
          type: formData.type,
          start_at: startIso,
          end_at: endIso,
          location: formData.location,
          meeting_url: formData.meeting_url,
          notes: formData.notes,
          status: formData.status
        })
      })
      onSaved()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Afspraak bewerken</h3>
            <div className="text-xs text-gray-500 mt-0.5">ID: {appt.id} <button onClick={()=>{ navigator.clipboard.writeText(String(appt.id)); }} className="ml-2 underline">Kopieer</button></div>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Titel</label>
            <input value={formData.title} onChange={(e)=> setFormData(s=>({...s, title:e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={formData.type} onChange={(e)=> setFormData(s=>({...s, type:e.target.value}))} className="w-full border rounded px-2 py-1">
                <option value="call">Telefoon</option>
                <option value="online">Online</option>
                <option value="onsite">Op locatie</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select value={formData.status} onChange={(e)=> setFormData(s=>({...s, status:e.target.value}))} className="w-full border rounded px-2 py-1">
                <option value="gepland">Gepland</option>
                <option value="bevestigd">Bevestigd</option>
                <option value="volbracht">Volbracht</option>
                <option value="no-show">No-show</option>
                <option value="geannuleerd">Geannuleerd</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input type="datetime-local" value={formData.start_at} onChange={(e)=> setFormData(s=>({...s, start_at:e.target.value}))} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Duur</label>
              <select value={formData.duration_minutes} onChange={(e)=> setFormData(s=>({...s, duration_minutes:Number(e.target.value)}))} className="w-full border rounded px-2 py-1">
                {Array.from({ length: 36 }).map((_, idx) => {
                  const minutes = (idx + 1) * 5
                  return <option key={minutes} value={minutes}>{minutes} min</option>
                })}
                <option value={1440}>hele dag</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Locatie</label>
            <input value={formData.location} onChange={(e)=> setFormData(s=>({...s, location:e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Meeting URL</label>
            <input value={formData.meeting_url} onChange={(e)=> setFormData(s=>({...s, meeting_url:e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notities</label>
            <textarea value={formData.notes} onChange={(e)=> setFormData(s=>({...s, notes:e.target.value}))} className="w-full border rounded px-2 py-1" rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Annuleren</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">Opslaan</button>
          </div>
        </form>
      </div>
    </div>
  )
}


