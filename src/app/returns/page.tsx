'use client'

import { useState } from 'react'
import SEO from '../components/SEO'
import { generateWebPageData } from '../lib/structured-data'

type FormState = {
  orderNumber: string
  customerName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  item: string
  quantity: number
  purchaseDate: string
  reason: string
  condition: string
  preferredResolution: 'refund' | 'exchange' | 'repair' | 'other'
  iban: string
  accountHolder: string
  notes: string
}

export default function ReturnsPage() {
  const initialForm: FormState = {
    orderNumber: '', customerName: '', email: '', phone: '', address: '', postalCode: '', city: '',
    item: '', quantity: 1, purchaseDate: '', reason: '', condition: '', preferredResolution: 'refund',
    iban: '', accountHolder: '', notes: ''
  }
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [rmaNumber, setRmaNumber] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || submittedId) return
    setSubmitting(true)
    setError('')
    setSubmittedId(null)
    try {
      const res = await fetch('/api/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Versturen mislukt')
      setSubmittedId(json.id)
      setRmaNumber(json.rmaNumber)
      setForm(initialForm) // reset na succesvolle verzending
    } catch (e: any) {
      setError(e.message || 'Er ging iets mis')
    } finally {
      setSubmitting(false)
    }
  }

  const startNew = () => {
    setSubmittedId(null)
    setRmaNumber(null)
    setForm(initialForm)
    setError('')
  }

  return (
    <>
      <SEO 
        title="Retourbeleid - Veilig & Eenvoudig Retourneren | AlloyGator"
        description="Bij AlloyGator Nederland staan klanttevredenheid en service centraal. Herroepingsrecht 14 dagen, eenvoudig retourneren en volledige terugbetaling."
        keywords="retourbeleid alloygator, velgbescherming retourneren, herroepingsrecht 14 dagen, retourvoorwaarden, klanttevredenheid"
        canonical="/returns"
        structuredData={generateWebPageData({
          name: "Retourbeleid - Veilig & Eenvoudig Retourneren",
          description: "Retourvoorwaarden en herroepingsrecht voor AlloyGator producten",
          url: "/returns",
          breadcrumb: {
            items: [
              { name: "Home", url: "/" },
              { name: "Retourbeleid", url: "/returns" }
            ]
          }
        })}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Retourbeleid</h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Veilig & Eenvoudig Retourneren</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Bij AlloyGator Nederland staan klanttevredenheid en service centraal. 
            Mocht je onverhoopt niet tevreden zijn met je aankoop, dan kun je je bestelling eenvoudig retourneren.
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Herroepingsrecht (14 dagen)</h3>
                <p className="text-gray-700 mb-4">
                  Je hebt het recht je bestelling tot 14 dagen na ontvangst zonder opgave van reden te annuleren. 
                  Na annulering heb je nogmaals 14 dagen om het product retour te sturen.
                </p>
                <p className="text-sm text-gray-600">
                  Meer info op <a href="/wat-zijn-onze-retourvoorwaarden" className="text-green-600 hover:text-green-700 underline">alligator.nl/wat-zijn-onze-retourvoorwaarden</a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Voorwaarden retourzending</h3>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Product moet ongebruikt zijn</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>In originele, onbeschadigde verpakking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Bewaar je verzendbewijs als retourbewijs</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                <strong>Na ontvangst en controle</strong> van het geretourneerde product krijg je het volledige aankoopbedrag 
                inclusief eventuele standaard verzendkosten teruggestort via dezelfde betaalmethode.
              </p>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Retouradres</h4>
              <p className="text-gray-700">
                AlloyGator Nederland<br />
                Kweekgrasstraat 36<br />
                1335 WL Almere
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Voor retouraanmelding of vragen neem contact op via <a href="mailto:info@alloygator.nl" className="text-green-600 hover:text-green-700">info@alloygator.nl</a>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Retouraanvraag</h3>
          <a href="/wysiwyg/forms/Retourformulier_AG.pdf" className="text-green-700 hover:text-green-800 underline" target="_blank" rel="noopener noreferrer">Download PDF-formulier</a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-900">
              <p>
                Handig: je kunt ook het PDF-formulier downloaden en printen:
                {' '}<a href="/wysiwyg/forms/Retourformulier_AG.pdf" target="_blank" rel="noopener noreferrer" className="underline font-medium">Retourformulier_AG.pdf</a>.
                {' '}Bekijk ook onze <a href="/wat-zijn-onze-retourvoorwaarden" className="underline font-medium">retourvoorwaarden</a>.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ordernummer *</label>
                <input value={form.orderNumber} onChange={(e)=>setForm(s=>({...s, orderNumber:e.target.value}))} required className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Naam *</label>
                <input value={form.customerName} onChange={(e)=>setForm(s=>({...s, customerName:e.target.value}))} required className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail *</label>
                <input type="email" value={form.email} onChange={(e)=>setForm(s=>({...s, email:e.target.value}))} required className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefoon</label>
                <input value={form.phone} onChange={(e)=>setForm(s=>({...s, phone:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adres</label>
                  <input value={form.address} onChange={(e)=>setForm(s=>({...s, address:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postcode</label>
                  <input value={form.postalCode} onChange={(e)=>setForm(s=>({...s, postalCode:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plaats</label>
                  <input value={form.city} onChange={(e)=>setForm(s=>({...s, city:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Artikel</label>
                <input value={form.item} onChange={(e)=>setForm(s=>({...s, item:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aantal</label>
                <input type="number" min={1} value={form.quantity} onChange={(e)=>setForm(s=>({...s, quantity:Number(e.target.value||1)}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aankoopdatum</label>
                <input type="date" value={form.purchaseDate} onChange={(e)=>setForm(s=>({...s, purchaseDate:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Staat/conditie</label>
                <input value={form.condition} onChange={(e)=>setForm(s=>({...s, condition:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Reden</label>
                <textarea rows={3} value={form.reason} onChange={(e)=>setForm(s=>({...s, reason:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Voorkeursafhandeling</label>
                <div className="mt-2 flex gap-6 text-sm text-gray-700">
                  {['refund','exchange','repair','other'].map(v=> (
                    <label key={v} className="inline-flex items-center gap-2">
                      <input type="radio" name="resolution" checked={form.preferredResolution===v} onChange={()=>setForm(s=>({...s, preferredResolution: v as any}))} />
                      {v==='refund'?'Terugbetaling':v==='exchange'?'Omruilen':v==='repair'?'Reparatie':'Overig'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IBAN (bij terugbetaling)</label>
                <input value={form.iban} onChange={(e)=>setForm(s=>({...s, iban:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tenaamstelling</label>
                <input value={form.accountHolder} onChange={(e)=>setForm(s=>({...s, accountHolder:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Opmerkingen</label>
                <textarea rows={3} value={form.notes} onChange={(e)=>setForm(s=>({...s, notes:e.target.value}))} className="mt-1 w-full px-4 py-2 border rounded" />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {submittedId && (
              <div className="text-green-700 text-sm">
                Dank je! Je aanvraag is ontvangen.<br/>
                {rmaNumber && <><strong>RMA:</strong> {rmaNumber}<br/></>}
                Referentie: {submittedId}
              </div>
            )}

            <div className="pt-4 flex gap-4 items-center">
              {!submittedId ? (
                <button disabled={submitting || !!submittedId} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded disabled:opacity-60">
                  {submitting ? 'Versturen...' : 'Aanvraag versturen'}
                </button>
              ) : (
                <>
                  <button type="button" onClick={startNew} className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded border">
                    Nieuwe aanvraag
                  </button>
                  <a href="/wat-zijn-onze-retourvoorwaarden" className="text-green-700 underline">Retourvoorwaarden</a>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}


