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
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    setEmail(params.get('email') || '')
    setToken(params.get('token') || '')
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrors([])
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors)
        } else {
          throw new Error(data?.message || 'Reset mislukt')
        }
        return
      }
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
        
        {/* Wachtwoord vereisten */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Wachtwoord moet voldoen aan:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Minimaal 8 karakters</li>
            <li>• Minimaal 1 hoofdletter (A-Z)</li>
            <li>• Minimaal 1 kleine letter (a-z)</li>
            <li>• Minimaal 1 cijfer (0-9)</li>
          </ul>
        </div>

        {message && <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-md">{message}</div>}
        
        {errors.length > 0 && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-md">
            <h4 className="font-medium mb-2">Wachtwoord voldoet niet aan de vereisten:</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nieuw wachtwoord</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              required 
            />
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


