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

export default function Header() {
  const [headerData, setHeaderData] = useState<HeaderSettings | null>(null)
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    setLoading(false)
  }, [])

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {headerData?.logo_url ? (
                <img 
                  src={headerData.logo_url} 
                  alt="AlloyGator" 
                  style={{
                    width: `${headerData.logo_width || 150}px`,
                    height: `${headerData.logo_height || 50}px`,
                    objectFit: 'contain'
                  }}
                  className="max-h-12"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const textFallback = document.createElement('div')
                      textFallback.className = 'text-2xl font-bold text-green-600'
                      textFallback.textContent = headerData?.logo_text || 'AlloyGator'
                      parent.appendChild(textFallback)
                    }
                  }}
                />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {headerData?.logo_text || 'AlloyGator'}
                </div>
              )}
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
            {headerData?.show_cart && (
              <Link href="/cart" className="text-gray-700 hover:text-green-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </Link>
            )}

            {headerData?.show_login && (
              <Link href="/dealer-login" className="text-gray-700 hover:text-green-600 transition-colors">
                Login
              </Link>
            )}

            {headerData?.show_dealer_login && (
              <Link href="/dealer-login" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Dealer Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 