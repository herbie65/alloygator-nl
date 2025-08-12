'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'
import { FirebaseStorageService } from '@/lib/firebase-storage'

interface Document {
  id: string
  title: string
  description: string
  category: string
  permission: string
  file_type: string
  file_size: number
  file_url?: string
  storage_path?: string
  download_count: number
  created_at: string
  updated_at: string
  active: boolean
  tags: string[]
  customer_id?: string
  dealer_id?: string
}

interface DocumentCategory {
  id: string
  name: string
  description: string
  color: string
  active: boolean
}

interface DocumentPermission {
  id: string
  name: string
  description: string
  level: number
  active: boolean
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [permissions, setPermissions] = useState<DocumentPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPermission, setFilterPermission] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [docs, cats, perms] = await Promise.all([
          FirebaseClientService.getDocuments(),
          FirebaseClientService.getDocumentCategories(),
          FirebaseClientService.getDocumentPermissions()
        ])
        setDocuments(docs as Document[])
        setCategories(cats as DocumentCategory[])
        setPermissions(perms as DocumentPermission[])
      } catch (error) {
        console.error('Error loading documents data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Tip: menu sluit na actie of bij opnieuw klikken op dezelfde knop

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !doc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (filterCategory !== 'all' && doc.category !== filterCategory) {
        return false
      }
      if (filterPermission !== 'all' && doc.permission !== filterPermission) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Document]
      let bValue = b[sortBy as keyof Document]
      
      if (sortBy === 'file_size') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteDocumentById(id)
        setDocuments(prev => prev.filter(doc => doc.id !== id))
      } catch (error) {
        console.error('Error deleting document:', error)
        alert('Fout bij het verwijderen van document')
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || '#6B7280'
  }

  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(perm => perm.id === permissionId)
    return permission?.name || permissionId
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2">Documenten laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documenten Beheer</h1>
            <p className="text-gray-600">Beheer alle documenten, contracten en bestanden</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            + Nieuw Document
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Totaal Documenten</div>
            <div className="text-2xl font-bold">{documents.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Actieve Documenten</div>
            <div className="text-2xl font-bold">{documents.filter(d => d.active).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Categorieën</div>
            <div className="text-2xl font-bold">{categories.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Totale Downloads</div>
            <div className="text-2xl font-bold">{documents.reduce((sum, doc) => sum + doc.download_count, 0)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Zoek documenten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Alle Categorieën</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <select
                  value={filterPermission}
                  onChange={(e) => setFilterPermission(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Alle Permissies</option>
                  {permissions.map(permission => (
                    <option key={permission.id} value={permission.id}>{permission.name}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="created_at">Sorteer op Datum</option>
                  <option value="title">Sorteer op Titel</option>
                  <option value="file_size">Sorteer op Grootte</option>
                  <option value="download_count">Sorteer op Downloads</option>
                </select>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grootte
                  </th>
                   <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">Geen documenten gevonden</p>
                        <p className="text-gray-600">Er zijn nog geen documenten toegevoegd.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {document.file_type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                       <div className="ml-4 max-w-xs">
                             <div className="text-sm font-medium text-gray-900 truncate" title={document.title}>{document.title}</div>
                             <div className="text-sm text-gray-500 truncate" title={document.description}>{document.description}</div>
                            {document.tags && document.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {document.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                                {document.tags.length > 3 && (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                    +{document.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          style={{ 
                            backgroundColor: getCategoryColor(document.category) + '20',
                            color: getCategoryColor(document.category)
                          }}
                        >
                          {categories.find(cat => cat.id === document.category)?.name || document.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getPermissionName(document.permission)}
                        </span>
                        {String(document.permission || '').toLowerCase().includes('private') && (document.customer_email || document.customer_id) && (
                          <div className="text-xs text-gray-500 mt-1">Dealer: {document.customer_email || document.customer_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(document.file_size)}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 w-16 text-center">
                        {document.download_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.created_at).toLocaleDateString('nl-NL')}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <div className="inline-block text-left">
                           <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId===document.id ? null : document.id) }} className="px-2 py-1 border rounded text-sm">Acties ▾</button>
                           {openMenuId===document.id ? (
                           <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10" onClick={(e)=> { e.preventDefault(); e.stopPropagation() }}>
                             <ul className="py-1 text-sm">
                               {document.file_url && (
                                  <li>
                                    <button onClick={() => { window.open(document.file_url, '_blank'); FirebaseClientService.updateDocumentById(document.id, { download_count: (document.download_count || 0) + 1 }); setOpenMenuId(null) }} className="w-full text-left px-3 py-1 hover:bg-gray-50 text-gray-700">Download</button>
                                  </li>
                               )}
                               <li>
                                 <button type="button" onClick={() => { setEditingDocument(document); setShowUploadModal(true); setOpenMenuId(null) }} className="w-full text-left px-3 py-1 hover:bg-gray-50 text-gray-700">Bewerken</button>
                               </li>
                               <li>
                                 <button type="button" onClick={() => { handleDeleteDocument(document.id); setOpenMenuId(null) }} className="w-full text-left px-3 py-1 hover:bg-gray-50 text-red-600">Verwijderen</button>
                               </li>
                             </ul>
                           </div>
                           ) : null}
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {showUploadModal && (
        <DocumentModal
          document={editingDocument}
          categories={categories}
          permissions={permissions}
          onClose={() => {
            setShowUploadModal(false)
            setEditingDocument(null)
          }}
          onSave={(document) => {
            if (editingDocument) {
              setDocuments(prev => prev.map(doc => doc.id === document.id ? document : doc))
            } else {
              setDocuments(prev => [document, ...prev])
            }
            setShowUploadModal(false)
            setEditingDocument(null)
          }}
        />
      )}
    </div>
  )
}

// Document Modal Component
interface DocumentModalProps {
  document: Document | null
  categories: DocumentCategory[]
  permissions: DocumentPermission[]
  onClose: () => void
  onSave: (document: Document) => void
}

function DocumentModal({ document, categories, permissions, onClose, onSave }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    title: document?.title || '',
    description: document?.description || '',
    category: document?.category || '',
    permission: document?.permission || '',
    tags: document?.tags?.join(', ') || '',
    active: document?.active ?? true
  })
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [customerId, setCustomerId] = useState<string>(document?.customer_id || '')
  const [customerEmail, setCustomerEmail] = useState<string>(document?.customer_email || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Validate file upload for new documents
      if (!document && !selectedFile) {
        alert('Selecteer een bestand om te uploaden')
        setSaving(false)
        return
      }

      // Validate file type and size
      if (selectedFile) {
        if (!FirebaseStorageService.isValidFileType(selectedFile)) {
          alert('Ongeldig bestandstype. Alleen PDF, DOC, DOCX, TXT, JPG, PNG zijn toegestaan.')
          setSaving(false)
          return
        }
        
        if (!FirebaseStorageService.isValidFileSize(selectedFile)) {
          alert('Bestand is te groot. Maximum grootte is 10MB.')
          setSaving(false)
          return
        }
      }

      let fileUrl = document?.file_url || ''
      let storagePath = document?.storage_path || ''

      // Server-side upload (avoids CORS)
      if (selectedFile && !document) {
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('category', formData.category)
        const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Upload mislukt')
        const payload = await res.json()
        fileUrl = payload.url
        storagePath = payload.storage_path
      }

      const documentData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        file_type: document?.file_type || selectedFile?.name.split('.').pop()?.toLowerCase() || 'pdf',
        file_size: document?.file_size || Math.round((selectedFile?.size || 0) / 1024),
        file_url: fileUrl,
        storage_path: storagePath,
        download_count: document?.download_count || 0,
        created_at: document?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer_id: customerId || undefined,
        customer_email: customerEmail || undefined
      }

      if (document) {
        // Update existing document
        const updatedDoc = await FirebaseClientService.updateDocumentById(document.id, documentData)
        onSave(updatedDoc)
      } else {
        // Create new document with file info
        const newDoc = await FirebaseClientService.addDocument('documents', documentData)
        onSave(newDoc)
      }
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Fout bij het opslaan van document: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {document ? 'Document Bewerken' : 'Nieuw Document'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecteer categorie</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissie</label>
              <select
                value={formData.permission}
                onChange={(e) => setFormData(prev => ({ ...prev, permission: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecteer permissie</option>
                {permissions.map(permission => (
                  <option key={permission.id} value={permission.id}>{permission.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional klantkoppeling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klant-ID (optioneel)</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Bijv. 2000"
              />
              <p className="text-xs text-gray-500 mt-1">Vul in om document privé aan een klant te koppelen (zichtbaar in CRM en klantdashboard).</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klant e-mail (optioneel)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="klant@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Handig voor zoeken; niet vereist.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (komma-gescheiden)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="contract, template, algemeen"
            />
          </div>

          {/* File Upload Section */}
          {!document && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bestand Uploaden</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      // Auto-fill file type and size
                      const fileType = file.name.split('.').pop()?.toLowerCase() || 'pdf'
                      const fileSize = Math.round(file.size / 1024) // KB
                      setFormData(prev => ({
                        ...prev,
                        file_type: fileType,
                        file_size: fileSize
                      }))
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="text-green-600">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="font-medium">Klik om bestand te selecteren</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* File Info Display */}
          {document && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Huidig Bestand</label>
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {document.title}.{document.file_type} ({document.file_size} KB)
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Document actief
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
