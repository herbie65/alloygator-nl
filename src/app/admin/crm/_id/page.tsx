'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function CustomerDashboardPage() {
  const params = useParams() as { id: string }
  const decodedId = useMemo(() => {
    try { return decodeURIComponent(params.id || '') } catch { return params.id }
  }, [params.id])
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [targets, setTargets] = useState<{gold:number; silver:number; bronze:number}>({ gold: 30, silver: 20, bronze: 10 })
  const [groupTargets, setGroupTargets] = useState<Record<string, number>>({})
  
  // CRM state
  const [visits, setVisits] = useState<any[]>([])
  const [contactMoments, setContactMoments] = useState<any[]>([])
  const [visitTypes, setVisitTypes] = useState<any[]>([])
  const [contactMomentTypes, setContactMomentTypes] = useState<any[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [contactMomentsLoading, setContactMomentsLoading] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [docCategories, setDocCategories] = useState<any[]>([])
  const [docPermissions, setDocPermissions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentPrefill, setAppointmentPrefill] = useState<any>(null)
  const normalize = (v:any)=> String(v||'').toLowerCase().trim()
  const [resolvedTarget, setResolvedTarget] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [c, o, s, vt, cmt] = await Promise.all([
          FirebaseClientService.getCustomerById(decodedId),
          FirebaseClientService.getOrders(),
          FirebaseClientService.getSettings(),
          FirebaseClientService.getCollection('crm_settings'),
          FirebaseClientService.getCollection('crm_settings')
        ])

        // Load visits and contact moments separately to handle errors gracefully
        let v = []
        let cm = []
        
        console.log('🔍 Starting to load visits and contact moments for customer:', params.id)
        
        setVisitsLoading(true)
        try {
          // Try the normal query first
          v = await FirebaseClientService.getVisits(decodedId)
          console.log(`✅ Loaded ${v.length} visits via normal query`)
          
          // If no visits found, try backup method
          if (v.length === 0) {
            console.log('🔍 No visits found via normal query, trying backup method...')
            try {
              const allVisits = await FirebaseClientService.getAllVisits()
              console.log(`🔍 Total visits loaded: ${allVisits.length}`)
              console.log(`🔍 All visit customer_ids:`, allVisits.map((visit: any) => visit.customer_id))
              
              v = allVisits.filter((visit: any) => visit.customer_id === decodedId)
              console.log(`✅ Loaded ${v.length} visits via backup method for customer ${params.id}`)
            } catch (backupError) {
              console.log('❌ Backup method also failed:', backupError.message)
              v = []
            }
          }
        } catch (error) {
          console.log('🔍 Visits query failed, trying backup method...')
          // Backup: load all visits and filter client-side
          try {
            const allVisits = await FirebaseClientService.getAllVisits()
            console.log(`🔍 Total visits loaded: ${allVisits.length}`)
            console.log(`🔍 All visit customer_ids:`, allVisits.map((visit: any) => visit.customer_id))
            
            v = allVisits.filter((visit: any) => visit.customer_id === params.id)
            console.log(`✅ Loaded ${v.length} visits via backup method for customer ${params.id}`)
          } catch (backupError) {
            console.log('❌ Backup method also failed:', backupError.message)
            v = []
          }
        } finally {
          setVisitsLoading(false)
        }
        
        setContactMomentsLoading(true)
        try {
          // Try the normal query first
          cm = await FirebaseClientService.getContactMoments(decodedId)
          console.log(`✅ Loaded ${cm.length} contact moments via normal query`)
          
          // If no contact moments found, try backup method
          if (cm.length === 0) {
            console.log('🔍 No contact moments found via normal query, trying backup method...')
            try {
              const allContacts = await FirebaseClientService.getAllContactMoments()
              console.log(`🔍 Total contact moments loaded: ${allContacts.length}`)
              console.log(`🔍 All contact customer_ids:`, allContacts.map((contact: any) => contact.customer_id))
              
              cm = allContacts.filter((contact: any) => contact.customer_id === decodedId)
              console.log(`✅ Loaded ${cm.length} contact moments via backup method for customer ${params.id}`)
            } catch (backupError) {
              console.log('❌ Backup method also failed:', backupError.message)
              cm = []
            }
          }
        } catch (error) {
          console.log('🔍 Contact moments query failed, trying backup method...')
          // Backup: load all contact moments and filter client-side
          try {
            const allContacts = await FirebaseClientService.getAllContactMoments()
            console.log(`🔍 Total contact moments loaded: ${allContacts.length}`)
            console.log(`🔍 All contact customer_ids:`, allContacts.map((contact: any) => contact.customer_id))
            
            cm = allContacts.filter((contact: any) => contact.customer_id === params.id)
            console.log(`✅ Loaded ${cm.length} contact moments via backup method for customer ${params.id}`)
          } catch (backupError) {
            console.log('❌ Backup method also failed:', backupError.message)
            cm = []
          }
        } finally {
          setContactMomentsLoading(false)
        }
        setCustomer(c)
        setOrders(Array.isArray(o) ? o : [])
        setVisits(Array.isArray(v) ? v : [])
        setContactMoments(Array.isArray(cm) ? cm : [])
        
        console.log('🔍 Final state after loading:')
        console.log('  - Customer:', (c as any)?.name || 'No customer')
        console.log('  - Visits loaded:', v.length)
        console.log('  - Contact moments loaded:', cm.length)
        console.log('  - Visit types loaded:', vt.length)
        console.log('  - Contact moment types loaded:', cmt.length)

         // Load documents for this customer
         try {
           const customerDocs = await FirebaseClientService.getDocuments({ customerId: decodedId })
          setDocuments(customerDocs)
          console.log(`✅ Loaded ${customerDocs.length} documents for customer ${params.id}`)
        } catch (error) {
          console.log('🔍 Error loading documents:', error.message)
          setDocuments([])
        }

         // Load document meta (categories/permissions) for modal selects
         try {
           const [cats, perms] = await Promise.all([
             FirebaseClientService.getDocumentCategories(),
             FirebaseClientService.getDocumentPermissions()
           ])
           setDocCategories(Array.isArray(cats) ? cats as any[] : [])
           setDocPermissions(Array.isArray(perms) ? perms as any[] : [])
         } catch (_) {
           setDocCategories([])
           setDocPermissions([])
         }
        
        // Load CRM types
        const visitTypesDoc = vt.find(doc => doc.id === 'visit_types')
        if (visitTypesDoc && visitTypesDoc.data?.types) {
          console.log('🔍 Loaded visit types:', visitTypesDoc.data.types)
          setVisitTypes(visitTypesDoc.data.types)
        } else {
          console.log('⚠️ No visit types found, using defaults')
          setVisitTypes([])
        }
        
        const contactTypesDoc = cmt.find(doc => doc.id === 'contact_moment_types')
        if (contactTypesDoc && contactTypesDoc.data?.types) {
          console.log('🔍 Loaded contact moment types:', contactTypesDoc.data.types)
          setContactMomentTypes(contactTypesDoc.data.types)
        } else {
          console.log('⚠️ No contact moment types found, using defaults')
          setContactMomentTypes([])
        }
        const st = (s as { targetGold?: number; targetSilver?: number; targetBronze?: number; customerGroups?: any[] }) || null
setTargets({
  gold: Number(st?.targetGold ?? 30),
  silver: Number(st?.targetSilver ?? 20),
  bronze: Number(st?.targetBronze ?? 10),
})
        // Build group targets map if available in settings
        try {
          const groups = Array.isArray((s as any)?.customerGroups) ? (s as any).customerGroups : []
          const map: Record<string, number> = {}
          for (const g of groups) {
            const rawName = (g as any)?.name || (g as any)?.group_name || (g as any)?.title || (g as any)?.label
            const key = normalize(rawName)
            const t = Number((g as any)?.annual_target_sets ?? (g as any)?.target ?? 0)
            if (key) map[key] = t
          }
          setGroupTargets(map)
        } catch {}
      } finally { setLoading(false) }
    }
    load()
  }, [decodedId])

  // Also load direct customer_groups collection to ensure latest targets
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await FirebaseClientService.getCustomerGroups()
        const map: Record<string, number> = {}
        for (const g of (groups || []) as any[]) {
          const rawName = (g as any)?.name || (g as any)?.group_name || (g as any)?.title || (g as any)?.label
          const key = normalize(rawName)
          const t = Number((g as any)?.annual_target_sets ?? (g as any)?.target ?? 0)
          if (key) map[key] = t
        }
        if (Object.keys(map).length > 0) setGroupTargets(map)
      } catch {}
    }
    loadGroups()
  }, [])

  // Resolve target directly from groups for this customer
  useEffect(() => {
    const run = async () => {
      try {
        if (!customer) { setResolvedTarget(0); return }
        const groups = await FirebaseClientService.getCustomerGroups()
        const key = normalize(customer.dealer_group)
        let val = 0
        for (const g of (groups || []) as any[]) {
          const name = normalize((g as any)?.name || (g as any)?.group_name || (g as any)?.title || (g as any)?.label)
          if (name === key) {
            val = Number((g as any)?.annual_target_sets ?? (g as any)?.target ?? 0)
            break
          }
        }
        setResolvedTarget(Number(val || 0))
      } catch { setResolvedTarget(0) }
    }
    run()
  }, [customer])

  // Load appointments (separate effect – robust tegen andere laadtaken)
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true)
        const from = new Date(2000, 0, 1).toISOString()
        const res = await fetch(`/api/crm/appointments?customer_id=${encodeURIComponent(decodedId)}&from=${encodeURIComponent(from)}`)
        const list = res.ok ? await res.json() : []
        setAppointments(Array.isArray(list) ? list : [])
      } catch (e) {
        console.log('⚠️ Error loading appointments', (e as any)?.message)
        setAppointments([])
      } finally {
        setAppointmentsLoading(false)
      }
    }
    if (decodedId) loadAppointments()
  }, [decodedId])

  // Delete functions
  const handleDeleteVisit = async (visitId: string) => {
    if (confirm('Weet je zeker dat je dit bezoek wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteVisit(visitId)
        setVisits(prev => prev.filter(v => v.id !== visitId))
      } catch (error) {
        console.error('Error deleting visit:', error)
        alert('Fout bij het verwijderen van bezoek')
      }
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Weet je zeker dat je dit contactmoment wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteContactMoment(contactId)
        setContactMoments(prev => prev.filter(c => c.id !== contactId))
      } catch (error) {
        console.error('Error deleting contact moment:', error)
        alert('Fout bij het verwijderen van contactmoment')
      }
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteDocumentById(id)
        setDocuments(prev => prev.filter(doc => doc.id !== id))
      } catch (error) {
        console.error('Error deleting document:', error)
        alert('Fout bij het verwijderen van document')
      }
    }
  }

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
    const clean = normalize(customer.dealer_group)
    const fromMap = Number(groupTargets[clean] || 0)
    const targetVal = Number(resolvedTarget || fromMap || 0)
    if (process.env.NODE_ENV !== 'production') {
      // Basic debug in dev to verify mapping
      console.log('CRM detail target mapping', { clean, groupTargets })
    }
    const pct = targetVal > 0 ? Math.min(100, Math.round((qty / targetVal) * 100)) : 0
    return { setsSold: qty, target: targetVal, progressPct: pct }
  }, [customer, orders, groupTargets, resolvedTarget, year])

  const lastOrderDate = useMemo(() => {
    if (!customer) return null
    const myOrders = orders.filter(
      (o) => o.customer?.id === customer.id || o.customer?.email === customer.email
    )
    if (myOrders.length === 0) return null
    const latestTs = myOrders.reduce((latest: number, o: any) => {
      const t = new Date(o.createdAt || o.created_at || new Date()).getTime()
      return t > latest ? t : latest
    }, 0)
    return latestTs ? new Date(latestTs) : null
  }, [customer, orders])

  const lastContactDate = useMemo(() => {
    if (!visits.length && !contactMoments.length) return null
    const visitLatest = visits.reduce((latest: number, v: any) => {
      const t = new Date(v.visit_date || v.created_at || 0).getTime()
      return t > latest ? t : latest
    }, 0)
    const contactLatest = contactMoments.reduce((latest: number, c: any) => {
      const t = new Date(c.contact_date || c.created_at || 0).getTime()
      return t > latest ? t : latest
    }, 0)
    const latestTs = Math.max(visitLatest, contactLatest)
    return latestTs ? new Date(latestTs) : null
  }, [visits, contactMoments])

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Sets {year}</div>
            <div className="text-2xl font-bold">{setsSold}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Laatste bestelling</div>
            <div className="text-2xl font-bold">{lastOrderDate ? lastOrderDate.toLocaleDateString('nl-NL') : '-'}</div>
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
            <div className="text-2xl font-bold">{lastContactDate ? lastContactDate.toLocaleDateString('nl-NL') : '-'}</div>
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

        {/* Contactmomenten en Bezoeken */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bezoeken</h2>
              <button
                onClick={() => setShowVisitModal(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                + Nieuw
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <div key={visit.id} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{new Date(visit.visit_date || visit.created_at).toLocaleDateString('nl-NL')}</p>
                        <p className="text-xs text-gray-600">
                          {visitTypes.find(type => type.id === visit.visit_type)?.name || visit.visit_type}
                        </p>
                        <p className="text-sm text-gray-700">{visit.notes}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteVisit(visit.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  {visitsLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <p className="text-sm text-gray-500">Bezoeken laden...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Nog geen bezoeken geregistreerd</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Klik op + Nieuw om een bezoek toe te voegen
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contactmomenten</h2>
              <button
                onClick={() => setShowContactModal(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                + Nieuw
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {contactMoments.length > 0 ? (
                contactMoments.map((contact) => (
                  <div key={contact.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{new Date(contact.contact_date || contact.created_at).toLocaleDateString('nl-NL')}</p>
                        <p className="text-xs text-gray-600">
                          {contactMomentTypes.find(type => type.id === contact.contact_type)?.name || contact.contact_type}
                        </p>
                        <p className="text-sm text-gray-700">{contact.notes}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  {contactMomentsLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">Contactmomenten laden...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Nog geen contactmomenten geregistreerd</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Klik op + Nieuw om een contactmoment toe te voegen
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 min-h-[180px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Afspraken</h2>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                + Nieuw
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {appointments.length > 0 ? (
                appointments.map((a) => (
                  <div key={a.id} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 cursor-pointer" onClick={()=>{ setAppointmentPrefill({ title:a.title, start_at:a.start_at, end_at:a.end_at, location:a.location, notes:a.notes }); setShowAppointmentModal(true); }}>
                        <p className="font-medium text-sm truncate">{a.title || 'Afspraak'}</p>
                        <p className="text-xs text-gray-600">
                          {(a.type || 'call')} • {a.start_at ? new Date(a.start_at).toLocaleString('nl-NL') : '-'}
                          {a.end_at ? ` – ${new Date(a.end_at).toLocaleString('nl-NL')}` : ''}
                        </p>
                        {(a.location || a.meeting_url) && (
                          <p className="text-xs text-gray-500 truncate" title={a.location || a.meeting_url}>
                            {a.location || a.meeting_url}
                          </p>
                        )}
                        {a.notes && (
                          <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{a.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 text-xs rounded bg-white border text-gray-700">{a.status || 'gepland'}</span>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          defaultValue=""
                          onChange={async (e) => {
                            const v = e.target.value
                            e.currentTarget.value = ''
                            if (!v) return
                            if (v === 'sync-google') {
                              await fetch('/api/crm/appointments/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id }) })
                            } else {
                              await fetch('/api/crm/appointments', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: a.id, status: v })
                              })
                            }
                            const res = await fetch(`/api/crm/appointments?customer_id=${encodeURIComponent(decodedId)}`)
                            const list = res.ok ? await res.json() : []
                            setAppointments(Array.isArray(list) ? list : appointments)
                          }}
                        >
                          <option value="">Actie…</option>
                          <option value="bevestigd">Bevestigen</option>
                          <option value="volbracht">Volbracht</option>
                          <option value="no-show">No-show</option>
                          <option value="geannuleerd">Annuleren</option>
                          <option value="sync-google">Synchroniseer met Google</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <p className="text-sm text-gray-500">Afspraken laden...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Nog geen afspraken geregistreerd</p>
                      <p className="text-xs text-gray-400 mt-1">Klik op + Nieuw om een afspraak toe te voegen</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documenten</h2>
              <button
                onClick={() => setShowDocumentModal(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                + Nieuw
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <div key={document.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{document.title}</p>
                        <p className="text-xs text-gray-600">{document.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(document.created_at).toLocaleDateString('nl-NL')} - {(document.file_type || '').toString().toUpperCase()}
                          {document.file_url && (
                            <>
                              {' '}
                              <a href={document.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Bekijken</a>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Nog geen documenten toegevoegd</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Klik op + Nieuw om een document toe te voegen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visit Modal */}
              {showVisitModal && (
          <VisitModal
            customerId={decodedId}
            visitTypes={visitTypes}
            onClose={() => setShowVisitModal(false)}
            onSave={(visit) => {
              setVisits(prev => [visit, ...prev])
              setShowVisitModal(false)
            }}
            onRequestAppointment={(prefill) => {
              setShowVisitModal(false)
              setAppointmentPrefill(prefill)
              setShowAppointmentModal(true)
            }}
          />
        )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          customerId={decodedId}
          contactMomentTypes={contactMomentTypes}
          onClose={() => setShowContactModal(false)}
          onSave={(contact) => {
            setContactMoments(prev => [contact, ...prev])
            setShowContactModal(false)
          }}
          onRequestAppointment={(prefill) => {
            setShowContactModal(false)
            setAppointmentPrefill(prefill)
            setShowAppointmentModal(true)
          }}
        />
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <DocumentModal
          customerId={decodedId}
          customerEmail={customer?.email || ''}
          categories={docCategories}
          permissions={docPermissions}
          onClose={() => setShowDocumentModal(false)}
          onSave={(doc) => {
            setDocuments(prev => [doc, ...prev])
            setShowDocumentModal(false)
          }}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          customerId={decodedId}
          onClose={() => setShowAppointmentModal(false)}
          onSaved={async () => {
            setShowAppointmentModal(false)
            const res = await fetch(`/api/crm/appointments?customer_id=${encodeURIComponent(decodedId)}`)
            const list = res.ok ? await res.json() : []
            setAppointments(Array.isArray(list) ? list : appointments)
            setAppointmentPrefill(null)
          }}
          prefill={appointmentPrefill || undefined}
        />
      )}
    </div>
  )
}

// Appointment Modal Component
interface AppointmentModalProps {
  customerId: string
  onClose: () => void
  onSaved: () => void
  prefill?: {
    title?: string
    start_at?: string
    end_at?: string
    location?: string
    notes?: string
  }
}

function AppointmentModal({ customerId, onClose, onSaved, prefill }: AppointmentModalProps) {
  const initialDuration = (() => {
    if (prefill?.start_at && prefill?.end_at) {
      try {
        const s = new Date(prefill.start_at).getTime()
        const e = new Date(prefill.end_at).getTime()
        const diffMin = Math.max(5, Math.round((e - s) / 60000))
        return diffMin
      } catch { return 15 }
    }
    return 15
  })()
  const [formData, setFormData] = useState({
    title: prefill?.title || '',
    type: 'call',
    start_at: prefill?.start_at || '',
    duration_minutes: initialDuration,
    location: prefill?.location || '',
    meeting_url: '',
    notes: prefill?.notes || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Compute start_at/end_at using duration (supports hele dag)
      let startIso = formData.start_at
      let endIso: string
      const start = new Date(formData.start_at)
      if (Number(formData.duration_minutes) === 1440) {
        const s = new Date(start)
        s.setHours(0,0,0,0)
        const e = new Date(s)
        e.setHours(23,59,59,999)
        startIso = s.toISOString()
        endIso = e.toISOString()
      } else {
        const end = new Date(start.getTime() + (Number(formData.duration_minutes || 0) * 60000))
        endIso = end.toISOString()
      }
      const payload = {
        customer_id: customerId,
        title: formData.title || 'Afspraak',
        type: formData.type,
        start_at: startIso,
        end_at: endIso,
        location: formData.location,
        meeting_url: formData.meeting_url,
        notes: formData.notes
      }
      const res = await fetch('/api/crm/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Fout bij opslaan afspraak')
      onSaved()
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Fout bij het opslaan van afspraak')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Nieuwe Afspraak</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Bijv. Belafspraak"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="call">Telefoon</option>
                <option value="online">Online</option>
                <option value="onsite">Op locatie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duur</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Array.from({ length: 36 }).map((_, idx) => {
                  const minutes = (idx + 1) * 5 // 5..180
                  return <option key={minutes} value={minutes}>{minutes} min</option>
                })}
                <option value={1440}>hele dag</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData(prev => ({ ...prev, start_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Adres of omschrijving"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL</label>
            <input
              value={formData.meeting_url}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Extra informatie…"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Visit Modal Component
interface VisitModalProps {
  customerId: string
  visitTypes: any[]
  onClose: () => void
  onSave: (visit: any) => void
  onRequestAppointment: (prefill: any) => void
}

function VisitModal({ customerId, visitTypes, onClose, onSave, onRequestAppointment }: VisitModalProps) {
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: '',
    notes: '',
    add_appointment: false
  })

  // Update visit_type when visitTypes change
  useEffect(() => {
    if (visitTypes.length > 0 && !formData.visit_type) {
      setFormData(prev => ({ ...prev, visit_type: visitTypes[0].id }))
    }
  }, [visitTypes, formData.visit_type])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const visit = await FirebaseClientService.addVisit({
        customer_id: customerId,
        visit_date: formData.visit_date,
        visit_type: formData.visit_type,
        notes: formData.notes
      })
      onSave(visit)
      if (formData.add_appointment) {
        const start = new Date(formData.visit_date)
        const startIso = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 9, 0, 0).toISOString().slice(0,16)
        const endIso = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 9, 30, 0).toISOString().slice(0,16)
        onRequestAppointment({
          title: 'Bezoek ingepland',
          start_at: startIso,
          end_at: endIso,
          location: '',
          notes: formData.notes || ''
        })
      }
    } catch (error) {
      console.error('Error saving visit:', error)
      alert('Fout bij het opslaan van bezoek')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Nieuw Bezoek</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.visit_type}
              onChange={(e) => setFormData(prev => ({ ...prev, visit_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {visitTypes.length > 0 ? (
                visitTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="visit">Bezoek</option>
                  <option value="call">Telefoongesprek</option>
                  <option value="email">E-mail</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Beschrijf het bezoek of gesprek..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.add_appointment} onChange={(e)=> setFormData(prev=>({...prev, add_appointment: e.target.checked}))} />
            <span>Agendapunt toevoegen</span>
          </label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Document Modal Component
interface DocumentModalProps {
  customerId: string
  customerEmail: string
  categories: any[]
  permissions: any[]
  onClose: () => void
  onSave: (doc: any) => void
}

function DocumentModal({ customerId, customerEmail, categories, permissions, onClose, onSave }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: (categories[0]?.id || 'contracten'),
    permission: (permissions[0]?.id || 'private-customer'),
    active: true,
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Selecteer een bestand')
      return
    }
    setSaving(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('category', formData.category)
      const res = await fetch('/api/documents/upload', { method: 'POST', body })
      if (!res.ok) throw new Error('Upload mislukt')
      const uploaded = await res.json()

      const docData = {
        ...formData,
        file_type: (file.name.split('.').pop() || 'pdf').toLowerCase(),
        file_size: Math.round(file.size / 1024),
        file_url: uploaded.url,
        storage_path: uploaded.storage_path,
        download_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_id: customerId,
        customer_email: customerEmail || undefined,
      }

      const created = await FirebaseClientService.addDocument('documents', docData)
      onSave({ id: (created as any).id, ...docData })
    } catch (err) {
      console.error('Error saving document:', err)
      alert('Fout bij opslaan document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-4">Nieuw Document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input type="text" value={formData.title} onChange={(e)=> setFormData(prev=>({...prev, title:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea value={formData.description} onChange={(e)=> setFormData(prev=>({...prev, description:e.target.value}))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select value={formData.category} onChange={(e)=> setFormData(prev=>({...prev, category:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {categories.map((c:any)=> (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissie</label>
              <select value={formData.permission} onChange={(e)=> setFormData(prev=>({...prev, permission:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {permissions.map((p:any)=> (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bestand</label>
            <input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Annuleren</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">{saving ? 'Opslaan...' : 'Opslaan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contact Modal Component
interface ContactModalProps {
  customerId: string
  contactMomentTypes: any[]
  onClose: () => void
  onSave: (contact: any) => void
  onRequestAppointment: (prefill: any) => void
}

function ContactModal({ customerId, contactMomentTypes, onClose, onSave, onRequestAppointment }: ContactModalProps) {
  const [formData, setFormData] = useState({
    contact_date: new Date().toISOString().split('T')[0],
    contact_type: '',
    notes: '',
    add_appointment: false
  })

  // Update contact_type when contactMomentTypes change
  useEffect(() => {
    if (contactMomentTypes.length > 0 && !formData.contact_type) {
      setFormData(prev => ({ ...prev, contact_type: contactMomentTypes[0].id }))
    }
  }, [contactMomentTypes, formData.contact_type])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const contact = await FirebaseClientService.addContactMoment({
        customer_id: customerId,
        contact_date: formData.contact_date,
        contact_type: formData.contact_type,
        notes: formData.notes
      })
      onSave(contact)
      if (formData.add_appointment) {
        const start = new Date(formData.contact_date)
        const startIso = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 9, 0, 0).toISOString().slice(0,16)
        const endIso = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 9, 30, 0).toISOString().slice(0,16)
        onRequestAppointment({
          title: 'Contactmoment ingepland',
          start_at: startIso,
          end_at: endIso,
          location: '',
          notes: formData.notes || ''
        })
      }
    } catch (error) {
      console.error('Error saving contact moment:', error)
      alert('Fout bij het opslaan van contactmoment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Nieuw Contactmoment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={formData.contact_date}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.contact_type}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {contactMomentTypes.length > 0 ? (
                contactMomentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="phone">Telefoon</option>
                  <option value="email">E-mail</option>
                  <option value="meeting">Vergadering</option>
                  <option value="other">Anders</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Beschrijf het contactmoment..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.add_appointment} onChange={(e)=> setFormData(prev=>({...prev, add_appointment: e.target.checked}))} />
            <span>Agendapunt toevoegen</span>
          </label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


