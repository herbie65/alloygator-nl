"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // Simple login check
  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true)
      setMessage('Succesvol ingelogd!')
      // Save login status to localStorage
      localStorage.setItem('adminLoggedIn', 'true')
    } else {
      setMessage('Ongeldige inloggegevens')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setMessage('Uitgelogd')
    // Remove login status from localStorage
    localStorage.removeItem('adminLoggedIn')
  }

  // Check if user is already logged in on component mount
  useEffect(() => {
    const savedLoginStatus = localStorage.getItem('adminLoggedIn')
    if (savedLoginStatus === 'true') {
      setIsLoggedIn(true)
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          {message && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="admin123"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Inloggen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Uitloggen
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/analytics" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
                  <p className="text-gray-600">Verkoop statistieken en inzichten</p>
                </div>
              </div>
            </Link>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Bestellingen</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-blue-700">Totaal bestellingen</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Klanten</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-green-700">Totaal klanten</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Producten</h3>
              <p className="text-3xl font-bold text-purple-600">4</p>
              <p className="text-sm text-purple-700">Totaal producten</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900">Klantgroepen</h3>
              <p className="text-3xl font-bold text-orange-600">0</p>
              <p className="text-sm text-orange-700">Totaal groepen</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Systeem Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-green-900">Website</h3>
                <p className="text-sm text-green-700">Online en functioneel</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-green-900">Registratie</h3>
                <p className="text-sm text-green-700">Client-side authentication actief</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-yellow-900">Database</h3>
                <p className="text-sm text-yellow-700">Statische data - Firebase uitgeschakeld</p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <h3 className="font-semibold text-blue-900">Bekijk Website</h3>
              <p className="text-sm text-blue-700">Ga naar de hoofdpagina</p>
            </Link>
            <Link href="/winkel" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <h3 className="font-semibold text-green-900">Bekijk Winkel</h3>
              <p className="text-sm text-green-700">Bekijk de producten</p>
            </Link>
            <Link href="/admin/analytics" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <h3 className="font-semibold text-purple-900">Analytics</h3>
              <p className="text-sm text-purple-700">Bekijk statistieken</p>
            </Link>
            <Link href="/admin/settings" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <h3 className="font-semibold text-orange-900">Instellingen</h3>
              <p className="text-sm text-orange-700">Beheer instellingen</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 