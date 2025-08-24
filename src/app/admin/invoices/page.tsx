'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'
import Modal from '@/app/admin/components/Modal'

interface Invoice {
  id: string
  invoice_number: string
  order_id?: string
  customer: { 
    contact_first_name?: string
    contact_last_name?: string
    voornaam?: string
    achternaam?: string
    email?: string 
  }
  amount: number
  vat_amount: number
  total: number
  status: 'open' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  paid_at?: string
}

interface OrderRow {
  id: string
  orderNumber: string
  customer: { 
    contact_first_name?: string
    contact_last_name?: string
    voornaam?: string
    achternaam?: string
    email?: string 
  }
  subtotal: number
  vat_amount: number
  shipping_cost: number
  total: number
  createdAt: string
  invoice_number?: string
  invoice_url?: string
  eboekhouden_sync?: {
    status: 'pending' | 'success' | 'error'
    verkoop_mutatie_id?: string
    cogs_mutatie_id?: string
    error_message?: string
    sync_timestamp?: string
  }
}

export default function InvoicesPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [onlyWithoutInvoice, setOnlyWithoutInvoice] = useState(false)
  const [err, setErr] = useState('')
  const [syncingOrders, setSyncingOrders] = useState<Record<string, boolean>>({})
  const [debugOpenId, setDebugOpenId] = useState<string | null>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [debugModalOpen, setDebugModalOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setErr('')
        
        // Laad facturen uit de invoices collection
        const invoices = await FirebaseClientService.getInvoices()
        console.log('Debug: Geladen facturen:', invoices)
        
        const rows = (Array.isArray(invoices) ? invoices : []).map((inv:any)=> ({
          id: inv.id,
          orderNumber: inv.order_number || inv.orderNumber || inv.order_id || '—',
          customer: inv.customer || {},
          subtotal: Number(inv.subtotal || 0),
          vat_amount: Number(inv.vat_amount || 0),
          shipping_cost: Number(inv.shipping_cost || 0),
          total: Number(inv.total || 0),
          createdAt: inv.created_at || inv.createdAt || new Date().toISOString(),
          invoice_number: inv.invoice_number,
          invoice_url: `/api/invoices/${inv.id}/pdf`, // Genereer download URL
          eboekhouden_sync: inv.eboekhouden_sync || undefined
        }))
        
        // Most recent first
        rows.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(rows)
      } catch (e:any) {
        console.error('Error loading invoices:', e)
        setErr(e.message || 'Fout bij laden facturen')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(()=> {
    const base = orders
      .filter(o=> !!(o.invoice_number || o.invoice_url)) // only with invoice
    return base.filter(o=> {
      if (onlyWithoutInvoice && o.invoice_number) return false
      const s = q.trim().toLowerCase()
      if (!s) return true
      const name = `${o.customer?.contact_first_name || o.customer?.voornaam || ''} ${o.customer?.contact_last_name || o.customer?.achternaam || ''}`.trim().toLowerCase()
      return (
        o.orderNumber.toLowerCase().includes(s) ||
        name.includes(s) ||
        (o.customer?.email||'').toLowerCase().includes(s)
      )
    })
  }, [orders, q, onlyWithoutInvoice])

  const generateInvoice = async (orderId: string) => {
    try {
      setErr('')
      const token = (process.env.NEXT_PUBLIC_ADMIN_INVOICE_TOKEN || '')
      const url = `/api/invoices/generate?id=${encodeURIComponent(orderId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data?.error || 'Kon factuur niet genereren')
      }
      const blob = await res.blob()
      const fileUrl = URL.createObjectURL(blob)
      window.open(fileUrl, '_blank')
      // Refresh list to pick up invoice_url/number if backend set them
      try {
        const list = await FirebaseClientService.getOrders()
        const rows = (Array.isArray(list) ? list : []).map((o:any)=> ({
          id: o.id,
          orderNumber: o.orderNumber || o.order_number || o.id,
          customer: o.customer || {},
          subtotal: Number(o.subtotal || 0),
          vat_amount: Number(o.vat_amount || 0),
          shipping_cost: Number(o.shipping_cost || 0),
          total: Number(o.total || 0),
          createdAt: o.createdAt || o.created_at || new Date().toISOString(),
          invoice_number: o.invoice_number,
          invoice_url: o.invoice_url,
          eboekhouden_sync: o.eboekhouden_sync || undefined
        }))
        rows.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(rows)
      } catch {}
    } catch (e:any) {
      setErr(e.message || 'Fout bij genereren factuur')
    }
  }

  const syncToEboekhouden = async (orderId: string) => {
    setSyncingOrders(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch('/api/accounting/sync-order-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      // Altijd debug-informatie beschikbaar maken
      setDebugOpenId(orderId)
      setDebugData({
        request: { url: '/api/accounting/sync-order-new', method: 'POST', body: { orderId } },
        status: response.status,
        ok: response.ok,
        response: result,
      })
      setDebugModalOpen(true)

      if (result.ok) {
        // Update local state with sync results
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? {
                  ...order,
                  eboekhouden_sync: {
                    status: 'success',
                    verkoop_mutatie_id: result.verkoop_mutatie_id,
                    cogs_mutatie_id: result.cogs_mutatie_id,
                    sync_timestamp: new Date().toISOString(),
                    error_message: null
                  }
                }
              : order
          )
        );
      } else {
        // Update local state with error
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? {
                  ...order,
                  eboekhouden_sync: {
                    status: 'error',
                    verkoop_mutatie_id: null,
                    cogs_mutatie_id: null,
                    sync_timestamp: new Date().toISOString(),
                    error_message: result.message
                  }
                }
              : order
          )
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      setDebugOpenId(orderId)
      setDebugData({
        request: { url: '/api/accounting/sync-order-new', method: 'POST', body: { orderId } },
        status: 0,
        ok: false,
        response: { message: error instanceof Error ? error.message : 'Unknown error' }
      })
      setDebugModalOpen(true)
      // Update local state with error
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {
                ...order,
                eboekhouden_sync: {
                  status: 'error',
                  verkoop_mutatie_id: null,
                  cogs_mutatie_id: null,
                  sync_timestamp: new Date().toISOString(),
                  error_message: error instanceof Error ? error.message : 'Unknown error'
                }
              }
            : order
        )
      );
    } finally {
      setSyncingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getEboekhoudenStatus = (order: OrderRow) => {
    if (!order.eboekhouden_sync) {
      return (
        <button
          onClick={() => syncToEboekhouden(order.id)}
          disabled={syncingOrders[order.id]}
          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm"
        >
          {syncingOrders[order.id] ? '⏳ Sync...' : '📊 Sync'}
        </button>
      )
    }

    if (order.eboekhouden_sync.status === 'success') {
      return (
        <div className="text-xs text-green-700">
          <div className="font-medium">✅ Gesynchroniseerd</div>
          <div>Verkoop: {order.eboekhouden_sync.verkoop_mutatie_id}</div>
          <div>COGS: {order.eboekhouden_sync.cogs_mutatie_id}</div>
          <div className="text-gray-500">
            {new Date(order.eboekhouden_sync.sync_timestamp!).toLocaleDateString('nl-NL')}
          </div>
        </div>
      )
    }

    if (order.eboekhouden_sync.status === 'error') {
      return (
        <div className="text-xs text-red-700">
          <div className="font-medium">❌ Sync mislukt</div>
          {order.eboekhouden_sync.error_message && (
            <div className="text-red-600 text-xs mb-1">
              {order.eboekhouden_sync.error_message}
            </div>
          )}
          <div className="text-gray-500">
            {new Date(order.eboekhouden_sync.sync_timestamp!).toLocaleDateString('nl-NL')}
          </div>
          <button
            onClick={() => syncToEboekhouden(order.id)}
            disabled={syncingOrders[order.id]}
            className="mt-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-xs"
          >
            {syncingOrders[order.id] ? '⏳ Retry...' : '🔄 Retry'}
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturen</h1>
          <p className="text-gray-600">Overzicht van facturen per bestelling</p>
        </div>
        <div className="flex items-center space-x-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Zoek op order, naam of e‑mail" className="px-3 py-2 border rounded" />
          <label className="text-sm ml-2 flex items-center space-x-2">
            <input type="checkbox" checked={onlyWithoutInvoice} onChange={(e)=>setOnlyWithoutInvoice(e.target.checked)} />
            <span>Alleen zonder factuur</span>
          </label>
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{err}</div>}

      {loading ? (
        <div className="text-gray-600">Laden…</div>
      ) : (
        filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            <div className="text-4xl mb-2">🧾</div>
            Nog geen facturen. Genereer eerst een factuur bij een bestelling.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
          <Modal isOpen={debugModalOpen} onClose={()=>setDebugModalOpen(false)} title="e‑Boekhouden Sync Debug">
            <div className="text-xs">
              <div className="mb-2 text-gray-700">Onderstaande gegevens tonen de laatst uitgevoerde sync‑call.</div>
              <pre className="whitespace-pre-wrap break-all bg-gray-50 p-3 rounded border">{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          </Modal>
          {debugOpenId && (
            <div className="p-4 border-b bg-gray-50 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-700">Debug laatste sync</div>
                <button className="text-blue-600" onClick={()=>{setDebugOpenId(null); setDebugData(null)}}>Sluiten</button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-all">{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factuurnr.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotaal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">BTW</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Totaal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factuur</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E-Boekhouden</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(o=> (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{o.invoice_number || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{o.orderNumber}</div>
                    <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('nl-NL')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(o.customer?.contact_first_name || o.customer?.voornaam || '') + ' ' + (o.customer?.contact_last_name || o.customer?.achternaam || '')}<br/>
                    <span className="text-xs text-gray-500">{o.customer?.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">€{o.subtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">€{o.vat_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">€{o.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {o.invoice_url ? (
                      <a href={o.invoice_url} target="_blank" className="text-green-600 hover:text-green-800">Download</a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {getEboekhoudenStatus(o)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <Link href={`/admin/orders`} className="px-3 py-1 border rounded hover:bg-gray-50">Open bestelling</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )
      )}
    </div>
  )
}
