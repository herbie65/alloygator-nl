"use client"

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'
import Link from 'next/link'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
)

interface User {
  id: string
  contact_first_name: string
  contact_last_name: string
  email: string
  phone: string
  address: string
  postal_code: string
  city: string
  country: string
  is_dealer: boolean
  dealer_group?: string
  company_name?: string
  created_at: string
  sets_purchased_last_year?: number
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  created_at: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [groupTargets, setGroupTargets] = useState<Record<string, number>>({})
  const [groupDiscount, setGroupDiscount] = useState<number>(0)
  const [setsSold, setSetsSold] = useState<number>(0)
  const [activities, setActivities] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [openInvoices, setOpenInvoices] = useState<{count:number; total:number; oldestDays:number}>({ count: 0, total: 0, oldestDays: 0 })
  const [avgPaymentDays, setAvgPaymentDays] = useState<number | null>(null)
  const [firstOrderDate, setFirstOrderDate] = useState<Date | null>(null)
  const [docPreview, setDocPreview] = useState<any | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addrForm, setAddrForm] = useState({
    contact_first_name: '',
    contact_last_name: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'NL'
  })

  useEffect(() => {
    // Prefer live data over stored session for accurate dealerstatus
    const init = async () => {
      try {
        const session = localStorage.getItem('currentUser')
        const email = session ? (JSON.parse(session)?.email) : null
        if (email) {
          const customers = await FirebaseClientService.getCustomersByEmail(email)
          const record = Array.isArray(customers) && customers.length ? (customers[0] as any) : null
          if (record) {
            setUser({
              id: record.id || '',
              contact_first_name: record.contact_first_name || record.first_name || record.voornaam || '-',
              contact_last_name: record.contact_last_name || record.last_name || record.achternaam || '-',
              email: record.email || email,
              phone: record.phone || record.telefoon || '-',
              address: record.address || record.adres || '-',
              postal_code: record.postal_code || record.postcode || '-',
              city: record.city || record.plaats || '-',
              country: record.country || record.land || 'Nederland',
              is_dealer: !!record.is_dealer,
              dealer_group: record.dealer_group || '',
              company_name: record.company_name || record.bedrijfsnaam || '',
              created_at: record.customer_since || record.created_at || new Date().toISOString(),
              sets_purchased_last_year: record.sets_purchased_last_year || 0
            })
            setLoading(false)
            return
          }
        }
        // Fallback to session
        if (session) {
          try { setUser(JSON.parse(session)) } catch {}
        }
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  // Load targets and compute dealer progress
  useEffect(() => {
    const load = async () => {
      try {
        const groups = await FirebaseClientService.getCustomerGroups()
        const targetMap: Record<string, number> = {}
        const discountMap: Record<string, number> = {}
        groups.forEach((g:any)=> {
          const nameKey = (g.name||'').toLowerCase()
          const idKey = String(g.id||'').toLowerCase()
          const targetVal = Number(g.annual_target_sets || 0)
          const discountVal = Number(g.discount_percentage || 0)
          if (nameKey) {
            targetMap[nameKey] = targetVal
            discountMap[nameKey] = discountVal
          }
          if (idKey) {
            targetMap[idKey] = targetVal
            discountMap[idKey] = discountVal
          }
        })
        setGroupTargets(targetMap)
        if (!user) return
        // Load all orders for this user from Firestore
        const allOrders = await FirebaseClientService.getOrders()
        console.log('Debug: Alle orders geladen:', allOrders.length)
        console.log('Debug: User email:', user.email)
        console.log('Debug: User ID:', user.id)
        
        // Filter orders op basis van customer email, customer_id, of user_email
        const myOrders = (allOrders as any[]).filter(o => {
          const orderEmail = o.customer?.email || o.user_email || ''
          const orderCustomerId = o.customer_id || o.user_id || ''
          const userEmail = user.email || ''
          const userId = user.id || ''
          
          console.log('Debug: Order filtering:', {
            orderNumber: o.order_number || o.orderNumber,
            orderEmail,
            orderCustomerId,
            userEmail,
            userId,
            matches: orderEmail === userEmail || orderCustomerId === userId
          })
          
          return orderEmail === userEmail || orderCustomerId === userId
        }) as any[]
        
        console.log('Debug: Gefilterde orders:', myOrders.length)
        // Map to Account Order interface
        const mapped: Order[] = myOrders.map((o:any)=> ({
          id: o.id,
          order_number: o.orderNumber || o.order_number || o.id,
          status: o.status || 'pending',
          payment_status: o.payment_status || 'open',
          total: Number(o.total || 0),
          created_at: o.createdAt || o.created_at || new Date().toISOString(),
          items: (o.items||[]).map((it:any)=> ({ name: it.name, quantity: Number(it.quantity||0), price: Number(it.price||0) }))
        }))
        setOrders(mapped)
        // Activities & documents
        try {
          const [acts, docs] = await Promise.all([
            FirebaseClientService.getActivitiesByEmail(user.email),
            FirebaseClientService.getCustomerDocumentsByEmail(user.email)
          ])
          setActivities(acts as any[])
          // Combine publieke documenten uit 'documents' met private klantdocumenten
          try {
            const publicDocs = await FirebaseClientService.getDocuments({})
            const allDocs = [...(docs as any[]), ...((publicDocs as any[]) || [])]
            setDocuments(allDocs)
          } catch {
            setDocuments(docs as any[])
          }
        } catch {}
        if (user.is_dealer) {
          // Determine discount from groups by dealer group
          const gname = (user.dealer_group||'').toLowerCase()
          let pct = discountMap[gname] || 0
          if (!pct) {
            const fuzzy = Object.entries(discountMap).find(([k,v]) => Number(v)>0 && (gname.includes(k) || k.includes(gname)))
            if (fuzzy) pct = Number(fuzzy[1])
          }
          setGroupDiscount(pct)
          // Determine first-ever order date for this customer
          const allSorted = [...myOrders].sort((a:any,b:any)=> new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime())
          const firstOrderTs = allSorted.length ? new Date(allSorted[0].createdAt || allSorted[0].created_at || new Date()).getTime() : 0
          const firstOrd = firstOrderTs ? new Date(firstOrderTs) : null
          setFirstOrderDate(firstOrd)
          // Rolling 12 months window from today
          const now = new Date()
          const from = new Date(now)
          from.setMonth(now.getMonth() - 12)
          const fromMs = from.getTime()
          const toMs = now.getTime()

          const itemsInYear = myOrders
            .filter(o => { const t = new Date(o.createdAt || o.created_at || new Date()).getTime(); return t >= fromMs && t <= toMs })
            .flatMap(o => (o.items || []).map((it:any) => ({...it, _month: new Date(o.createdAt || o.created_at || new Date()).getMonth()})))
            .filter((it: any) => { const c=(it.category||'').toLowerCase(); if(c==='alloygator-set') return true; const n=(it.name||'').toLowerCase(); return !c && n.includes('alloygator') && n.includes('set') })

          const qty = itemsInYear.reduce((s:number, it:any) => s + Number(it.quantity || 0), 0)
          // Tel pre-live sets op bij de huidige sets
          const totalSets = qty + (user.sets_purchased_last_year || 0)
          setSetsSold(totalSets)
        }

        // Open invoice stats and payment speed (for all customers)
        try {
          // Helper: normalize Firestore Timestamp/Date/string → ms
          const toMs = (v:any): number => {
            if (!v) return 0
            try {
              if (typeof v?.toDate === 'function') return v.toDate().getTime()
              if (typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000
              if (typeof v === 'string') {
                // Support dd-mm-yyyy or d-m-yyyy
                const m = v.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
                if (m) {
                  const dd = parseInt(m[1],10); const mm = parseInt(m[2],10)-1; const yy = parseInt(m[3],10)
                  return new Date(yy, mm, dd).getTime()
                }
              }
              const t = new Date(v as any).getTime()
              return isNaN(t) ? 0 : t
            } catch { return 0 }
          }

          // Openstaande facturen = onbetaalde factuur-orders, exclusief geannuleerde/terugbetaalde/credit
          const invOrders = myOrders.filter((o:any) => String(o.payment_method||'').toLowerCase() === 'invoice')
          const open = invOrders.filter((o:any) => {
            const status = String(o.status||'').toLowerCase()
            const pstat = String(o.payment_status||'').toLowerCase()
            const cancelled = ['cancelled','canceled','geannuleerd','refunded','void','credit','credited','storno'].some(k => status.includes(k) || pstat.includes(k))
            return !cancelled && pstat !== 'paid' && Number(o.total||0) > 0
          })
          const openTotal = open.reduce((s:number,o:any)=> s + Number(o.total||0), 0)
          const msPerDay = 1000*60*60*24
          const todayStart = (()=>{ const d=new Date(); d.setHours(0,0,0,0); return d.getTime() })()
          const startOfDay = (ms:number)=> { const d=new Date(ms||0); if (!ms) return 0; return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
          // Leeftijd bepalen op basis van verzend-/factuurdatum; val terug op orderdatum
          const oldest = open.reduce((maxAge:number,o:any)=> {
            const issued = toMs(o.invoice_sent_date || o.invoice_date || o.invoiceDate || o.invoice_created_at || o.createdAt || o.created_at)
            const effective = startOfDay(issued || toMs(o.created_at) || toMs(o.createdAt))
            const days = effective ? Math.max(0, Math.round((todayStart - effective) / msPerDay)) : 0
            return Math.max(maxAge, days)
          }, 0)
          setOpenInvoices({ count: open.length, total: openTotal, oldestDays: oldest })

          // Average payment time in days for paid invoice orders
          const paidInv = invOrders.filter((o:any)=> (o.payment_status === 'paid'))
          const durations = paidInv.map((o:any) => {
            const created = new Date(o.createdAt || o.created_at || new Date()).getTime()
            const paid = new Date(o.paid_at || o.updatedAt || o.updated_at || created).getTime()
            return Math.max(0, Math.round((paid - created) / (1000*60*60*24)))
          })
          const avg = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : null
          setAvgPaymentDays(avg)
        } catch {}
      } catch {}
    }
    load()
  }, [user])

  const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

  const groupVisual = (() => {
    const name = (user?.dealer_group || '').toLowerCase()
  if (name.replace(/dealers?|groep|group/g,'').trim().startsWith('goud')) return { label: 'Goud', hex: '#D4AF37', glow: 'rgba(212,175,55,0.55)', text: '#111' }
  if (name.replace(/dealers?|groep|group/g,'').trim().startsWith('zilver')) return { label: 'Zilver', hex: '#C0C0C0', glow: 'rgba(192,192,192,0.55)', text: '#111' }
  if (name.replace(/dealers?|groep|group/g,'').trim().startsWith('brons')) return { label: 'Brons', hex: '#CD7F32', glow: 'rgba(205,127,50,0.55)', text: '#fff' }
    return { label: user?.dealer_group || '-', hex: '#8bc34a', glow: 'rgba(139,195,66,0.5)', text: '#111' }
  })()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In behandeling'
      case 'processing': return 'Wordt verwerkt'
      case 'shipped': return 'Verzonden'
      case 'delivered': return 'Afgeleverd'
      case 'cancelled': return 'Geannuleerd'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Account laden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Niet ingelogd</h1>
          <p className="text-gray-600 mb-6">U moet ingelogd zijn om uw account te bekijken.</p>
          <Link
            href="/auth/login"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Inloggen
          </Link>
        </div>
      </div>
    )
  }

  // Helpers
  const getInitials = () => {
    const companyInitial = (user.company_name || '').trim().charAt(0)
    if (companyInitial) return companyInitial.toUpperCase()
    const a = (user.contact_first_name || '').trim().charAt(0)
    if (a) return a.toUpperCase()
    const mail = (user.email || 'a@b').split('@')[0]
    return (mail.charAt(0) || 'A').toUpperCase()
  }

  const displayName = (() => {
    if (user.company_name) return user.company_name
    const a = (user.contact_first_name || '').trim()
    const b = (user.contact_last_name || '').trim()
    if ((a && a !== '-') || (b && b !== '-')) return `${a !== '-' ? a : ''} ${b !== '-' ? b : ''}`.trim()
    return user.email
  })()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Account</h1>
          <p className="text-gray-600">Welkom terug, {user.contact_first_name || displayName}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold text-lg">
                    {getInitials()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{displayName}</h3>
                  {user.company_name && <p className="text-sm text-gray-700">{user.company_name}</p>}
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.is_dealer && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                      Dealer
                    </span>
                  )}
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overzicht', icon: '📊' },
                  { id: 'orders', label: 'Bestellingen', icon: '🛒' },
                  { id: 'documents', label: 'Documenten', icon: '📄' },
                  { id: 'profile', label: 'Profiel', icon: '👤' },
                  { id: 'addresses', label: 'Adressen', icon: '📍' },
                  { id: 'wishlist', label: 'Verlanglijst', icon: '❤️' },
                  { id: 'settings', label: 'Instellingen', icon: '⚙️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full text-left text-sm text-red-600 hover:text-red-700">
                  Uitloggen
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats + Target */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                  {/* Left column stacked cards */}
                  <div className="space-y-6 md:col-span-1">
                    {/* Openstaande facturen */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full ${openInvoices.oldestDays>14 ? 'bg-red-100 text-red-600' : 'bg-red-50 text-red-500'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Openstaande facturen</p>
                          <p className={`text-xl font-bold ${openInvoices.oldestDays>14 ? 'text-red-600' : 'text-gray-900'}`}>{openInvoices.count} €{openInvoices.total.toFixed(2)}</p>
                          <p className={`text-xs mt-1 ${openInvoices.oldestDays>14 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Oudste: {openInvoices.oldestDays} dagen</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Laatste bestelling: {orders.length ? new Date(Math.max(...orders.map(o=> new Date(o.created_at).getTime()))).toLocaleDateString('nl-NL') : '–'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  </div>

                  {/* Right large dealer target block */}
                  {user.is_dealer && (
                    <div className="bg-white rounded-lg shadow-md p-6 md:col-span-3">
                      {/* Dealer group visual block */}
                      <div
                        className="rounded-md p-4 mb-4"
                        style={{
                          background: `linear-gradient(135deg, ${groupVisual.hex} 0%, ${groupVisual.hex} 70%, #ffffff 100%)`,
                          boxShadow: `0 0 20px ${groupVisual.glow}`,
                          color: groupVisual.text,
                        }}
                      >
                        <div className="text-sm opacity-90">Dealergroep</div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xl font-semibold flex items-center gap-3">
                            <span>{groupVisual.label}</span>
                            <span className="text-xs opacity-90">• Dealer sinds {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : '-'}</span>
                          </div>
                          {groupDiscount > 0 && (
                            <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight pr-2">
                              {Math.round(groupDiscount)}% KORTING
                            </div>
                          )}
                        </div>
                      </div>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-3xl font-bold text-gray-900">{setsSold} / {(() => {
                            const g=(user.dealer_group||'').toLowerCase()
                            if (!g) return 0
                            // Exact match by name or id
                            let t = groupTargets[g]
                            if (typeof t === 'number' && t > 0) return t
                            // Fuzzy: find key that includes the group or vice versa
                            const fuzzy = Object.entries(groupTargets).find(([k,v]) => Number(v)>0 && (g.includes(k) || k.includes(g)))
                            if (fuzzy) return Number(fuzzy[1])
                            // Fallback defaults by label
                          const cg = g.replace(/dealers?|groep|group/g,'').trim()
                          if (cg.includes('goud')||cg.includes('gold')) return 30
                          if (cg.includes('zilver')||cg.includes('silver')) return 20
                          if (cg.includes('brons')||cg.includes('bronze')) return 10
                            return 0
                          })()}</p>
                          <p className="text-xs text-gray-500 mt-1">laatste 12 maanden</p>
                        </div>
                        <div></div>
                      </div>

                      {(() => {
                        const g = (user.dealer_group || '').toLowerCase()
                        let target = groupTargets[g] || 0
                        if (!target) {
                          const fuzzy = Object.entries(groupTargets).find(([k,v]) => Number(v)>0 && (g.includes(k) || k.includes(g)))
                          if (fuzzy) target = Number(fuzzy[1])
                        }
                        if (!target) {
                          const cg2 = g.replace(/dealers?|groep|group/g,'').trim()
                          if (cg2.includes('goud')||cg2.includes('gold')) target = 30
                          else if (cg2.includes('zilver')||cg2.includes('silver')) target = 20
                          else if (cg2.includes('brons')||cg2.includes('bronze')) target = 10
                        }

                        // Bereken jaarprogressie sinds dealer startdatum
                        const calculateYearProgress = () => {
                          if (!user.created_at) return 0
                          
                          const startDate = new Date(user.created_at)
                          const now = new Date()
                          
                          // Bereken progressie binnen het "dealer jaar" (van startdatum tot startdatum + 1 jaar)
                          const dealerYearStart = new Date(startDate)
                          const dealerYearEnd = new Date(startDate)
                          dealerYearEnd.setFullYear(dealerYearEnd.getFullYear() + 1)
                          
                          // Als we voorbij het eerste jaar zijn, bereken dan binnen het huidige dealer jaar
                          const yearsSinceStart = now.getFullYear() - startDate.getFullYear()
                          if (yearsSinceStart > 0) {
                            dealerYearStart.setFullYear(now.getFullYear())
                            dealerYearEnd.setFullYear(now.getFullYear() + 1)
                          }
                          
                          const totalYearDuration = dealerYearEnd.getTime() - dealerYearStart.getTime()
                          const elapsedThisYear = now.getTime() - dealerYearStart.getTime()
                          
                          return Math.min(100, Math.max(0, (elapsedThisYear / totalYearDuration) * 100))
                        }

                        const yearProgress = calculateYearProgress()
                        
                        // Target voortgang (sets / target)
                        const targetProgressPct = target > 0 ? Math.min(100, Math.round((setsSold / target) * 100)) : 0
                        return (
                          <div className="mt-4 space-y-4">
                            {/* Pie chart met rode wijzer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-white rounded border p-6">
                                <Pie
                                  data={{
                                    labels: ['Behaald', 'Resterend'],
                                    datasets: [{
                                      data: [Math.min(setsSold, target), Math.max(target - setsSold, 0)],
                                      backgroundColor: ['#16a34a', '#e5e7eb'],
                                      borderWidth: 0,
                                    }],
                                  }}
                                  options={{ plugins: { legend: { position: 'bottom' } } }}
                                />
                              </div>
                              <div className="flex items-center text-sm text-gray-700">
                                <div className="space-y-2">
                                  <div>Doel: {target} sets</div>
                                  <div>Behaald (12 mnd): {setsSold} sets</div>
                                  <div className={`${(target-setsSold) <= 0 ? 'text-green-600' : 'text-red-600'}`}>{(target-setsSold) <= 0 ? 'Target gehaald' : `Nog nodig: ${target - setsSold} sets`}</div>
                                  <div className="text-gray-600">Gem. betaaltermijn: {avgPaymentDays === null ? '–' : `${avgPaymentDays} dagen`}</div>
                                  <div className="text-blue-600">Target voortgang: {targetProgressPct}%</div>
                                  <div className="text-xs text-gray-500">Reset elk jaar op {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL', { month: 'long', day: 'numeric' }) : '-'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"></div>
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h2>
                  </div>
                  <div className="p-6">
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900">{order.order_number}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {orders.length > 3 && (
                          <Link
                            href="/account?tab=orders"
                            className="block text-center text-green-600 hover:text-green-700 font-medium"
                          >
                            Bekijk alle bestellingen
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">🛒</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen bestellingen</h3>
                        <p className="text-gray-600 mb-4">Start met winkelen om uw eerste bestelling te plaatsen.</p>
                        <Link
                          href="/winkel"
                          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                          Start met winkelen
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Mijn Bestellingen</h2>
                </div>
                <div className="p-6">
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium text-gray-900">{order.order_number}</h3>
                              <p className="text-sm text-gray-600">
                                Besteld op {new Date(order.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>€{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                            <Link
                              href={`/order-confirmation/${order.id}`}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              Bestelling bekijken
                            </Link>
                            <span className="text-sm text-gray-500">
                              Betaalstatus: {order.payment_status === 'paid' ? 'Betaald' : 'In behandeling'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📦</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Geen bestellingen gevonden</h3>
                      <p className="text-gray-600">U heeft nog geen bestellingen geplaatst.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenten</h2>
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-600">Nog geen documenten beschikbaar.</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((d:any)=> (
                      <div key={d.id || d.storage_path} className="border rounded p-3 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{d.title || d.file_name || 'Document'}</div>
                          <div className="text-gray-600">
                            {new Date(d.created_at || d.uploaded_at || new Date()).toLocaleDateString('nl-NL')}
                            {d.category && <span className="ml-2 text-xs text-gray-500">({d.category})</span>}
                          </div>
                        </div>
                        {d.file_url || d.url ? (
                          <button onClick={()=>{ setDocPreview(d); setShowDocModal(true) }} className="text-green-600 text-sm">Bekijken</button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Document Preview Modal */}
            {showDocModal && docPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 animate-fadeIn" onClick={()=> setShowDocModal(false)} />
                <div className="relative bg-white rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[80vh] overflow-hidden animate-scaleIn">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div>
                      <div className="font-semibold text-gray-900">{docPreview.title || 'Document'}</div>
                      <div className="text-xs text-gray-500">{new Date(docPreview.created_at || docPreview.uploaded_at || new Date()).toLocaleDateString('nl-NL')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={(docPreview.file_url || docPreview.url)} target="_blank" rel="noreferrer" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Download</a>
                      <button onClick={()=> setShowDocModal(false)} className="px-3 py-1 border rounded text-sm">Sluiten</button>
                    </div>
                  </div>
                  <div className="w-full h-full">
                    <iframe src={(docPreview.file_url || docPreview.url)} className="w-full h-full" />
                  </div>
                </div>
                <style jsx global>{`
                  .animate-fadeIn{animation:fadeIn .2s ease-out}
                  @keyframes fadeIn{from{opacity:0} to{opacity:1}}
                  .animate-scaleIn{animation:scaleIn .2s ease-out}
                  @keyframes scaleIn{from{opacity:0; transform:scale(.97)} to{opacity:1; transform:scale(1)}}
                `}</style>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profielgegevens</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                    <input
                      type="text"
                      value={user.contact_first_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam</label>
                    <input
                      type="text"
                      value={user.contact_last_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                    <input
                      type="tel"
                      value={user.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Profiel bewerken
                  </button>
                </div>
              </div>
            )}

            {/* Activities Tab (dealer-friendly) */}
            {activeTab === 'addresses' && user.is_dealer && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Bezoeken & Contactmomenten</h2>
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-600">Nog geen activiteiten geregistreerd.</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((a:any)=> (
                        <div key={a.id} className="border rounded p-3 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{a.type || 'activiteit'} — {new Date(a.date || a.created_at).toLocaleDateString('nl-NL')}</div>
                            <div className="text-gray-600">{a.notes || '-'}</div>
                          </div>
                          <span className="text-xs text-gray-500">{a.user || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenten</h2>
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-600">Nog geen documenten.</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((d:any)=> (
                        <div key={d.id} className="border rounded p-3 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{d.title || d.file_name || 'Document'}</div>
                            <div className="text-gray-600">Geüpload: {new Date(d.uploaded_at).toLocaleDateString('nl-NL')}</div>
                          </div>
                          {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-green-600 text-sm">Bekijken</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Adressen</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">Hoofdadres</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Standaard
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {user.address}<br />
                      {user.postal_code} {user.city}<br />
                      {user.country}
                    </p>
                    <div className="mt-4 flex space-x-2">
                      <button
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                        onClick={() => {
                          setAddrForm({
                            contact_first_name: user.contact_first_name || '',
                            contact_last_name: user.contact_last_name || '',
                            phone: user.phone || '',
                            address: user.address || '',
                            postal_code: user.postal_code || '',
                            city: user.city || '',
                            country: user.country || 'NL'
                          })
                          setShowAddressModal(true)
                        }}
                      >
                        Bewerken
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        Verwijderen
                      </button>
                    </div>
                  </div>
                    
                  <button
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors"
                    onClick={() => {
                      setAddrForm({ contact_first_name: '', contact_last_name: '', phone: '', address: '', postal_code: '', city: '', country: 'NL' })
                      setShowAddressModal(true)
                    }}
                  >
                    + Nieuw adres toevoegen
                  </button>
                </div>
              </div>
            )}

            {showAddressModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAddressModal(false)} />
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adres opslaan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Voornaam</label>
                      <input value={addrForm.contact_first_name} onChange={e=>setAddrForm({...addrForm, contact_first_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Achternaam</label>
                      <input value={addrForm.contact_last_name} onChange={e=>setAddrForm({...addrForm, contact_last_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">Adres</label>
                      <input value={addrForm.address} onChange={e=>setAddrForm({...addrForm, address: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Postcode</label>
                      <input value={addrForm.postal_code} onChange={e=>setAddrForm({...addrForm, postal_code: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Plaats</label>
                      <input value={addrForm.city} onChange={e=>setAddrForm({...addrForm, city: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Land</label>
                      <input value={addrForm.country} onChange={e=>setAddrForm({...addrForm, country: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Telefoon</label>
                      <input value={addrForm.phone} onChange={e=>setAddrForm({...addrForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button className="px-4 py-2 border rounded" onClick={()=>setShowAddressModal(false)}>Annuleren</button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      onClick={async ()=>{
                        try {
                          await fetch('/api/customers', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: user.email,
                              ...addrForm
                            })
                          })
                          // Update local user state
                          setUser({ ...user, ...{
                            contact_first_name: addrForm.contact_first_name,
                            contact_last_name: addrForm.contact_last_name,
                            phone: addrForm.phone,
                            address: addrForm.address,
                            postal_code: addrForm.postal_code,
                            city: addrForm.city,
                            country: addrForm.country,
                          }})
                          setShowAddressModal(false)
                        } catch (e) {
                          console.error('Adres opslaan mislukt', e)
                          alert('Adres opslaan mislukt')
                        }
                      }}
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Verlanglijst</h2>
                
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">❤️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verlanglijst is leeg</h3>
                  <p className="text-gray-600 mb-4">Voeg producten toe aan uw verlanglijst om ze later te bekijken.</p>
                  <Link
                    href="/winkel"
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Start met winkelen
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Instellingen</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Email voorkeuren</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Bestelling updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Nieuwsbrief</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-sm text-gray-700">Promotionele emails</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Privacy</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Cookies accepteren</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-sm text-gray-700">Analytics tracking</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors">
                      Account verwijderen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 