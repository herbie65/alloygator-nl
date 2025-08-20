'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

// Firebase config - werkt zowel lokaal als live via environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Check if already logged in (v2)
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
  }, [mounted, router])

  // Check if user is admin based on email
  const isAdminEmail = (email: string): boolean => {
    const adminEmails = [
      'info@alloygator.nl',
      'admin@alloygator.nl',
      // Voeg meer admin emails toe als nodig
    ]
    return adminEmails.includes(email.toLowerCase().trim())
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      console.log('🔐 Attempting Firebase login for:', email)
      
      // Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      console.log('✅ Firebase login successful:', user.email)
      
      // Check if user is admin
      if (!isAdminEmail(user.email || '')) {
        await auth.signOut() // Sign out non-admin user
        throw new Error('Geen admin-toegang voor dit account')
      }
      
      // Create admin session
      const role = 'admin' // Default role for admin emails
      const payload = { 
        email: user.email, 
        role, 
        loginTime: new Date().toISOString(),
        uid: user.uid 
      }
      
      // Save to localStorage
      localStorage.setItem('adminSessionV2', JSON.stringify(payload))
      
      // Set cookie for middleware (server-side guards)
      document.cookie = `adminSessionV2=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${60*60*8}`
      
      console.log('✅ Admin session created, redirecting to admin panel')
      router.push('/admin')
      
    } catch (e: any) {
      console.error('❌ Login error:', e)
      
      // Firebase error handling
      let errorMessage = 'Login mislukt'
      
      if (e.code === 'auth/user-not-found') {
        errorMessage = 'Gebruiker niet gevonden'
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = 'Onjuist wachtwoord'
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'Ongeldig e-mailadres'
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = 'Te veel mislukte pogingen. Probeer later opnieuw.'
      } else if (e.message) {
        errorMessage = e.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
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
              placeholder="Voer je e-mailadres in"
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
              placeholder="Voer je wachtwoord in"
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
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Firebase Direct Auth - v2.0</p>
        </div>
      </div>
    </div>
  )
}