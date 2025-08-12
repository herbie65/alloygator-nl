'use client'

import { useState, useRef, useEffect } from 'react'

interface UploadedFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

interface UploadManagerProps {
  onFileSelect?: (fileUrl: string) => void
  showFileList?: boolean
}

export default function UploadManager({ onFileSelect, showFileList = true }: UploadManagerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved files on component mount
  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
    if (savedFiles.length > 0) {
      setFiles(savedFiles.map((file: any) => ({
        id: file.id,
        name: file.name,
        url: file.permanentUrl || file.url, // Use permanent URL
        type: file.type,
        size: file.size,
        uploaded_at: file.uploaded_at,
        displayUrl: file.blobUrl || file.url // For preview
      })))
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setMessage('')

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          setMessage(`Fout: ${file.name} is geen geldige afbeelding`)
          continue
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setMessage(`Fout: ${file.name} is te groot (max 5MB)`)
          continue
        }

        // Create a unique filename
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const permanentUrl = `/media/images/${fileName}` // Permanent URL structure
        const blobUrl = URL.createObjectURL(file)
        
        const uploadedFile: UploadedFile = {
          id: timestamp.toString() + i,
          name: file.name,
          url: permanentUrl, // Use permanent URL for display
          type: file.type,
          size: file.size,
          uploaded_at: new Date().toISOString()
        }
        
        setFiles(prev => [...prev, {
          ...uploadedFile,
          displayUrl: blobUrl // For immediate preview in admin
        }])
        
        // Save file to localStorage for persistence
        const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
        savedFiles.push({
          ...uploadedFile,
          permanentUrl: permanentUrl, // Permanent URL for production
          blobUrl: blobUrl, // Blob URL for immediate preview
          actualFile: file // Store the actual file for potential server upload
        })
        localStorage.setItem('uploadedFiles', JSON.stringify(savedFiles))
      }
      
      setMessage('Bestanden succesvol geüpload! (Opgeslagen in browser)')
    } catch (error) {
      console.error('Error uploading files:', error)
      setMessage('Fout bij uploaden van bestanden')
    }

    setUploading(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const deleteFile = async (fileId: string) => {
    try {
      // Remove from state
      setFiles(prev => prev.filter(file => file.id !== fileId))
      
      // Remove from localStorage
      const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
      const updatedFiles = savedFiles.filter((file: any) => file.id !== fileId)
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles))
      
      setMessage('Bestand succesvol verwijderd!')
    } catch (error) {
      console.error('Error deleting file:', error)
      setMessage('Fout bij verwijderen van bestand')
    }
  }

  const copyUrl = (url: string) => {
    // Always copy the permanent URL, not the blob URL
    navigator.clipboard.writeText(url)
    setMessage('Permanente URL gekopieerd naar klembord!')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Manager</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('succesvol') || message.includes('gekopieerd') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe Bestanden Uploaden</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploaden...' : 'Selecteer Afbeeldingen'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Ondersteunde formaten: JPG, PNG, GIF (max 5MB per bestand)
          </p>
        </div>
      </div>

      {/* Files List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geüploade Bestanden</h3>
        {files.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nog geen bestanden geüpload</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex space-x-2">
                    {onFileSelect && (
                      <button
                        onClick={() => onFileSelect(file.url)} // This is now the permanent URL
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Selecteer
                      </button>
                    )}
                    <button
                      onClick={() => copyUrl(file.url)} // This should be the permanent URL
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Kopieer URL
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 