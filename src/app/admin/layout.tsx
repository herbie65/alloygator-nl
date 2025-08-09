'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavigationItem {
  name: string
  href: string
  icon: string
  color: string
  children?: NavigationItem[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<string[]>(['klanten'])

  useEffect(() => {
    // Hide header and footer for admin pages
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    
    if (header) header.style.display = 'none'
    if (footer) footer.style.display = 'none'

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
    }, 500)

    // Cleanup function to restore header and footer
    return () => {
      if (header) header.style.display = ''
      if (footer) footer.style.display = ''
    }
  }, [])

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: '📊',
      color: 'bg-blue-500'
    },
    { 
      name: 'Klanten', 
      href: '#', 
      icon: '👥',
      color: 'bg-green-500',
      children: [
        { name: 'Klanten Overzicht', href: '/admin/customers', icon: '👤', color: 'bg-green-400' },
        { name: 'Klantgroepen', href: '/admin/customer-groups', icon: '🏷️', color: 'bg-green-400' },
        { name: 'CRM', href: '/admin/crm', icon: '🤝', color: 'bg-green-400' }
      ]
    },
    { 
      name: 'Producten', 
      href: '#', 
      icon: '📦',
      color: 'bg-purple-500',
      children: [
        { name: 'Producten Overzicht', href: '/admin/products', icon: '📦', color: 'bg-purple-400' },
        { name: 'Categorieën', href: '/admin/categories', icon: '📁', color: 'bg-purple-400' }
      ]
    },
    { 
      name: 'Bestellingen', 
      href: '/admin/orders', 
      icon: '🛒',
      color: 'bg-orange-500'
    },
    { 
      name: 'Content', 
      href: '#', 
      icon: '📝',
      color: 'bg-indigo-500',
      children: [
        { name: 'CMS Pagina\'s', href: '/admin/cms', icon: '📄', color: 'bg-indigo-400' },
        { name: 'Dealers', href: '/admin/dealers', icon: '🏢', color: 'bg-indigo-400' },
        { name: 'Instellingen', href: '/admin/settings', icon: '⚙️', color: 'bg-indigo-400' },
        { name: 'Kleuren', href: '/admin/settings/colors', icon: '🎨', color: 'bg-indigo-400' }
      ]
    },
    { 
      name: 'Tools', 
      href: '#', 
      icon: '🛠️',
      color: 'bg-gray-500',
      children: [
        { name: 'Analytics', href: '/admin/analytics', icon: '📈', color: 'bg-gray-400' },
        { name: 'Test', href: '/admin/test', icon: '🧪', color: 'bg-gray-400' },
        { name: 'Simple Test', href: '/admin/simple', icon: '✅', color: 'bg-gray-400' }
      ]
    }
  ]

  const isActive = (href: string) => pathname === href
  const isChildActive = (item: NavigationItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.href))
    }
    return isActive(item.href)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-lg mr-3 flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-white">AlloyGator Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-100">Welkom, Admin</span>
              <a 
                href="/"
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors text-sm"
              >
                Terug naar Site
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {navigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedSections.includes(item.name.toLowerCase())
                const isActiveItem = isChildActive(item)

                return (
                  <div key={item.name}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => toggleSection(item.name.toLowerCase())}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActiveItem
                              ? `${item.color} text-white shadow-md`
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-md mr-3 flex items-center justify-center text-white text-xs font-bold ${item.color}`}>
                              {item.name.charAt(0)}
                            </div>
                            {item.name}
                          </div>
                          <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-1">
                            {item.children!.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                                  isActive(child.href)
                                    ? `${child.color} text-white shadow-md`
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center text-white text-xs font-bold ${child.color}`}>
                                  {child.name.charAt(0)}
                                </div>
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive(item.href)
                            ? `${item.color} text-white shadow-md`
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md mr-3 flex items-center justify-center text-white text-xs font-bold ${item.color}`}>
                          {item.name.charAt(0)}
                        </div>
                        {item.name}
                      </Link>
                    )}
                  </div>
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