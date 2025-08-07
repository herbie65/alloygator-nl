'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface CMSPage {
  id: string
  title: string
  slug: string
  content: string
  meta_description: string
  meta_keywords: string[]
  status: 'published' | 'draft' | 'archived'
  created_at: string
  updated_at: string
  author: string
  featured_image?: string
  category: string
  tags: string[]
}

export default function CMSPage() {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('title')
  const [showAddPage, setShowAddPage] = useState(false)

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true)
        const pagesData = await FirebaseService.getCMSPages()
        setPages(pagesData)
      } catch (error) {
        console.error('Error fetching CMS pages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [])

  const filteredPages = pages
    .filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || page.status === filterStatus
      const matchesCategory = filterCategory === 'all' || page.category === filterCategory
      
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title)
        case 'created_at': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_at': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'status': return a.status.localeCompare(b.status)
        default: return 0
      }
    })

  const getPageStats = () => {
    const total = pages.length
    const published = pages.filter(p => p.status === 'published').length
    const draft = pages.filter(p => p.status === 'draft').length
    const archived = pages.filter(p => p.status === 'archived').length
    
    return { total, published, draft, archived }
  }

  const stats = getPageStats()

  const getCategories = () => {
    const categories = [...new Set(pages.map(page => page.category))]
    return categories.sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">CMS pagina's laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-600">Beheer website content en pagina's</p>
        </div>
        <button
          onClick={() => setShowAddPage(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          + Nieuwe Pagina
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totaal Pagina's</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gepubliceerd</p>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concept</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gearchiveerd</p>
              <p className="text-2xl font-bold text-gray-900">{stats.archived}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
            <input
              type="text"
              placeholder="Zoek op titel, content of slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Alle statussen</option>
              <option value="published">Gepubliceerd</option>
              <option value="draft">Concept</option>
              <option value="archived">Gearchiveerd</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Alle categorieën</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sorteren</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="title">Titel A-Z</option>
              <option value="created_at">Nieuwste eerst</option>
              <option value="updated_at">Laatst bewerkt</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pagina's ({filteredPages.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laatst bewerkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        📄
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {page.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {page.meta_description.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    /{page.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      page.status === 'published' ? 'bg-green-100 text-green-800' :
                      page.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status === 'published' ? 'Gepubliceerd' :
                       page.status === 'draft' ? 'Concept' : 'Gearchiveerd'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedPage(page)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Bekijken
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3">
                      Bewerken
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div className="text-left">
                <div className="font-medium">Nieuwe Blog Post</div>
                <div className="text-sm opacity-90">Maak een nieuwe blog post</div>
              </div>
            </div>
          </button>

          <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <div className="font-medium">Nieuwe Pagina</div>
                <div className="text-sm opacity-90">Maak een nieuwe pagina</div>
              </div>
            </div>
          </button>

          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <div className="font-medium">Media Beheer</div>
                <div className="text-sm opacity-90">Beheer afbeeldingen en bestanden</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
