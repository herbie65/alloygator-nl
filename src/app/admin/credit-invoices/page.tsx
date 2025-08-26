'use client'

import { useEffect, useMemo, useState } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

type CreditRow = {
  id: string
  credit_number: string
  order_id: string
  rma_id?: string
  pdf_url?: string
  created_at: string
  eboekhouden_sync?: {
    status: 'pending' | 'success' | 'error'
    credit_mutatie_id?: string
    sync_timestamp?: string
    error_message?: string
  }
}

export default function CreditInvoicesPage() {
  const [rows, setRows] = useState<CreditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})

  const load = async () => {
    try {
      setLoading(true)
      setErr('')
      const list = await FirebaseClientService.getCollection('credit_notes')
      const mapped = (Array.isArray(list) ? list : []).map((d:any) => ({ id: d.id, ...(d.data || d) }))
      mapped.sort((a:any,b:any)=> new Date(b.created_at||0).getTime() - new Date(a.created_at||0).getTime())
      setRows(mapped)
    } catch (e:any) {
      setErr(e.message || 'Fout bij laden creditfacturen')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(()=> {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r =>
      (r.credit_number||'').toLowerCase().includes(s) ||
      (r.order_id||'').toLowerCase().includes(s) ||
      (r.rma_id||'').toLowerCase().includes(s)
    )
  }, [rows, q])

  const syncCredit = async (creditId: string) => {
    setSyncing(prev => ({ ...prev, [creditId]: true }))
    try {
      const res = await fetch('/api/accounting/sync-credit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creditId }) })
      const data = await res.json().catch(()=>({ ok: false }))
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Sync mislukt')
      await load()
    } catch (e:any) {
      setErr(e.message || 'Sync mislukt')
    } finally { setSyncing(prev => ({ ...prev, [creditId]: false })) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creditfacturen</h1>
          <p className="text-gray-600">Overzicht van aangemaakte creditnota's</p>
        </div>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Zoek op creditnr., order of RMA" className="px-3 py-2 border rounded" />
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{err}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creditnr.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">e‑Boekhouden</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td className="px-6 py-4" colSpan={5}>Laden…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-6 py-6 text-gray-500" colSpan={5}>Geen creditfacturen gevonden</td></tr>
            ) : filtered.map((r)=> (
              <tr key={r.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.credit_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.order_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.rma_id || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.created_at ? new Date(r.created_at).toLocaleDateString('nl-NL') : '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {!r.eboekhouden_sync ? (
                    <button onClick={()=>syncCredit(r.id)} disabled={!!syncing[r.id]} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm">
                      {syncing[r.id] ? '⏳ Sync…' : '📊 Sync'}
                    </button>
                  ) : r.eboekhouden_sync.status === 'success' ? (
                    <div className="text-xs text-green-700">
                      <div className="font-medium">✅ Gesynchroniseerd</div>
                      {r.eboekhouden_sync.credit_mutatie_id && (<div>ID: {r.eboekhouden_sync.credit_mutatie_id}</div>)}
                      <div className="text-gray-500">{new Date(r.eboekhouden_sync.sync_timestamp || '').toLocaleDateString('nl-NL')}</div>
                    </div>
                  ) : r.eboekhouden_sync.status === 'error' ? (
                    <div className="text-xs text-red-700">
                      <div className="font-medium">❌ Sync mislukt</div>
                      {r.eboekhouden_sync.error_message && (<div className="text-red-600 text-xs mb-1">{r.eboekhouden_sync.error_message}</div>)}
                      <button onClick={()=>syncCredit(r.id)} disabled={!!syncing[r.id]} className="mt-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-xs">{syncing[r.id] ? '⏳ Retry…' : '🔄 Retry'}</button>
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {r.pdf_url ? (
                    <a href={r.pdf_url} target="_blank" className="text-green-600 hover:text-green-800">Download</a>
                  ) : (
                    <a href={`/api/credit-invoices/${r.id}/pdf`} target="_blank" className="text-blue-600 hover:text-blue-800">Genereer PDF</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


