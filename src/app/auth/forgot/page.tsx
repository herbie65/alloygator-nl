'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      // Gebruik huidige window location voor API call
      const apiUrl = '/api/auth/forgot'
      
      console.log('🔍 API call naar:', apiUrl)
      
      const res = await fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }) 
      })
      
      const data = await res.json()
      let msg = data.message || (res.ok ? 'Als het e‑mailadres bekend is, is er een resetlink verzonden.' : 'Kon geen resetlink verzenden.')
      if (data.resetUrl) {
        msg += `\n\nResetlink (dev): ${data.resetUrl}`
      }
      setMessage(msg)
    } catch (error) {
      console.error('❌ API call error:', error)
      setMessage('Kon geen resetlink verzenden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Wachtwoord vergeten</h1>
        <p className="text-sm text-gray-600 mb-6">Vul je e‑mail in; als deze bij ons bekend is, sturen we een resetlink.</p>
        {message && (
          <div className="mb-4 text-sm text-gray-700 whitespace-pre-wrap">
            {message}
            {message.includes('http') && (
              <div className="mt-2 text-green-700">
                <a className="underline" href={message.split('http').slice(1).join('http').trim()}>
                  Open resetlink
                </a>
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E‑mail</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded py-2 disabled:opacity-50">
            {loading ? 'Bezig…' : 'Resetlink versturen'}
          </button>
        </form>
      </div>
    </div>
  )
}


