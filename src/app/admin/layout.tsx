'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      const sessionData = JSON.parse(adminSession)
      if (sessionData.isLoggedIn && sessionData.username === 'admin') {
        setIsLoggedIn(true)
      } else {
        router.push('/admin/login')
      }
    } else {
      router.push('/admin/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Admin panel laden...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { name: 'Producten', href: '/admin/products', icon: '📦' },
    { name: 'Klanten', href: '/admin/customers', icon: '👥' },
    { name: 'Bestellingen', href: '/admin/orders', icon: '🛒' },
    { name: 'CRM', href: '/admin/crm', icon: '🤝' },
    { name: 'CMS', href: '/admin/cms', icon: '📝' },
    { name: 'Instellingen', href: '/admin/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AlloyGator Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welkom, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 