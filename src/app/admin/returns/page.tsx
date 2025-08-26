"use client"

import { useEffect, useMemo, useState } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

type ReturnItem = { product_id: string; name?: string; qty_requested?: number; qty_received?: number; qty_credit?: number; qty_restock?: number; condition?: string; reason?: string }
type RMA = { id: string; rmaNumber: string; orderNumber?: string; order_id?: string; customerName?: string; email?: string; status?: string; created_at?: string; items?: ReturnItem[]; rma_log?: any[] }

export default function AdminReturnsPage() {
  const [list, setList] = useState<RMA[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [lastCredit, setLastCredit] = useState<{ number: string; url: string } | null>(null)
  const [orders, setOrders] = useState<any[]>([])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [res, ordersRes] = await Promise.all([
        fetch('/api/returns'),
        FirebaseClientService.getOrders()
      ])
      const all = res.ok ? await res.json() : []
      setList(Array.isArray(all) ? all : [])
      setOrders(Array.isArray(ordersRes) ? ordersRes : [])
    } catch (e:any) {
      setError(e.message || 'Fout bij laden retouren')
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  // Load customer details when needed
  const getCustomerDisplayName = (rma: RMA) => {
    if (rma.customerName) return rma.customerName
    if (rma.order_id) {
      const order = orders.find(o => o.id === rma.order_id)
      if (order?.customer) {
        return `${order.customer.contact_first_name || order.customer.voornaam} ${order.customer.contact_last_name || order.customer.achternaam}`
      }
    }
    return 'Onbekende klant'
  }

  // Load product details when needed
  const getProductDisplayName = (rma: RMA, productId: string) => {
    if (rma.order_id) {
      const order = orders.find(o => o.id === rma.order_id)
      if (order?.items) {
        const product = order.items.find((item: any) => (item.id || item.product_id) === productId)
        return product?.name || productId
      }
    }
    return productId
  }

  // Get order for RMA
  const getOrder = (rma: RMA) => {
    if (rma.order_id) {
      return orders.find(o => o.id === rma.order_id)
    }
    return null
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'received': return 'bg-purple-100 text-purple-800'
      case 'inspected': return 'bg-yellow-100 text-yellow-800'
      case 'credited': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open'
      case 'approved': return 'Goedgekeurd'
      case 'received': return 'Ontvangen'
      case 'inspected': return 'Geïnspecteerd'
      case 'credited': return 'Gegrediteerd'
      default: return status || 'Open'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Retouren (RMA)</h1>
          <p className="text-gray-600">Ontvangen → Inspectie → Crediteren</p>
        </div>
        <input 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder="Zoek op RMA, order of klant" 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
        />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-6">{error}</div>}
      {lastCredit && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm mb-6 flex items-center justify-between">
          <div>Creditnota <strong>{lastCredit.number}</strong> aangemaakt.</div>
          <div className="space-x-3">
            <a href={lastCredit.url} target="_blank" className="text-green-700 underline">Download</a>
            <a href="/admin/credit-invoices" className="text-green-700 underline">Bekijk alle creditfacturen</a>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Laden…</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RMA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producten</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((rma) => {
                  const order = getOrder(rma)
                  return (
                    <tr key={rma.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rma.rmaNumber}</div>
                        <div className="text-xs text-gray-500">{rma.created_at ? new Date(rma.created_at).toLocaleDateString('nl-NL') : '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rma.orderNumber || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getCustomerDisplayName(rma)}</div>
                        <div className="text-xs text-gray-500">{rma.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rma.status)}`}>
                          {getStatusText(rma.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rma.items && rma.items.length > 0 ? (
                            <div className="space-y-1">
                              {rma.items.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  {getProductDisplayName(rma, item.product_id)} - Qty: {item.qty_requested || 0}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Geen items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {rma.status === 'open' && (
                            <button 
                              onClick={() => approve(rma)} 
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Keur goed
                            </button>
                          )}
                          {rma.status === 'approved' && (
                            <button 
                              onClick={() => receive(rma)} 
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                            >
                              Ontvangen
                            </button>
                          )}
                          {rma.status === 'received' && (
                            <button 
                              onClick={() => inspect(rma)} 
                              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                            >
                              Inspectie
                            </button>
                          )}
                          {rma.status === 'inspected' && (
                            <button 
                              onClick={() => credit(rma)} 
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Creditnota
                            </button>
                          )}
                          {rma.status === 'credited' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Voltooid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {q ? 'Geen RMA\'s gevonden voor deze zoekopdracht' : 'Geen RMA\'s gevonden'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


