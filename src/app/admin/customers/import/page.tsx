'use client'

import { useState, useRef } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company_name?: string
  address: string
  city: string
  postal_code: string
  country: string
  is_dealer: boolean
  dealer_group?: string
  total_orders: number
  total_spent: number
  last_order_date?: string
  created_at: string
  updated_at?: string
  notes?: string
  status: 'active' | 'inactive' | 'pending'
  invoice_email?: string
  vat_number?: string
  vat_verified?: boolean
  vat_reverse_charge?: boolean
  latitude?: number
  longitude?: number
  website?: string
  contact_person?: string
  payment_terms?: string
  credit_limit?: number
  invoice_payment_terms_days?: number
  tax_exempt?: boolean
  tax_exemption_reason?: string
  contact_first_name?: string
  contact_last_name?: string
  separate_shipping_address?: boolean
  shipping_address?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country?: string
  kvk_number?: string
  separate_invoice_email?: boolean
  show_on_map?: boolean
  allow_invoice_payment?: boolean
}

interface CustomerGroup {
  id: string
  name: string
  discount_percentage: number
  description: string
  created_at: string
}

export default function CustomerImportPage() {
  const [csvData, setCsvData] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, skipped: 0 })
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Beschikbare velden in onze database
  const availableFields = [
    { key: 'name', label: 'Naam', required: true, description: 'Volledige naam van de klant' },
    { key: 'email', label: 'Email', required: true, description: 'Email adres' },
    { key: 'phone', label: 'Telefoon', required: false, description: 'Telefoonnummer' },
    { key: 'company_name', label: 'Bedrijfsnaam', required: false, description: 'Bedrijfsnaam' },
    { key: 'contact_first_name', label: 'Voornaam', required: false, description: 'Voornaam contactpersoon' },
    { key: 'contact_last_name', label: 'Achternaam', required: false, description: 'Achternaam contactpersoon' },
    { key: 'address', label: 'Adres', required: true, description: 'Factuuradres' },
    { key: 'city', label: 'Plaats', required: true, description: 'Plaats' },
    { key: 'postal_code', label: 'Postcode', required: true, description: 'Postcode' },
    { key: 'country', label: 'Land', required: false, description: 'Land (standaard: Nederland)' },
    { key: 'vat_number', label: 'BTW Nummer', required: false, description: 'BTW nummer' },
    { key: 'kvk_number', label: 'KVK Nummer', required: false, description: 'KVK nummer' },
    { key: 'website', label: 'Website', required: false, description: 'Website URL' },
    { key: 'is_dealer', label: 'Is Dealer', required: false, description: 'Is dit een dealer?' },
    { key: 'dealer_group', label: 'Dealer Groep', required: false, description: 'Dealer groep (goud, zilver, brons)' },
    { key: 'status', label: 'Status', required: false, description: 'Status (active, inactive, pending)' },
    { key: 'notes', label: 'Notities', required: false, description: 'Extra notities' },
    { key: 'total_orders', label: 'Totaal Bestellingen', required: false, description: 'Aantal bestellingen' },
    { key: 'total_spent', label: 'Totaal Uitgegeven', required: false, description: 'Totaal uitgegeven bedrag' },
    { key: 'show_on_map', label: 'Zichtbaar op Kaart', required: false, description: 'Zichtbaar op dealer kaart' },
    { key: 'allow_invoice_payment', label: 'Op Rekening Toegestaan', required: false, description: 'Kan op rekening betalen' },
    { key: 'invoice_payment_terms_days', label: 'Betaaltermijn (dagen)', required: false, description: 'Betaaltermijn in dagen' },
    { key: 'separate_shipping_address', label: 'Apart Verzendadres', required: false, description: 'Heeft apart verzendadres' },
    { key: 'shipping_address', label: 'Verzendadres', required: false, description: 'Verzendadres' },
    { key: 'shipping_city', label: 'Verzendplaats', required: false, description: 'Verzendplaats' },
    { key: 'shipping_postal_code', label: 'Verzendpostcode', required: false, description: 'Verzendpostcode' },
    { key: 'shipping_country', label: 'Verzendland', required: false, description: 'Verzendland' },
    { key: 'invoice_email', label: 'Factuur Email', required: false, description: 'Email voor facturen' },
    { key: 'contact_person', label: 'Contactpersoon', required: false, description: 'Naam contactpersoon' },
    { key: 'payment_terms', label: 'Betaalvoorwaarden', required: false, description: 'Betaalvoorwaarden' },
    { key: 'credit_limit', label: 'Kredietlimiet', required: false, description: 'Kredietlimiet' },
    { key: 'tax_exempt', label: 'BTW Vrijgesteld', required: false, description: 'BTW vrijgesteld' },
    { key: 'tax_exemption_reason', label: 'BTW Vrijstelling Reden', required: false, description: 'Reden voor BTW vrijstelling' }
  ]

  // Magento-specifieke veld suggesties
  const magentoFieldSuggestions = {
    'entity_id': 'id',
    'email': 'email',
    'firstname': 'contact_first_name',
    'lastname': 'contact_last_name',
    'company': 'company_name',
    'telephone': 'phone',
    'street': 'address',
    'city': 'city',
    'postcode': 'postal_code',
    'country_id': 'country',
    'vat_id': 'vat_number',
    'group_id': 'dealer_group',
    'is_active': 'status',
    'website_id': 'website',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setCsvData(text)
        parseCSV(text)
      }
      reader.readAsText(file)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setHeaders(headers)
      
      // Auto-map Magento velden
      const autoMapping: Record<string, string> = {}
      headers.forEach(header => {
        const suggestion = magentoFieldSuggestions[header.toLowerCase()]
        if (suggestion) {
          autoMapping[header] = suggestion
        }
      })
      setMapping(autoMapping)
      
      // Generate preview (eerste 5 rijen)
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      setPreviewData(preview)
    }
  }

  const handleMappingChange = (csvHeader: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: targetField
    }))
  }

  const validateMapping = () => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.key)
    const mappedFields = Object.values(mapping)
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field))
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: missingFields.map(field => {
          const fieldInfo = availableFields.find(f => f.key === field)
          return `Verplicht veld "${fieldInfo?.label}" is niet gemapt`
        })
      }
    }
    
    return { valid: true, errors: [] }
  }

  const importCustomers = async () => {
    const validation = validateMapping()
    if (!validation.valid) {
      setErrorMessages(validation.errors)
      return
    }

    setImporting(true)
    setErrorMessages([])
    setImportResults({ success: 0, errors: 0, skipped: 0 })

    const lines = csvData.split('\n').filter(line => line.trim())
    const dataLines = lines.slice(1) // Skip header
    setImportProgress({ current: 0, total: dataLines.length })

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      
      try {
        // Map CSV data naar customer object
        const customerData: Partial<Customer> = {}
        
        headers.forEach((header, index) => {
          const targetField = mapping[header]
          if (targetField && values[index]) {
            let value = values[index]
            
            // Type conversies
            if (targetField === 'is_dealer') {
              value = value.toLowerCase() === 'true' || value.toLowerCase() === '1' || value.toLowerCase() === 'yes'
            } else if (targetField === 'total_orders' || targetField === 'total_spent' || targetField === 'credit_limit' || targetField === 'invoice_payment_terms_days') {
              value = parseFloat(value) || 0
            } else if (targetField === 'show_on_map' || targetField === 'allow_invoice_payment' || targetField === 'separate_shipping_address' || targetField === 'tax_exempt' || targetField === 'vat_verified' || targetField === 'vat_reverse_charge') {
              value = value.toLowerCase() === 'true' || value.toLowerCase() === '1' || value.toLowerCase() === 'yes'
            } else if (targetField === 'status') {
              value = value.toLowerCase() === 'active' ? 'active' : value.toLowerCase() === 'inactive' ? 'inactive' : 'pending'
            }
            
            customerData[targetField] = value
          }
        })

        // Verplichte velden controleren
        if (!customerData.name || !customerData.email) {
          skippedCount++
          errors.push(`Rij ${i + 2}: Naam en email zijn verplicht`)
          continue
        }

        // Default waarden
        customerData.country = customerData.country || 'Nederland'
        customerData.status = customerData.status || 'active'
        customerData.is_dealer = customerData.is_dealer || false
        customerData.total_orders = customerData.total_orders || 0
        customerData.total_spent = customerData.total_spent || 0
        customerData.created_at = new Date().toISOString()
        customerData.updated_at = new Date().toISOString()

        // Klant opslaan
        await FirebaseService.addDocument('customers', customerData)
        successCount++
        
      } catch (error) {
        errorCount++
        errors.push(`Rij ${i + 2}: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
      }

      setImportProgress({ current: i + 1, total: dataLines.length })
    }

    setImportResults({ success: successCount, errors: errorCount, skipped: skippedCount })
    setErrorMessages(errors.slice(0, 10)) // Toon alleen eerste 10 fouten
    setImporting(false)
  }

  const resetImport = () => {
    setCsvData('')
    setHeaders([])
    setPreviewData([])
    setMapping({})
    setImportProgress({ current: 0, total: 0 })
    setImportResults({ success: 0, errors: 0, skipped: 0 })
    setErrorMessages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Klanten Importeren vanuit Magento</h1>
        <p className="mt-2 text-gray-600">
          Upload een CSV bestand met klantgegevens uit Magento en map de kolommen naar de juiste velden.
        </p>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">1. CSV Bestand Uploaden</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        <p className="mt-2 text-sm text-gray-500">
          Upload een CSV bestand met klantgegevens uit Magento. De eerste rij moet kolomnamen bevatten.
        </p>
      </div>

      {/* Mapping Interface */}
      {headers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Kolommen Mappen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headers.map(header => (
              <div key={header} className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700 min-w-[120px]">
                  {header}:
                </label>
                <select
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Niet mappen</option>
                  {availableFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} {field.required ? '(verplicht)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Voorvertoning</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index}>
                    {headers.map(header => (
                      <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Actions */}
      {headers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Importeren</h2>
          
          {errorMessages.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">Validatie Fouten:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errorMessages.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {importing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Importeren...</span>
                <span className="text-sm text-blue-600">{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {importResults.success > 0 || importResults.errors > 0 || importResults.skipped > 0 ? (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">Import Resultaat:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ {importResults.success} klanten succesvol geïmporteerd</li>
                {importResults.errors > 0 && <li>❌ {importResults.errors} fouten</li>}
                {importResults.skipped > 0 && <li>⏭️ {importResults.skipped} overgeslagen</li>}
              </ul>
            </div>
          ) : null}

          <div className="flex space-x-4">
            <button
              onClick={importCustomers}
              disabled={importing || !validateMapping().valid}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importeren...' : 'Start Import'}
            </button>
            <button
              onClick={resetImport}
              disabled={importing}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">💡 Tips voor Magento Export</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Exporteer klanten vanuit Magento Admin → Customers → All Customers</p>
          <p>• Zorg dat de CSV de volgende kolommen bevat: entity_id, email, firstname, lastname, company, telephone, street, city, postcode, country_id</p>
          <p>• Voor dealers: voeg een kolom toe met 'is_dealer' (true/false) of gebruik 'group_id'</p>
          <p>• BTW nummers kunnen in de 'vat_id' kolom staan</p>
          <p>• Zorg dat email adressen uniek zijn</p>
        </div>
      </div>
    </div>
  )
}
