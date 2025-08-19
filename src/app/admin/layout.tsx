'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'

interface NavigationItem {
  name: string
  href: string
  icon: string
  color: string
  children?: NavigationItem[]
  badge?: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['klanten', 'instellingen'])
  const [role, setRole] = useState<'admin'|'staff'|'guest'>('guest')
  const [email, setEmail] = useState('')
  const [customerUploadNotifications, setCustomerUploadNotifications] = useState(0)
  const [appointmentsUpcoming, setAppointmentsUpcoming] = useState(0)
  const [appointmentsToday, setAppointmentsToday] = useState(0)

  const logout = () => {
    localStorage.removeItem('adminSessionV2')
    document.cookie = 'adminSessionV2=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setIsAuthenticated(false)
    setRole('guest')
    setEmail('')
    router.push('/admin/login')
  }

  const checkSessionTimeout = () => {
    try {
      const raw = localStorage.getItem('adminSessionV2')
      if (raw) {
        const session = JSON.parse(raw)
        if (session?.loginTime) {
          const loginTime = new Date(session.loginTime).getTime()
          const now = new Date().getTime()
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60)
          
          if (hoursSinceLogin >= 4) {
            setIsAuthenticated(false)
            // Direct logout without calling logout function to avoid recursion
            localStorage.removeItem('adminSessionV2')
            document.cookie = 'adminSessionV2=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            setRole('guest')
            setEmail('')
            router.push('/admin/login')
            return
          }
        }
      }
    } catch (error) {
      setIsAuthenticated(false)
      // Direct logout without calling logout function to avoid recursion
      localStorage.removeItem('adminSessionV2')
      document.cookie = 'adminSessionV2=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      setRole('guest')
      setEmail('')
      router.push('/admin/login')
    }
  }

  useEffect(() => {
    // Hide header and footer for admin pages
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    
    if (header) header.style.display = 'none'
    if (footer) footer.style.display = 'none'

    // Check session timeout every minute
    const interval = setInterval(checkSessionTimeout, 60000)
    
    // Check on user activity (mouse move, key press, etc.)
    const resetTimeout = () => {
      try {
        const raw = localStorage.getItem('adminSessionV2')
        if (raw) {
          const session = JSON.parse(raw)
          if (session?.loginTime) {
            session.loginTime = new Date().toISOString()
            localStorage.setItem('adminSessionV2', JSON.stringify(session))
            document.cookie = `adminSessionV2=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${60*60*8}`
          }
        }
      } catch {}
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true)
    })

    // Cleanup function to restore header and footer
    return () => {
      if (header) header.style.display = ''
      if (footer) footer.style.display = ''
      clearInterval(interval)
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true)
      })
    }
  }, [])

  // Load customer upload notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const count = await FirebaseClientService.getCustomerUploadNotificationCount()
        setCustomerUploadNotifications(count)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
    
    if (isAuthenticated) {
      loadNotifications()
    }
  }, [isAuthenticated])
  useEffect(() => {
    const loadUpcomingAppts = async () => {
      try {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfToday = new Date(startOfToday)
        endOfToday.setHours(23,59,59,999)
        const endOfWeek = new Date(startOfToday)
        endOfWeek.setDate(endOfWeek.getDate() + 7)
        const [resWeek, resToday] = await Promise.all([
          fetch(`/api/crm/appointments?from=${encodeURIComponent(startOfToday.toISOString())}&to=${encodeURIComponent(endOfWeek.toISOString())}&limit=500`),
          fetch(`/api/crm/appointments?from=${encodeURIComponent(startOfToday.toISOString())}&to=${encodeURIComponent(endOfToday.toISOString())}&limit=500`)
        ])
        const listWeek = resWeek.ok ? await resWeek.json() : []
        const listToday = resToday.ok ? await resToday.json() : []
        setAppointmentsUpcoming(Array.isArray(listWeek) ? listWeek.length : 0)
        setAppointmentsToday(Array.isArray(listToday) ? listToday.length : 0)
      } catch {
        setAppointmentsUpcoming(0)
        setAppointmentsToday(0)
      }
    }
    if (isAuthenticated) loadUpcomingAppts()
  }, [isAuthenticated])

  // Separate useEffect for authentication check
  useEffect(() => {
    let mounted = true
    
    // Check if we're on the login page first using window.location
    const currentPath = window.location.pathname
    const isLoginPage = currentPath === '/admin/login'
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('localhost') ||
      window.location.port === '3000' ||
      window.location.port === '3001' ||
      window.location.port === '3002' ||
      window.location.port === '3003' ||
      window.location.port === '3004' ||
      window.location.port === '3005'
    )
    console.log('🔍 Current pathname from window.location:', currentPath)
    console.log('🔍 Is login page?', isLoginPage)
    console.log('🔍 Is localhost?', isLocalhost)
    console.log('🔍 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'undefined')
    console.log('🔍 Port:', typeof window !== 'undefined' ? window.location.port : 'undefined')
    
    if (isLoginPage) {
      console.log('🔍 On login page, setting loading to false')
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }
    
    const checkAuth = () => {
      try {
        console.log('🔍 Starting authentication check...')
        console.log('📍 Current pathname:', currentPath)
        console.log('🔍 isLocalhost value:', isLocalhost)
        console.log('🔍 mounted value:', mounted)
        
        const raw = localStorage.getItem('adminSessionV2')
        if (!raw) {
          // No session found
          console.log('🔒 No admin session found')
          
          // On localhost, allow access without authentication for development
          if (isLocalhost) {
            console.log('🔧 Localhost detected - allowing access for development')
            if (mounted) {
              setRole('admin')
              setEmail('admin@localhost')
              setIsAuthenticated(true)
              setIsLoading(false)
            }
            return
          }
          
          // Redirect to login on production
          console.log('🔒 Redirecting to login')
          if (mounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
            router.push('/admin/login')
          }
          return
        }
        
        const s = JSON.parse(raw)
        if (!s?.email || !s?.role) {
          // Invalid session data
          console.log('🔒 Invalid session data')
          
          // On localhost, allow access without authentication for development
          if (isLocalhost) {
            console.log('🔧 Localhost detected - allowing access for development')
            console.log('🔧 Setting admin role and email')
            if (mounted) {
              setRole('admin')
              setEmail('admin@localhost')
              setIsAuthenticated(true)
              setIsLoading(false)
              console.log('🔧 State updated successfully')
            } else {
              console.log('🔧 Component not mounted, skipping state update')
            }
            return
          }
          
          // Redirect to login on production
          localStorage.removeItem('adminSessionV2')
          if (mounted) {
            setIsAuthenticated(false)
            setIsLoading(false)
            router.push('/admin/login')
          }
          return
        }
        
        // Check if session is expired
        if (s?.loginTime) {
          const loginTime = new Date(s.loginTime).getTime()
          const now = new Date().getTime()
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60)
          
          if (hoursSinceLogin >= 4) {
            // Session expired
            console.log('🔒 Session expired (4+ hours)')
            
            // On localhost, allow access without authentication for development
            if (isLocalhost) {
              console.log('🔧 Localhost detected - allowing access for development')
              console.log('🔧 Setting admin role and email')
              if (mounted) {
                setRole('admin')
                setEmail('admin@localhost')
                setIsAuthenticated(true)
                setIsLoading(false)
                console.log('🔧 State updated successfully')
              } else {
                console.log('🔧 Component not mounted, skipping state update')
              }
              return
            }
            
            // Redirect to login on production
            localStorage.removeItem('adminSessionV2')
            document.cookie = 'adminSessionV2=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            if (mounted) {
              setIsAuthenticated(false)
              setIsLoading(false)
              router.push('/admin/login')
            }
            return
          }
        }
        
        // Valid session, set user data
        console.log('✅ Valid admin session found:', { email: s.email, role: s.role })
        if (mounted) {
          setRole(s.role)
          setEmail(s.email)
          setIsAuthenticated(true)
          setIsLoading(false)
          console.log('✅ State updated with valid session')
        } else {
          console.log('⚠️ Component not mounted, skipping state update')
        }
      } catch (error) {
        // Error parsing session
        console.error('🔒 Error parsing session:', error)
        
        // On localhost, allow access without authentication for development
        if (isLocalhost) {
          console.log('🔧 Localhost detected - allowing access for development')
          console.log('🔧 Setting admin role and email')
          if (mounted) {
            setRole('admin')
            setEmail('admin@localhost')
            setIsAuthenticated(true)
            setIsLoading(false)
            console.log('🔧 State updated successfully')
          } else {
            console.log('🔧 Component not mounted, skipping state update')
          }
          return
        }
        
        // Redirect to login on production
        localStorage.removeItem('adminSessionV2')
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push('/admin/login')
        }
        return
      }
    }
    
    // Check authentication immediately
    console.log('🔍 Calling checkAuth immediately...')
    checkAuth()
    
    // Also listen for storage changes (when user logs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminSessionV2') {
        console.log('🔍 Storage changed, rechecking authentication...')
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      mounted = false
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router]) // Only depend on router, not pathname

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    )
  }

  // Check if we're on the login page
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const isLoginPage = currentPath === '/admin/login'
  
  // If we're on the login page, render children directly without admin layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Show loading state while authentication is being checked
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

  // Show authentication checking state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticatie controleren...</p>
        </div>
      </div>
    )
  }

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: '📊',
      color: 'bg-green-500'
    },
    { 
      name: 'Klanten', 
      href: '#', 
      icon: '👥',
      color: 'bg-green-500',
      children: [
        { name: 'Klanten Overzicht', href: '/admin/customers', icon: '👤', color: 'bg-green-400' },
        { name: 'Klantgroepen', href: '/admin/customer-groups', icon: '🏷️', color: 'bg-green-400' },
        { 
          name: 'CRM', 
          href: '/admin/crm', 
          icon: '🤝', 
          color: 'bg-green-400',
          badge: appointmentsToday > 0 ? String(appointmentsToday) : (customerUploadNotifications > 0 ? String(customerUploadNotifications) : undefined)
        },
        { name: 'Afspraken', href: '/admin/crm/appointments', icon: '📅', color: 'bg-green-400', badge: appointmentsToday > 0 ? String(appointmentsToday) : undefined },
      ]
    },
    { 
      name: 'Producten', 
      href: '#', 
      icon: '📦',
      color: 'bg-purple-500',
      children: [
        { name: 'Producten Overzicht', href: '/admin/products', icon: '📦', color: 'bg-purple-400' },
        { name: 'Categorieën', href: '/admin/categories', icon: '📁', color: 'bg-purple-400' },
        { name: 'Leveranciers', href: '/admin/settings/suppliers', icon: '🏭', color: 'bg-purple-400' }
      ]
    },
    { 
      name: 'Verkopen', 
      href: '#', 
      icon: '💰',
      color: 'bg-orange-500',
      children: [
        { name: 'Bestellingen', href: '/admin/orders', icon: '🛒', color: 'bg-orange-400' },
        { name: 'Facturen', href: '/admin/invoices', icon: '🧾', color: 'bg-orange-400' },
        { name: 'Creditfacturen', href: '/admin/credit-invoices', icon: '🧾', color: 'bg-orange-400' },
        { name: 'Retouren (RMA)', href: '/admin/returns', icon: '↩️', color: 'bg-orange-400' }
      ]
    },
    ...(role === 'admin' ? [{ 
      name: 'Content', 
      href: '#', 
      icon: '📝',
      color: 'bg-green-500',
      children: [
        { name: 'CMS Pagina\'s', href: '/admin/cms', icon: '📄', color: 'bg-green-400' },
        { name: 'Documenten', href: '/admin/documents', icon: '📁', color: 'bg-green-400' },
        // Dealers verwijderd uit Content
        { name: 'Emails', href: '/admin/emails', icon: '✉️', color: 'bg-green-400' },
        { name: 'Media', href: '/admin/media', icon: '🖼️', color: 'bg-green-400' }
      ]
    }] : []),
    ...(role === 'admin' ? [{ 
      name: 'Instellingen', 
      href: '#', 
      icon: '⚙️',
      color: 'bg-teal-500',
      children: [
        { name: 'Algemeen', href: '/admin/settings?tab=general', icon: '⚙️', color: 'bg-teal-400' },
        { name: 'Verzending', href: '/admin/settings?tab=shipping', icon: '🚚', color: 'bg-teal-400' },
        { name: 'Betalingen', href: '/admin/settings?tab=payments', icon: '💳', color: 'bg-teal-400' },
        { name: 'E-mail', href: '/admin/settings?tab=email', icon: '✉️', color: 'bg-teal-400' },
        { name: 'DHL', href: '/admin/settings?tab=dhl', icon: '📦', color: 'bg-teal-400' },
        { name: 'Social media', href: '/admin/settings?tab=social', icon: '📱', color: 'bg-teal-400' },
        { name: 'BTW/Map', href: '/admin/settings?tab=taxmap', icon: '🧭', color: 'bg-teal-400' },
        { name: 'CRM', href: '/admin/settings?tab=crm', icon: '🤝', color: 'bg-teal-400' },
        { name: 'e-Boekhouden', href: '/admin/settings/eboekhouden', icon: '📊', color: 'bg-teal-400' },
        { name: 'Koppelingen', href: '/admin/settings/koppelingen', icon: '🔗', color: 'bg-teal-400' },
        { name: 'Gebruikers', href: '/admin/users', icon: '👤', color: 'bg-teal-400' }
      ]
    }] : []),
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
      return item.children.some(child => {
        if (child.children) {
          // Check nested children (like Attributen)
          return child.children.some(grandChild => isActive(grandChild.href))
        }
        return isActive(child.href)
      })
    }
    return isActive(item.href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">AlloyGator Admin</h1>
              <span className="ml-4 text-sm text-yellow-100">Afspraken vandaag:</span>
              <a href="/admin/crm/appointments" className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-900 text-xs font-semibold hover:bg-yellow-200" title="Afspraken vandaag">
                📅 {appointmentsToday}
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-100">Welkom, {email || 'Admin'}</span>
              <button
                onClick={logout}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors text-sm"
              >
                Uitloggen
              </button>
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
                              <div key={child.name}>
                                {child.children ? (
                                  // Nested children (like Attributen)
                                  <div>
                                    <button
                                      onClick={() => toggleSection(child.name.toLowerCase())}
                                      className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                                        isChildActive(child)
                                          ? `${child.color} text-white shadow-md`
                                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center text-white text-xs font-bold ${child.color}`}>
                                          {child.name.charAt(0)}
                                        </div>
                                        <span className="flex-1">{child.name}</span>
                                      </div>
                                      <span className={`transform transition-transform duration-200 ${expandedSections.includes(child.name.toLowerCase()) ? 'rotate-180' : ''}`}>
                                        ▼
                                      </span>
                                    </button>
                                    {expandedSections.includes(child.name.toLowerCase()) && (
                                      <div className="ml-4 mt-1 space-y-1">
                                        {child.children.map((grandChild) => (
                                          <Link
                                            key={grandChild.name}
                                            href={grandChild.href}
                                            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                                              isActive(grandChild.href)
                                                ? `${grandChild.color} text-white shadow-md`
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                            }`}
                                          >
                                            <div className={`w-3 h-3 rounded mr-3 flex items-center justify-center text-white text-xs font-bold ${grandChild.color}`}>
                                              {grandChild.name.charAt(0)}
                                            </div>
                                            <span className="flex-1">{grandChild.name}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  // Regular child (no nested children)
                                  <Link
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
                                    <span className="flex-1">{child.name}</span>
                                    {child.badge && (
                                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                        {child.badge}
                                      </span>
                                    )}
                                  </Link>
                                )}
                              </div>
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