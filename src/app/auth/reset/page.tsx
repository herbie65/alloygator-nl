"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail(params.get('email') || '')
    setToken(params.get('token') || '')
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Reset mislukt')
      setMessage('Wachtwoord aangepast. Je kunt nu inloggen.')
      setTimeout(() => router.push('/auth/login'), 1200)
    } catch (e: any) {
      setMessage(e.message || 'Reset mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nieuw wachtwoord</h1>
        <p className="text-sm text-gray-600 mb-6">Kies een nieuw wachtwoord voor {email || 'je account'}.</p>
        {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nieuw wachtwoord</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded py-2 disabled:opacity-50">
            {loading ? 'Bezig…' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}


