"use client"

import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '@/app/admin/components/AdminSidebar'
import { FirebaseClientService } from '@/lib/firebase-client'

type ReturnItem = { product_id: string; name?: string; qty_requested?: number; qty_received?: number; qty_credit?: number; qty_restock?: number; condition?: string; reason?: string }
type RMA = { id: string; rmaNumber: string; orderNumber?: string; order_id?: string; customerName?: string; email?: string; status?: string; created_at?: string; items?: ReturnItem[]; rma_log?: any[] }

export default function AdminReturnsPage() {
  const [activeTab, setActiveTab] = useState('returns')
  const [list, setList] = useState<RMA[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<RMA | null>(null)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any | null>(null)
  const [lastCredit, setLastCredit] = useState<{ number: string; url: string } | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/returns')
      const all = res.ok ? await res.json() : []
      setList(Array.isArray(all) ? all : [])
    } catch (e:any) {
      setError(e.message || 'Fout bij laden retouren')
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  // Load linked order when a RMA is selected
  useEffect(()=>{
    const fetchOrder = async () => {
      try {
        setOrder(null)
        if (!selected?.orderNumber) return
        const all = await FirebaseClientService.getOrders()
        const found = (Array.isArray(all) ? all : []).find((o:any)=> (o.orderNumber || o.order_number || o.id) === selected.orderNumber)
        setOrder(found || null)
      } catch {}
    }
    fetchOrder()
  }, [selected?.id])

  // Load customer details when needed
  const getCustomerDisplayName = (rma: RMA) => {
    if (rma.customerName) return rma.customerName
    if (rma.customer_id && order?.customer) {
      return `${order.customer.contact_first_name || order.customer.voornaam} ${order.customer.contact_last_name || order.customer.achternaam}`
    }
    return 'Onbekende klant'
  }

  // Load product details when needed
  const getProductDisplayName = (productId: string) => {
    if (!order?.items) return productId
    const product = order.items.find((item: any) => (item.id || item.product_id) === productId)
    return product?.name || productId
  }

  const filtered = useMemo(()=> {
    const s = q.trim().toLowerCase()
    return list.filter(r=> !s || r.rmaNumber?.toLowerCase().includes(s) || r.orderNumber?.toLowerCase().includes(s) || r.customerName?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s))
  }, [list, q])

  const call = async (path: string, body: any) => {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.error || 'Request mislukt')
    await load()
  }

  const approve = async (r: RMA) => { await call('/api/returns/approve', { rmaId: r.id }) }
  const receive = async (r: RMA) => {
    const rows = (r.items||[]).map(it=> ({ product_id: it.product_id, qty_received: Number(it.qty_received || 0) }))
    await call('/api/returns/receive', { rmaId: r.id, items: rows })
  }
  const inspect = async (r: RMA) => {
    const rows = (r.items||[]).map(it=> ({ product_id: it.product_id, qty_credit: Number(it.qty_credit || 0), qty_restock: Number(it.qty_restock || 0), condition: it.condition, reason: it.reason }))
    await call('/api/returns/inspect', { rmaId: r.id, items: rows })
  }
  const credit = async (r: RMA) => {
    // Debug: log de RMA data
    console.log('RMA data voor creditnota:', r)
    console.log('order_id:', r.order_id)
    console.log('orderNumber:', r.orderNumber)
    
    // Bepaal te crediteren items: voorkeur qty_credit, anders qty_received, anders qty_requested
    const prepared = (r.items||[]).map(it => ({
      product_id: it.product_id,
      quantity: Number(it.qty_credit ?? it.qty_received ?? it.qty_requested ?? 0)
    }))
    const items = prepared.filter(it => it.quantity > 0)
    if (items.length === 0) {
      alert('Geen te crediteren aantallen bekend. Voer eerst Inspectie uit of vul credit-aantallen in.')
      return
    }
    
    // Gebruik order_id (dit is de juiste referentie voor database lookup)
    const orderId = r.order_id
    if (!orderId) {
      alert('RMA heeft geen geldige order referentie. Kan geen creditnota aanmaken.')
      return
    }
    console.log('Gebruikte orderId:', orderId)
    
    const res = await fetch('/api/returns/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rmaId: r.id, items, restock: true })
    })
    if (!res.ok) {
      const msg = await res.text().catch(()=> '')
      throw new Error('Creditnota aanmaken mislukt' + (msg ? `: ${msg}` : ''))
    }
    const payload = await res.json().catch(()=>null)
    const credit = payload?.credit || {}
    if (credit?.credit_number && credit?.url) setLastCredit({ number: credit.credit_number, url: credit.url })
    await load()
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Retouren (RMA)</h1>
              <p className="text-gray-600">Ontvangen → Inspectie → Crediteren</p>
            </div>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Zoek op RMA, order of klant" className="px-3 py-2 border rounded" />
          </div>
          <div></div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">{error}</div>}
        {lastCredit && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3 text-sm mb-4 flex items-center justify-between">
            <div>Creditnota <strong>{lastCredit.number}</strong> aangemaakt.</div>
            <div className="space-x-3">
              <a href={lastCredit.url} target="_blank" className="text-green-700 underline">Download</a>
              <a href="/admin/credit-invoices" className="text-green-700 underline">Bekijk alle creditfacturen</a>
            </div>
          </div>
        )}

        {loading ? <div>Laden…</div> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded shadow">
              <ul className="divide-y">
                {filtered.map((r)=> (
                  <li key={r.id} className={`p-4 cursor-pointer ${selected?.id===r.id?'bg-green-50':''}`} onClick={()=>setSelected(r)}>
                    <div className="font-medium">{r.rmaNumber}</div>
                    <div className="text-xs text-gray-500">Order: {r.orderNumber || '—'}</div>
                    <div className="text-xs text-gray-500">{getCustomerDisplayName(r)} • {r.email}</div>
                    <div className="text-xs mt-1"><span className="px-2 py-0.5 rounded bg-gray-100">{r.status || 'requested'}</span></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2 bg-white rounded shadow p-4">
              {!selected ? <div className="text-gray-600">Selecteer een RMA links</div> : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">{selected.rmaNumber}</div>
                      <div className="text-sm text-gray-600">Order: {selected.orderNumber || '—'}</div>
                    </div>
                    <div className="space-x-2">
                      <button onClick={()=>approve(selected)} className="px-3 py-1 bg-blue-600 text-white rounded">Keur goed</button>
                      <button onClick={()=>receive(selected)} className="px-3 py-1 bg-indigo-600 text-white rounded">Ontvangen opslaan</button>
                      <button onClick={()=>inspect(selected)} className="px-3 py-1 bg-yellow-600 text-white rounded">Inspectie opslaan</button>
                      <button onClick={()=>credit(selected)} className="px-3 py-1 bg-green-600 text-white rounded">Creditnota</button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Originele orderregels hieronder; vul links de ontvangen aantallen, en bij Inspectie de te crediteren aantallen en restock.</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">Product</th>
                        <th className="py-2">Besteld</th>
                        <th className="py-2">Ontvangen</th>
                        <th className="py-2">Credit</th>
                        <th className="py-2">Restock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order?.items || selected.items || []).map((row:any,idx:number)=> {
                        // Find matching RMA line
                        const rline = (selected.items||[]).find((x:any)=> String(x.product_id) === String(row.id || row.productId || row.product_id)) || { product_id: String(row.id || row.productId || ''), name: row.name, qty_requested: row.quantity || 0, qty_received: 0, qty_credit: 0, qty_restock: 0 }
                        const updateRma = (patch: Partial<ReturnItem>) => {
                          setSelected(prev => prev ? ({...prev, items: (()=>{
                            const cur = Array.isArray(prev.items) ? [...prev.items] : []
                            const i = cur.findIndex((x:any)=> String(x.product_id) === String(rline.product_id))
                            const merged = { ...rline, ...patch }
                            if (i >= 0) cur[i] = merged; else cur.push(merged)
                            return cur
                          })() }) : prev)
                        }
                        return (
                          <tr key={idx} className="border-b">
                            <td className="py-2">{row.name || rline.name || rline.product_id}</td>
                            <td className="py-2">{row.quantity || rline.qty_requested || 0}</td>
                            <td className="py-2">
                              <input type="number" min={0} className="w-20 border rounded px-2 py-1" value={rline.qty_received || 0} onChange={(e)=>updateRma({ qty_received: Math.max(0, Number(e.target.value||0)) })} />
                            </td>
                            <td className="py-2">
                              <input type="number" min={0} className="w-20 border rounded px-2 py-1" value={rline.qty_credit || 0} onChange={(e)=>updateRma({ qty_credit: Math.max(0, Number(e.target.value||0)) })} />
                            </td>
                            <td className="py-2">
                              <input type="number" min={0} className="w-20 border rounded px-2 py-1" value={rline.qty_restock || 0} onChange={(e)=>updateRma({ qty_restock: Math.max(0, Number(e.target.value||0)) })} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


