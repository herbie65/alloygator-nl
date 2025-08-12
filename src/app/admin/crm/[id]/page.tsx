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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [c, o, s, vt, cmt] = await Promise.all([
          FirebaseClientService.getCustomerById(params.id),
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
          v = await FirebaseClientService.getVisits(params.id)
          console.log(`✅ Loaded ${v.length} visits via normal query`)
          
          // If no visits found, try fallback method
          if (v.length === 0) {
            console.log('🔍 No visits found via normal query, trying fallback method...')
            try {
              const allVisits = await FirebaseClientService.getAllVisits()
              console.log(`🔍 Total visits loaded: ${allVisits.length}`)
              console.log(`🔍 All visit customer_ids:`, allVisits.map((visit: any) => visit.customer_id))
              
              v = allVisits.filter((visit: any) => visit.customer_id === params.id)
              console.log(`✅ Loaded ${v.length} visits via fallback method for customer ${params.id}`)
            } catch (fallbackError) {
              console.log('❌ Fallback method also failed:', fallbackError.message)
              v = []
            }
          }
        } catch (error) {
          console.log('🔍 Visits query failed, trying fallback method...')
          // Fallback: load all visits and filter client-side
          try {
            const allVisits = await FirebaseClientService.getAllVisits()
            console.log(`🔍 Total visits loaded: ${allVisits.length}`)
            console.log(`🔍 All visit customer_ids:`, allVisits.map((visit: any) => visit.customer_id))
            
            v = allVisits.filter((visit: any) => visit.customer_id === params.id)
            console.log(`✅ Loaded ${v.length} visits via fallback method for customer ${params.id}`)
          } catch (fallbackError) {
            console.log('❌ Fallback method also failed:', fallbackError.message)
            v = []
          }
        } finally {
          setVisitsLoading(false)
        }
        
        setContactMomentsLoading(true)
        try {
          // Try the normal query first
          cm = await FirebaseClientService.getContactMoments(params.id)
          console.log(`✅ Loaded ${cm.length} contact moments via normal query`)
          
          // If no contact moments found, try fallback method
          if (cm.length === 0) {
            console.log('🔍 No contact moments found via normal query, trying fallback method...')
            try {
              const allContacts = await FirebaseClientService.getAllContactMoments()
              console.log(`🔍 Total contact moments loaded: ${allContacts.length}`)
              console.log(`🔍 All contact customer_ids:`, allContacts.map((contact: any) => contact.customer_id))
              
              cm = allContacts.filter((contact: any) => contact.customer_id === params.id)
              console.log(`✅ Loaded ${cm.length} contact moments via fallback method for customer ${params.id}`)
            } catch (fallbackError) {
              console.log('❌ Fallback method also failed:', fallbackError.message)
              cm = []
            }
          }
        } catch (error) {
          console.log('🔍 Contact moments query failed, trying fallback method...')
          // Fallback: load all contact moments and filter client-side
          try {
            const allContacts = await FirebaseClientService.getAllContactMoments()
            console.log(`🔍 Total contact moments loaded: ${allContacts.length}`)
            console.log(`🔍 All contact customer_ids:`, allContacts.map((contact: any) => contact.customer_id))
            
            cm = allContacts.filter((contact: any) => contact.customer_id === params.id)
            console.log(`✅ Loaded ${cm.length} contact moments via fallback method for customer ${params.id}`)
          } catch (fallbackError) {
            console.log('❌ Fallback method also failed:', fallbackError.message)
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
           const customerDocs = await FirebaseClientService.getDocuments({ customerId: params.id })
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
        const st = (s as { targetGold?: number; targetSilver?: number; targetBronze?: number }) || null
setTargets({
  gold: Number(st?.targetGold ?? 30),
  silver: Number(st?.targetSilver ?? 20),
  bronze: Number(st?.targetBronze ?? 10),
})
      } finally { setLoading(false) }
    }
    load()
  }, [params.id])

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
    const g = (customer.dealer_group || '').toLowerCase()
  const clean = g.replace(/dealers?|groep|group/g,'').trim()
  const targetVal = clean.includes('gold') || clean.includes('goud') ? targets.gold : clean.includes('silver') || clean.includes('zilver') ? targets.silver : clean.includes('bronze') || clean.includes('brons') ? targets.bronze : 0
    const pct = targetVal > 0 ? Math.min(100, Math.round((qty / targetVal) * 100)) : 0
    return { setsSold: qty, target: targetVal, progressPct: pct }
  }, [customer, orders, targets, year])

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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Afspraken</h2>
            <p className="text-sm text-gray-500">Agenda integratie (later).</p>
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
            customerId={params.id}
            visitTypes={visitTypes}
            onClose={() => setShowVisitModal(false)}
            onSave={(visit) => {
              setVisits(prev => [visit, ...prev])
              setShowVisitModal(false)
            }}
          />
        )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          customerId={params.id}
          contactMomentTypes={contactMomentTypes}
          onClose={() => setShowContactModal(false)}
          onSave={(contact) => {
            setContactMoments(prev => [contact, ...prev])
            setShowContactModal(false)
          }}
        />
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <DocumentModal
          customerId={params.id}
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
    </div>
  )
}

// Visit Modal Component
interface VisitModalProps {
  customerId: string
  visitTypes: any[]
  onClose: () => void
  onSave: (visit: any) => void
}

function VisitModal({ customerId, visitTypes, onClose, onSave }: VisitModalProps) {
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: '',
    notes: ''
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
}

function ContactModal({ customerId, contactMomentTypes, onClose, onSave }: ContactModalProps) {
  const [formData, setFormData] = useState({
    contact_date: new Date().toISOString().split('T')[0],
    contact_type: '',
    notes: ''
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


