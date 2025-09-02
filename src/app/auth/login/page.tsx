'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Inloggen mislukt')
      // Verwijder ALLE oude klantgegevens en winkelwagen bij nieuwe login
      localStorage.removeItem('alloygator-cart')
      localStorage.removeItem('dealerDiscount')
      localStorage.removeItem('dealerEmail')
      localStorage.removeItem('dealerName')
      localStorage.removeItem('dealerGroup')
      
      // Save lightweight session for UI
      localStorage.setItem('isLoggedIn', '1')
      localStorage.setItem('currentUser', JSON.stringify({
        id: data.user.id,
        voornaam: data.user.voornaam || data.user.name || '',
        achternaam: data.user.achternaam || '',
        email,
        telefoon: data.user.telefoon || '',
        adres: data.user.adres || '',
        postcode: data.user.postcode || '',
        plaats: data.user.plaats || '',
        land: data.user.land || 'Nederland',
        company_name: data.user.company_name || '',
        invoice_email: data.user.invoice_email || '',
        vat_number: data.user.vat_number || '',
        separate_shipping_address: !!data.user.separate_shipping_address,
        shipping_address: data.user.shipping_address || '',
        shipping_postal_code: data.user.shipping_postal_code || '',
        shipping_city: data.user.shipping_city || '',
        shipping_country: data.user.shipping_country || '',
        is_dealer: !!data.user.is_dealer,
        dealer_group: data.user.dealer_group || ''
      }))
      
      // Trigger custom event to notify Header component
      window.dispatchEvent(new Event('user-login'))
      
      // Redirect: dealers naar account (met dealer-sectie), particulieren idem
      router.push('/account')
    } catch (e:any) {
      setError(e.message || 'Inloggen mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Inloggen</h1>
        <p className="text-sm text-gray-600 mb-6">Log in om uw bestellingen en gegevens te bekijken.</p>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E‑mail</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Wachtwoord</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded py-2 disabled:opacity-50">
            {loading ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/auth/forgot" className="text-sm text-green-700 hover:text-green-800">Wachtwoord vergeten?</a>
        </div>
      </div>
    </div>
  )
}


