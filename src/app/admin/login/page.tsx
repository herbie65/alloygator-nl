'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client to prevent hydration mismatch
    setIsClient(true)
    
    // Check if already logged in (v2) - delay to prevent hydration issues
    const checkSession = () => {
      const s = localStorage.getItem('adminSessionV2')
      if (s) {
        try {
          const session = JSON.parse(s)
          if (session?.email && session?.role) {
            console.log('✅ Admin session found, redirecting to admin panel')
            router.push('/admin')
          } else {
            console.log('🔒 Invalid session data, clearing localStorage')
            localStorage.removeItem('adminSessionV2')
          }
        } catch (error) {
          console.error('🔒 Error parsing session:', error)
          localStorage.removeItem('adminSessionV2')
        }
      }
    }

    // Delay the check to prevent hydration issues
    const timer = setTimeout(checkSession, 100)
    return () => clearTimeout(timer)
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }) 
      })
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: Niet-JSON response ontvangen')
      }
      
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: Login mislukt`)
      }
      
      const payload = { email: data.email, role: data.role, loginTime: new Date().toISOString() }
      localStorage.setItem('adminSessionV2', JSON.stringify(payload))
      // Write cookie for middleware (server-side guards)
      document.cookie = `adminSessionV2=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${60*60*8}`
      router.push('/admin')
    } catch (e:any) {
      console.error('Login error:', e)
      setError(e.message || 'Login mislukt')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render the form until we're on the client to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AlloyGator Admin</h1>
          <p className="text-gray-600">Log in om het admin panel te beheren</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="herbert@alloygator.nl"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
