'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0 })
  const [apptToday, setApptToday] = useState(0)
  const [apptWeek, setApptWeek] = useState(0)
  const [apptSoon, setApptSoon] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Authentication check - BELANGRIJKSTE TOEVOEGING
  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 Checking admin authentication on dashboard...')
      
      const session = localStorage.getItem('adminSessionV2')
      if (!session) {
        console.log('❌ No admin session found, redirecting to login')
        router.push('/admin/login')
        return
      }

      try {
        const sessionObj = JSON.parse(session)
        if (!sessionObj?.email || !sessionObj?.role) {
          console.log('❌ Invalid session data, clearing and redirecting')
          localStorage.removeItem('adminSessionV2')
          router.push('/admin/login')
          return
        }

        console.log('✅ Admin authentication successful:', sessionObj.email)
        setSessionData(sessionObj)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('❌ Error parsing admin session:', error)
        localStorage.removeItem('adminSessionV2')
        router.push('/admin/login')
      }
    }

    checkAuth()
  }, [router])

  // Data loading - alleen als geauthenticeerd
  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true
    const load = async () => {
      try {
        console.log('📊 Loading dashboard data...')
        setLoading(true)
        setError(null)
        const [prods, custs, ords] = await Promise.all([
          FirebaseClientService.getProducts().catch(e => {
            console.error('Error loading products:', e)
            return []
          }),
          FirebaseClientService.getCustomers().catch(e => {
            console.error('Error loading customers:', e)
            return []
          }),
          FirebaseClientService.getOrders().catch(e => {
            console.error('Error loading orders:', e)
            return []
          })
        ])
        if (!isMounted) return
        
        console.log('✅ Dashboard data loaded:', { products: prods.length, customers: custs.length, orders: ords.length })
        setStats({ products: prods.length || 0, customers: custs.length || 0, orders: ords.length || 0 })
        
        // Load appointments for counters/notifications
        try {
          const now = new Date()
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const endOfWeek = new Date(startOfToday)
          endOfWeek.setDate(endOfWeek.getDate() + 7)
          const res = await fetch(`/api/crm/appointments?from=${encodeURIComponent(startOfToday.toISOString())}&to=${encodeURIComponent(endOfWeek.toISOString())}`)
          const list = res.ok ? await res.json() : []
          if (!isMounted) return
          const todayCount = list.filter((a:any)=> new Date(a.start_at||0).toDateString() === startOfToday.toDateString()).length
          setApptToday(todayCount)
          setApptWeek(Array.isArray(list) ? list.length : 0)
          // Binnen 24 uur en over tijd
          const soon = (Array.isArray(list) ? list : []).filter((a:any)=>{
            const t = new Date(a.start_at||0).getTime()
            return t >= now.getTime() && t <= now.getTime() + 24*60*60*1000
          }).slice(0,5)
          setApptSoon(soon)
        } catch (apptError) {
          console.error('Error loading appointments:', apptError)
        }
      } catch (e: any) {
        console.error('Error loading dashboard:', e)
        if (!isMounted) return
        setError(e?.message || 'Onbekende fout bij laden dashboard cijfers')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [isAuthenticated])

  const handleLogout = () => {
    console.log('🚪 Logging out admin user')
    localStorage.removeItem('adminSessionV2')
    sessionStorage.removeItem('sessionChecked')
    document.cookie = 'adminSessionV2=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/admin/login')
  }

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticatie controleren...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welkom bij het AlloyGator admin panel - Live database cijfers</p>
          {sessionData && (
            <p className="text-sm text-gray-500">Ingelogd als: {sessionData.email}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Uitloggen
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              📦
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Producten</h3>
              <p className="text-3xl font-bold text-green-600">{loading ? '…' : stats.products}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              👥
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Klanten</h3>
              <p className="text-3xl font-bold text-green-600">{loading ? '…' : stats.customers}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              🛒
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Bestellingen</h3>
              <p className="text-3xl font-bold text-purple-600">{loading ? '…' : stats.orders}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>

        <Link href="/admin/crm/appointments" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
          <div className="flex items-center cursor-pointer">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              📅
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Afspraken</h3>
              <p className="text-sm text-gray-600">Vandaag: <span className="font-semibold text-gray-900">{apptToday}</span></p>
              <p className="text-sm text-gray-600">Deze week: <span className="font-semibold text-gray-900">{apptWeek}</span></p>
              <span className="inline-block mt-1 text-xs text-green-700">Open agenda →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Rest van je bestaande dashboard code blijft hetzelfde */}
      {/* Afspraken notificaties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Afspraken – Binnen 24 uur</h2>
        {apptSoon.length === 0 ? (
          <p className="text-sm text-gray-500">Geen afspraken binnen 24 uur</p>
        ) : (
          <ul className="space-y-2">
            {apptSoon.map((a:any, i:number) => (
              <li key={i} className="flex items-center justify-between border-b last:border-b-0 pb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.title || 'Afspraak'}</p>
                  <p className="text-xs text-gray-600 truncate">{a.start_at ? new Date(a.start_at).toLocaleString('nl-NL') : ''} • {a.type || 'call'}</p>
                </div>
                <a href={a.customer_id ? `/admin/crm/${encodeURIComponent(a.customer_id)}` : '/admin/crm'} className="text-xs text-green-700 hover:underline">Bekijken</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/admin/products" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <h3 className="font-semibold text-green-900">Producten Beheren</h3>
            <p className="text-sm text-green-700">Voeg, bewerk of verwijder producten</p>
          </a>
          <a href="/admin/customers" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <h3 className="font-semibold text-green-900">Klanten Beheren</h3>
            <p className="text-sm text-green-700">Bekijk en beheer klantgegevens</p>
          </a>
          <a href="/admin/customer-groups" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <h3 className="font-semibold text-purple-900">Klantgroepen</h3>
            <p className="text-sm text-purple-700">Beheer klantgroepen en kortingen</p>
          </a>
          <a href="/admin/orders" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
            <h3 className="font-semibold text-orange-900">Bestellingen</h3>
            <p className="text-sm text-orange-700">Bekijk en verwerk bestellingen</p>
          </a>
          <a href="/admin/users" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <h3 className="font-semibold text-gray-900">Gebruikers</h3>
            <p className="text-sm text-gray-700">Beheer backend gebruikers</p>
          </a>
          <a href="/admin/settings" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left">
            <h3 className="font-semibold text-yellow-900">Instellingen</h3>
            <p className="text-sm text-yellow-700">Configureer website instellingen</p>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Systeem Status</h2>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              Fout bij laden dashboard-data: {error}
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Website</h3>
              <p className="text-sm text-green-700">Live op Firebase Hosting</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Admin Panel</h3>
              <p className="text-sm text-green-700">Volledig operationeel</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-yellow-900">Database</h3>
              <p className="text-sm text-yellow-700">Firebase verbinding beschikbaar</p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="font-semibold text-green-900 mb-2">ℹ️ Informatie</h3>
        <p className="text-sm text-green-700">
          Deze admin sectie draait op Firebase Hosting. De data wordt opgehaald van Firebase als database service. 
          Als er geen data wordt getoond, kan dit betekenen dat de database leeg is of dat er connectiviteitsproblemen zijn.
        </p>
      </div>
    </div>
  )
}