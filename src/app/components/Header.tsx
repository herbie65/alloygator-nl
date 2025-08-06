'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HeaderSettings {
  id: string
  logo_url?: string
  logo_text?: string
  logo_width?: number
  logo_height?: number
  show_cart: boolean
  show_login: boolean
  show_dealer_login: boolean
  created_at: string
  updated_at: string
}

interface NavigationItem {
  id: string
  label: string
  url: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface User {
  id: string
  voornaam: string
  achternaam: string
  email: string
}

export default function Header() {
  const [headerData, setHeaderData] = useState<HeaderSettings | null>(null)
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Clear old localStorage settings to force new header
    localStorage.removeItem('headerSettings')
    localStorage.removeItem('uploadedFiles')
    
    // Load header settings from localStorage (uploaded by admin)
    const savedHeaderSettings = localStorage.getItem('headerSettings')
    if (savedHeaderSettings) {
      try {
        const settings = JSON.parse(savedHeaderSettings)
        
        // If logo_url is a permanent URL, try to find the corresponding blob URL in uploadedFiles
        if (settings.logo_url && settings.logo_url.startsWith('/media/images/')) {
          const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
          const logoFile = uploadedFiles.find((file: any) => file.permanentUrl === settings.logo_url)
          if (logoFile && logoFile.blobUrl) {
            settings.logo_url = logoFile.blobUrl // Use the blob URL for display
          }
        }
        
        setHeaderData(settings)
      } catch (error) {
        console.error('Error loading header settings:', error)
      }
    } else {
      // Use default header data if no settings found
      setHeaderData({
        id: 'default',
        logo_text: 'AlloyGator',
        show_cart: true,
        show_login: true,
        show_dealer_login: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm" data-version="2.0">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Always show */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-600">
                AlloyGator
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/winkel" className="text-gray-700 hover:text-green-600 transition-colors">
              Winkel
            </Link>
            <Link href="/vind-een-dealer" className="text-gray-700 hover:text-green-600 transition-colors">
              Vind een Dealer
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="text-gray-700 hover:text-green-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </Link>

            {/* User Account / Login - Always show new auth system */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors">
                  <span className="hidden md:inline">Hallo, {user.voornaam}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mijn Account
                  </Link>
                  <Link href="/account?tab=orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mijn Bestellingen
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" className="text-gray-700 hover:text-green-600 transition-colors">
                  Inloggen
                </Link>
                <span className="text-gray-400">|</span>
                <Link href="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Registreren
                </Link>
              </div>
            )}

            {/* Dealer Login - Keep separate */}
            <Link href="/dealer-login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Dealer Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 