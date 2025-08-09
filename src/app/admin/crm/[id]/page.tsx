'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function CustomerDashboardPage() {
  const params = useParams() as { id: string }
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [targets, setTargets] = useState<{gold:number; silver:number; bronze:number}>({ gold: 30, silver: 20, bronze: 10 })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [c, o, s] = await Promise.all([
          FirebaseClientService.getCustomerById(params.id),
          FirebaseClientService.getOrders(),
          FirebaseClientService.getSettings()
        ])
        setCustomer(c)
        setOrders(Array.isArray(o) ? o : [])
        if (s) setTargets({ gold: s.targetGold || 30, silver: s.targetSilver || 20, bronze: s.targetBronze || 10 })
      } finally { setLoading(false) }
    }
    load()
  }, [params.id])

  const { setsSold, target, progressPct } = useMemo(() => {
    if (!customer) return { setsSold: 0, target: 0, progressPct: 0 }
    const start = new Date(year, 0, 1).getTime()
    const end = new Date(year + 1, 0, 1).getTime()
    const myOrders = orders.filter(o => (o.customer?.id === customer.id) || (o.customer?.email === customer.email))
    const qty = myOrders
      .filter(o => {
        const t = new Date(o.createdAt || o.created_at || new Date()).getTime()
        return t >= start && t < end
      })
      .flatMap(o => o.items || [])
      .filter((it: any) => {
        const cat = (it.category || '').toString().toLowerCase()
        if (cat === 'alloygator-set') return true
        // Fallback: herken op naam als category ontbreekt
        const name = (it.name || '').toString().toLowerCase()
        return !cat && name.includes('alloygator') && name.includes('set')
      })
      .reduce((s: number, it: any) => s + Number(it.quantity || 0), 0)
    const g = (customer.dealer_group || '').toLowerCase()
    const targetVal = g.includes('gold') || g.includes('goud') ? targets.gold : g.includes('silver') || g.includes('zilver') ? targets.silver : g.includes('bronze') || g.includes('brons') ? targets.bronze : 0
    const pct = targetVal > 0 ? Math.min(100, Math.round((qty / targetVal) * 100)) : 0
    return { setsSold: qty, target: targetVal, progressPct: pct }
  }, [customer, orders, targets, year])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Klantdashboard laden...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Klant niet gevonden</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.company_name || customer.name}</h1>
            <p className="text-gray-600">Dealer groep: {customer.dealer_group || '-'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Jaar</span>
            <select value={year} onChange={(e)=>setYear(parseInt(e.target.value,10))} className="text-sm border rounded px-2 py-1">
              {[year-1, year, year+1].map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Sets {year}</div>
            <div className="text-2xl font-bold">{setsSold}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Target</div>
            <div className="text-2xl font-bold">{target}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Voortgang</div>
            <div className="text-2xl font-bold">{progressPct}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Laatste contact</div>
            <div className="text-2xl font-bold">{customer.last_contact ? new Date(customer.last_contact).toLocaleDateString('nl-NL') : '-'}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Target voortgang</div>
            <div className="text-sm text-gray-600">{setsSold}/{target} sets</div>
          </div>
          <div className="h-3 bg-gray-100 rounded overflow-hidden">
            <div className={`h-full ${progressPct>=100?'bg-green-500':progressPct>=50?'bg-yellow-500':'bg-red-500'}`} style={{ width: progressPct + '%' }} />
          </div>
        </div>

        {/* Basisgegevens */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basisgegevens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Naam:</span> <span className="font-medium">{customer.name}</span></div>
            <div><span className="text-gray-600">Email:</span> <span className="font-medium">{customer.email}</span></div>
            <div><span className="text-gray-600">Telefoon:</span> <span className="font-medium">{customer.phone || '-'}</span></div>
            <div><span className="text-gray-600">Adres:</span> <span className="font-medium">{customer.address}, {customer.postal_code} {customer.city}</span></div>
          </div>
        </div>

        {/* Orders table (compact) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bestellingen ({year})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Totaal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {orders
                  .filter(o => (o.customer?.id === customer.id) || (o.customer?.email === customer.email))
                  .filter(o => { const t = new Date(o.createdAt || o.created_at || new Date()).getTime(); return t >= new Date(year,0,1).getTime() && t < new Date(year+1,0,1).getTime() })
                  .map((o, i) => {
                    const sets = (o.items || []).filter((it:any)=> {
                      const cat = (it.category||'').toString().toLowerCase()
                      if (cat === 'alloygator-set') return true
                      const name = (it.name||'').toString().toLowerCase()
                      return !cat && name.includes('alloygator') && name.includes('set')
                    })
                    const qty = sets.reduce((s:number,it:any)=> s + Number(it.quantity||0), 0)
                    return (
                      <tr key={o.id || i}>
                        <td className="px-6 py-3">{o.orderNumber || o.order_number || o.id}</td>
                        <td className="px-6 py-3">{new Date(o.createdAt || o.created_at || new Date()).toLocaleDateString('nl-NL')}</td>
                        <td className="px-6 py-3">{qty}</td>
                        <td className="px-6 py-3">€{Number(o.total || 0).toFixed(2)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placeholders voor toekomstige secties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 min-h-[180px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bezoeken</h2>
            <p className="text-sm text-gray-500">Plan en registreer bezoekmomenten (later).</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 min-h-[180px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contactmomenten</h2>
            <p className="text-sm text-gray-500">E-mails/telefoontjes loggen (later).</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 min-h-[180px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Afspraken</h2>
            <p className="text-sm text-gray-500">Agenda integratie (later).</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 min-h-[180px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Documenten</h2>
            <p className="text-sm text-gray-500">Uploaden/opslaan (later).</p>
          </div>
        </div>
      </div>
    </div>
  )
}


