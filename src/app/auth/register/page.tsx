'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    voornaam: '',
    achternaam: '',
    email: '',
    telefoon: '',
    password: '',
    confirmPassword: '',
    adres: '',
    postcode: '',
    plaats: '',
    land: 'Nederland',
    bedrijfsnaam: '',
    btwNummer: '',
    acceptTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      setError('Je moet akkoord gaan met de voorwaarden')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters bevatten')
      setLoading(false)
      return
    }

    // Check if user already exists in localStorage
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const existingUser = existingUsers.find((user: any) => user.email === formData.email)
    
    if (existingUser) {
      setError('E-mailadres is al in gebruik')
      setLoading(false)
      return
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      voornaam: formData.voornaam,
      achternaam: formData.achternaam,
      email: formData.email,
      telefoon: formData.telefoon,
      adres: formData.adres,
      postcode: formData.postcode,
      plaats: formData.plaats,
      land: formData.land,
      bedrijfsnaam: formData.bedrijfsnaam || '',
      btwNummer: formData.btwNummer || '',
      password: formData.password,
      created_at: new Date().toISOString()
    }

    // Save user to localStorage
    existingUsers.push(newUser)
    localStorage.setItem('users', JSON.stringify(existingUsers))

    // Store current user session
    const { password, ...userWithoutPassword } = newUser
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword))
    localStorage.setItem('isLoggedIn', 'true')
    
    // Redirect to account page
    router.push('/account')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" data-version="4.0">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account aanmaken
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Of{' '}
            <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
              log in met je bestaande account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="voornaam" className="block text-sm font-medium text-gray-700">
                  Voornaam *
                </label>
                <input
                  id="voornaam"
                  name="voornaam"
                  type="text"
                  required
                  value={formData.voornaam}
                  onChange={(e) => setFormData({ ...formData, voornaam: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="achternaam" className="block text-sm font-medium text-gray-700">
                  Achternaam *
                </label>
                <input
                  id="achternaam"
                  name="achternaam"
                  type="text"
                  required
                  value={formData.achternaam}
                  onChange={(e) => setFormData({ ...formData, achternaam: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mailadres *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="telefoon" className="block text-sm font-medium text-gray-700">
                Telefoonnummer *
              </label>
              <input
                id="telefoon"
                name="telefoon"
                type="tel"
                required
                value={formData.telefoon}
                onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="bedrijfsnaam" className="block text-sm font-medium text-gray-700">
                Bedrijfsnaam (optioneel)
              </label>
              <input
                id="bedrijfsnaam"
                name="bedrijfsnaam"
                type="text"
                value={formData.bedrijfsnaam}
                onChange={(e) => setFormData({ ...formData, bedrijfsnaam: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="btwNummer" className="block text-sm font-medium text-gray-700">
                BTW-nummer (optioneel)
              </label>
              <input
                id="btwNummer"
                name="btwNummer"
                type="text"
                value={formData.btwNummer}
                onChange={(e) => setFormData({ ...formData, btwNummer: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="adres" className="block text-sm font-medium text-gray-700">
                Adres *
              </label>
              <input
                id="adres"
                name="adres"
                type="text"
                required
                value={formData.adres}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                  Postcode *
                </label>
                <input
                  id="postcode"
                  name="postcode"
                  type="text"
                  required
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="plaats" className="block text-sm font-medium text-gray-700">
                  Plaats *
                </label>
                <input
                  id="plaats"
                  name="plaats"
                  type="text"
                  required
                  value={formData.plaats}
                  onChange={(e) => setFormData({ ...formData, plaats: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="land" className="block text-sm font-medium text-gray-700">
                  Land *
                </label>
                <select
                  id="land"
                  name="land"
                  required
                  value={formData.land}
                  onChange={(e) => setFormData({ ...formData, land: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Nederland">Nederland</option>
                  <option value="België">België</option>
                  <option value="Duitsland">Duitsland</option>
                  <option value="Frankrijk">Frankrijk</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Wachtwoord *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bevestig wachtwoord *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
              Ik ga akkoord met de{' '}
              <Link href="/algemene-voorwaarden" className="text-green-600 hover:text-green-500">
                algemene voorwaarden
              </Link>
              {' '}en{' '}
              <Link href="/privacy-policy" className="text-green-600 hover:text-green-500">
                privacy policy
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 