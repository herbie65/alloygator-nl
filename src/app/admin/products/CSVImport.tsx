'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface CSVImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (products: any[]) => void
}

export default function CSVImport({ isOpen, onClose, onImport }: CSVImportProps) {
  const [csvData, setCsvData] = useState('')
  const [preview, setPreview] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [productAttributes, setProductAttributes] = useState<any[]>([])
  const [showAddAttribute, setShowAddAttribute] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState('')
  const [newAttributeType, setNewAttributeType] = useState('text')

  const commonMagentoFields = [
    'sku', 'name', 'description', 'short_description', 'price', 'cost', 
    'special_price', 'qty', 'stock_quantity', 'weight', 'categories',
    'category_ids', 'status', 'visibility', 'tax_class_id', 'image',
    'small_image', 'thumbnail', 'meta_title', 'meta_description',
    'created_at', 'updated_at', 'type_id', 'attribute_set_id'
  ]

  const [ourFields, setOurFields] = useState([
    'sku', 'name', 'title', 'description', 'price', 'cost_price',
    'stock_quantity', 'weight', 'category', 'vat_category', 'image_url',
    'dimensions', 'material', 'color', 'warranty', 'instructions',
    'features', 'specifications'
  ])

  // Load product attributes on component mount
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const attributes = await FirebaseService.getProductAttributes()
        setProductAttributes(attributes || [])
        
        // Add dynamic attributes to ourFields
        const dynamicFields = (attributes || []).map((attr: any) => attr.name)
        setOurFields(prev => [...prev, ...dynamicFields])
      } catch (error) {
        console.error('Error loading product attributes:', error)
      }
    }

    if (isOpen) {
      loadAttributes()
    }
  }, [isOpen])

  const handleAddAttribute = async () => {
    if (!newAttributeName.trim()) return

    try {
      const attributeData = {
        id: `attr_${Date.now()}`,
        name: newAttributeName.toLowerCase().replace(/\s+/g, '_'),
        label: newAttributeName,
        type: newAttributeType,
        options: newAttributeType === 'select' ? [] : undefined, // For color/select attributes
        created_at: new Date().toISOString()
      }

      await FirebaseService.createProductAttribute(attributeData)
      
      // Update local state
      setProductAttributes(prev => [...prev, attributeData])
      setOurFields(prev => [...prev, attributeData.name])
      
      // Clear form
      setNewAttributeName('')
      setNewAttributeType('text')
      setShowAddAttribute(false)
      
      alert(`Attribuut "${attributeData.label}" toegevoegd!`)
    } catch (error) {
      console.error('Error adding attribute:', error)
      alert('Fout bij toevoegen van attribuut')
    }
  }

  type ParsedCSV = { headers: string[]; rows: any[] }

const parseCSV = (csvText: string): ParsedCSV => {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/"/g, ''))

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  return { headers, rows: rows.slice(0, 5) } // Preview first 5 rows
}

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setCsvData(text)
        const parsed = parseCSV(text)
        if (parsed.headers.length) {
          setPreview(parsed.rows)
          
          // Auto-mapping common fields
          const autoMapping: Record<string, string> = {}
          parsed.headers.forEach(header => {
            const lowerHeader = header.toLowerCase()
            
            // Exact matches
            if (ourFields.includes(lowerHeader)) {
              autoMapping[header] = lowerHeader
            }
            // Common variations
            else if (lowerHeader === 'cost') autoMapping[header] = 'cost_price'
            else if (lowerHeader === 'qty') autoMapping[header] = 'stock_quantity'
            else if (lowerHeader === 'title' || lowerHeader === 'product_name') autoMapping[header] = 'name'
            else if (lowerHeader === 'image' || lowerHeader === 'base_image') autoMapping[header] = 'image_url'
            else if (lowerHeader === 'categories') autoMapping[header] = 'category'
            else if (lowerHeader === 'short_description') autoMapping[header] = 'description'
          })
          
          setMapping(autoMapping)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleTextareaUpload = () => {
    if (csvData.trim()) {
      const parsed = parseCSV(csvData)
      if (parsed.headers.length) {
        setPreview(parsed.rows)
        
        // Auto-mapping
        const autoMapping: Record<string, string> = {}
        parsed.headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          if (ourFields.includes(lowerHeader)) {
            autoMapping[header] = lowerHeader
          }
          else if (lowerHeader === 'cost') autoMapping[header] = 'cost_price'
          else if (lowerHeader === 'qty') autoMapping[header] = 'stock_quantity'
          else if (lowerHeader === 'title' || lowerHeader === 'product_name') autoMapping[header] = 'name'
          else if (lowerHeader === 'image' || lowerHeader === 'base_image') autoMapping[header] = 'image_url'
          else if (lowerHeader === 'categories') autoMapping[header] = 'category'
          else if (lowerHeader === 'short_description') autoMapping[header] = 'description'
        })
        
        setMapping(autoMapping)
      }
    }
  }

  const handleImport = async () => {
    if (!csvData.trim()) return
    
    setLoading(true)
    try {
      const parsed = parseCSV(csvData)
      const allRows = csvData.split('\n').filter(line => line.trim()).slice(1)
      
      const products = allRows.map((line, index) => {
        const values = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/"/g, ''))
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim().replace(/"/g, ''))
        
        const rawProduct: any = {}
        Object.keys(mapping).forEach(csvField => {
          const csvIndex = Object.keys(mapping).indexOf(csvField)
          rawProduct[csvField] = values[csvIndex] || ''
        })
        
        // Transform to our format
        const product: any = {
          id: `import_${Date.now()}_${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        Object.entries(mapping).forEach(([csvField, ourField]) => {
          let value = rawProduct[csvField]
          
          // Type conversions
          if (ourField === 'price' || ourField === 'cost_price' || ourField === 'weight') {
            product[ourField] = parseFloat(value) || 0
          } else if (ourField === 'stock_quantity') {
            product[ourField] = parseInt(value) || 0
          } else if (ourField === 'features') {
            product[ourField] = value ? value.split(',').map((f: string) => f.trim()) : []
          } else {
            product[ourField] = value || ''
          }
        })
        
        // Ensure required fields
        if (!product.name && !product.title) {
          product.name = product.sku || `Product ${index + 1}`
        }
        if (!product.description) {
          product.description = product.name || `Beschrijving voor ${product.sku}`
        }
        if (!product.vat_category) {
          product.vat_category = 'standard'
        }
        if (!product.category) {
          product.category = 'alloygator-set'
        }
        
        return product
      })
      
      onImport(products)
      onClose()
    } catch (error) {
      console.error('Import error:', error)
      alert('Fout bij importeren van CSV data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            CSV Import - Magento Producten
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Upload Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">1. Upload CSV Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV Bestand
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Of plak CSV data
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="Plak je CSV data hier..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleTextareaUpload}
                   className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Parse CSV Data
                  </button>
                </div>
              </div>
            </div>

            {/* Mapping Section */}
            {preview.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">2. Veld Mapping</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Koppel de CSV kolommen aan onze database velden. Mis je een attribuut? Voeg het toe!
                </p>

                {/* Add New Attribute Section */}
               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                   <h4 className="text-md font-medium text-green-900">Nieuw Attribuut Toevoegen</h4>
                    <button
                      onClick={() => setShowAddAttribute(!showAddAttribute)}
                     className="text-green-600 hover:text-green-800 font-medium"
                    >
                      {showAddAttribute ? '🔼 Verberg' : '🔽 Toon'}
                    </button>
                  </div>
                  
                  {showAddAttribute && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Attribuut Naam
                        </label>
                        <input
                          type="text"
                          value={newAttributeName}
                          onChange={(e) => setNewAttributeName(e.target.value)}
                          placeholder="bijv. Kleur, Materiaal, etc."
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newAttributeType}
                          onChange={(e) => setNewAttributeType(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="text">Tekst</option>
                          <option value="number">Nummer</option>
                          <option value="select">Selectie</option>
                          <option value="boolean">Ja/Nee</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleAddAttribute}
                          disabled={!newAttributeName.trim()}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                        >
                          ➕ Toevoegen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {Object.keys(preview[0] || {}).map(csvField => (
                    <div key={csvField}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CSV: "{csvField}"
                      </label>
                      <select
                        value={mapping[csvField] || ''}
                        onChange={(e) => setMapping(prev => ({
                          ...prev,
                          [csvField]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">-- Negeren --</option>
                        
                        {/* Standard Fields */}
                        <optgroup label="🏷️ Standaard Velden">
                          {['sku', 'name', 'title', 'description', 'price', 'cost_price',
                            'stock_quantity', 'weight', 'category', 'vat_category', 'image_url',
                            'dimensions', 'material', 'color', 'warranty', 'instructions',
                            'features', 'specifications'].map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </optgroup>
                        
                        {/* Dynamic Attributes */}
                        {productAttributes.length > 0 && (
                          <optgroup label="🔧 Dynamische Attributen">
                            {productAttributes.map(attr => (
                              <option key={attr.name} value={attr.name}>
                                {attr.label} ({attr.type})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Section */}
            {preview.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">3. Preview (eerste 5 rijen)</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0] || {}).map(header => (
                          <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {header}
                            {mapping[header] && (
                              <div className="text-green-600 text-xs font-normal">
                                → {mapping[header]}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, colIndex) => (
                            <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                              {String(value).substring(0, 50)}
                              {String(value).length > 50 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleImport}
              disabled={!csvData.trim() || loading || Object.keys(mapping).length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Importeren...' : `Importeer ${csvData ? csvData.split('\n').length - 1 : 0} Producten`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
