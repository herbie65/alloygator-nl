'use client'

import { useState, useEffect } from 'react'
import UploadManager from './UploadManager'

interface NavigationItem {
  id: string
  title: string
  url: string
  order: number
}

interface HeaderData {
  id?: string
  logo_url?: string
  logo_text?: string
  logo_width?: number
  logo_height?: number
  navigation_items?: NavigationItem[]
  show_cart: boolean
  show_login: boolean
  show_dealer_login: boolean
  created_at?: string
  updated_at?: string
}

export default function HeaderManager() {
  const [headerData, setHeaderData] = useState<HeaderData>({
    logo_url: '',
    logo_text: 'AlloyGator',
    logo_width: 150,
    logo_height: 50,
    navigation_items: [],
    show_cart: true,
    show_login: true,
    show_dealer_login: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showLogoUpload, setShowLogoUpload] = useState(false)

  useEffect(() => {
    fetchHeaderData()
  }, [])

  const fetchHeaderData = async () => {
    try {
      // Load from localStorage for static export
      const savedSettings = localStorage.getItem('headerSettings')
      if (savedSettings) {
        const data = JSON.parse(savedSettings)
        setHeaderData(data as HeaderData)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading header data:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // Save to localStorage for static export
      const settingsToSave = {
        ...headerData,
        id: headerData.id || 'default',
        created_at: headerData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('headerSettings', JSON.stringify(settingsToSave))
      
      setMessage('Header succesvol opgeslagen! (Opgeslagen in browser)')
    } catch (error) {
      console.error('Error saving header:', error)
      setMessage('Fout bij opslaan van header')
    }
    
    setSaving(false)
  }

  const addNavigationItem = () => {
    const newItem: NavigationItem = {
      id: Date.now().toString(),
      title: '',
      url: '',
      order: (headerData.navigation_items?.length || 0) + 1
    }
    setHeaderData({
      ...headerData,
      navigation_items: [...(headerData.navigation_items || []), newItem]
    })
  }

  const removeNavigationItem = (index: number) => {
    const newItems = (headerData.navigation_items || []).filter((_, i) => i !== index)
    setHeaderData({
      ...headerData,
      navigation_items: newItems.map((item, i) => ({ ...item, order: i + 1 }))
    })
  }

  const updateNavigationItem = (index: number, field: keyof NavigationItem, value: string | number) => {
    const newItems = [...(headerData.navigation_items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    setHeaderData({
      ...headerData,
      navigation_items: newItems
    })
  }

  const handleLogoUpload = (logoUrl: string) => {
    // If it's a permanent URL, find the blob URL from uploadedFiles for display
    let finalUrl = logoUrl
    if (logoUrl.startsWith('/media/images/')) {
      const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
      const logoFile = uploadedFiles.find((file: any) => file.permanentUrl === logoUrl)
      if (logoFile && logoFile.blobUrl) {
        finalUrl = logoFile.blobUrl // Use the blob URL for display
      }
    }
    
    setHeaderData({
      ...headerData,
      logo_url: finalUrl
    })
    setShowLogoUpload(false)
  }

  const updateHeaderField = (field: keyof HeaderData, value: any) => {
    setHeaderData({
      ...headerData,
      [field]: value
    })
  }

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Header Beheer</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Opslaan...' : 'Header Opslaan'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Fout') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Logo Instellingen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={headerData.logo_url || ''}
              onChange={(e) => updateHeaderField('logo_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/logo.png"
            />
            <button
              onClick={() => setShowLogoUpload(true)}
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Logo Uploaden
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Tekst
            </label>
            <input
              type="text"
              value={headerData.logo_text || ''}
              onChange={(e) => updateHeaderField('logo_text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="AlloyGator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Breedte (px)
            </label>
            <input
              type="number"
              value={headerData.logo_width || 150}
              onChange={(e) => updateHeaderField('logo_width', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              min="50"
              max="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Hoogte (px)
            </label>
            <input
              type="number"
              value={headerData.logo_height || 50}
              onChange={(e) => updateHeaderField('logo_height', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              min="20"
              max="100"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowLogoUpload(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Logo Uploaden
          </button>
        </div>

        {headerData.logo_url && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Logo Preview</h4>
            <img
              src={headerData.logo_url}
              alt="Logo preview"
              style={{
                width: `${headerData.logo_width || 150}px`,
                height: `${headerData.logo_height || 50}px`,
                objectFit: 'contain'
              }}
              className="border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Navigatie Links</h3>
          <button
            onClick={addNavigationItem}
            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
          >
            Link Toevoegen
          </button>
        </div>

        <div className="space-y-4">
          {(headerData.navigation_items || []).map((item, index) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateNavigationItem(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Home"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => updateNavigationItem(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="/"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volgorde
                  </label>
                  <input
                    type="number"
                    value={item.order}
                    onChange={(e) => updateNavigationItem(index, 'order', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                  />
                </div>
              </div>
              <button
                onClick={() => removeNavigationItem(index)}
                className="text-red-600 hover:text-red-800"
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Header Opties</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_cart"
              checked={headerData.show_cart}
              onChange={(e) => updateHeaderField('show_cart', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="show_cart" className="ml-2 block text-sm text-gray-900">
              Winkelwagen tonen
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_login"
              checked={headerData.show_login}
              onChange={(e) => updateHeaderField('show_login', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="show_login" className="ml-2 block text-sm text-gray-900">
              Login knop tonen
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_dealer_login"
              checked={headerData.show_dealer_login}
              onChange={(e) => updateHeaderField('show_dealer_login', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="show_dealer_login" className="ml-2 block text-sm text-gray-900">
              Dealer login knop tonen
            </label>
          </div>
        </div>
      </div>

      {showLogoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Logo Uploaden</h3>
              <button
                onClick={() => setShowLogoUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <UploadManager 
              onFileSelect={(fileUrl) => {
                handleLogoUpload(fileUrl)
                setShowLogoUpload(false)
              }}
              showFileList={true}
            />
          </div>
        </div>
      )}
    </div>
  )
} 