'use client'

import { useState, useEffect } from 'react'
import { eBoekhoudenClientInstance } from '@/services/eBoekhouden/client'

interface eBoekhoudenSettings {
  username: string
  securityCode1: string
  securityCode2: string
  testMode: boolean
}

interface GrootboekRekening {
  ID: number
  Code: string
  Omschrijving: string
  Categorie: string
  Groep: string
}

export default function eBoekhoudenSettingsPage() {
  const [settings, setSettings] = useState<eBoekhoudenSettings>({
    username: '',
    securityCode1: '',
    securityCode2: '',
    testMode: true
  })
  
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [grootboekRekeningen, setGrootboekRekeningen] = useState<GrootboekRekening[]>([])
  const [loadingGrootboek, setLoadingGrootboek] = useState(false)

  useEffect(() => {
    // Load settings from environment (read-only display)
    setSettings({
      username: process.env.NEXT_PUBLIC_EBOEKHOUDEN_USERNAME || '***configured***',
      securityCode1: process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_1 ? '***configured***' : 'niet ingesteld',
      securityCode2: process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_2 ? '***configured***' : 'niet ingesteld',
      testMode: process.env.NEXT_PUBLIC_EBOEKHOUDEN_TEST_MODE === 'true'
    })
  }, [])

  const testConnection = async () => {
    setConnectionStatus('testing')
    setConnectionMessage('Bezig met testen van verbinding...')
    
    try {
      const response = await fetch('/api/accounting/eboekhouden/ping')
      const data = await response.json()
      
      if (data.ok) {
        setConnectionStatus('connected')
        setConnectionMessage(`✅ Verbinding succesvol! Test mode: ${data.testMode ? 'AAN' : 'UIT'}`)
      } else {
        setConnectionStatus('failed')
        setConnectionMessage(`❌ Verbinding mislukt: ${data.message}`)
      }
    } catch (error: any) {
      setConnectionStatus('failed')
      setConnectionMessage(`❌ Fout bij testen: ${error.message}`)
    }
  }

  const loadGrootboekRekeningen = async () => {
    setLoadingGrootboek(true)
    try {
      const session = await eBoekhoudenClientInstance.openSession()
      const rekeningen = await eBoekhoudenClientInstance.getGrootboekRekeningen(session)
      setGrootboekRekeningen(rekeningen)
      await eBoekhoudenClientInstance.closeSession(session.client, session.sessionId)
    } catch (error: any) {
      console.error('Failed to load grootboekrekeningen:', error)
      setConnectionMessage(`❌ Fout bij laden grootboekrekeningen: ${error.message}`)
    } finally {
      setLoadingGrootboek(false)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'testing': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅'
      case 'failed': return '❌'
      case 'testing': return '⏳'
      default: return '❓'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">e-Boekhouden Instellingen</h1>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verbindingsstatus</h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className={`text-lg font-medium ${getStatusColor()}`}>
              {getStatusIcon()} {connectionStatus === 'idle' ? 'Niet getest' : 
                connectionStatus === 'testing' ? 'Bezig met testen...' :
                connectionStatus === 'connected' ? 'Verbonden' : 'Verbinding mislukt'}
            </span>
            
            <button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {connectionStatus === 'testing' ? 'Testen...' : 'Test Verbinding'}
            </button>
          </div>
          
          {connectionMessage && (
            <div className={`p-3 rounded-md ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {connectionMessage}
            </div>
          )}
        </div>

        {/* Configuration Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuratie</h2>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Configuratie verplaatst</h3>
            <p className="text-sm text-blue-700 mb-3">
              API keys en credentials worden nu beheerd via de <strong>Koppelingen</strong> pagina. 
              Ga daarheen om e-Boekhouden credentials in te stellen en te testen.
            </p>
            <a 
              href="/admin/settings/koppelingen" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              🔗 Ga naar Koppelingen
            </a>
          </div>
        </div>

        {/* Grootboekrekeningen */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Grootboekrekeningen</h2>
            <button
              onClick={loadGrootboekRekeningen}
              disabled={loadingGrootboek || connectionStatus !== 'connected'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loadingGrootboek ? 'Laden...' : 'Laden uit e-Boekhouden'}
            </button>
          </div>
          
          {grootboekRekeningen.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Omschrijving
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Groep
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grootboekRekeningen.map((rekening) => (
                    <tr key={rekening.ID}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rekening.Code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rekening.Omschrijving}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rekening.Categorie}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rekening.Groep}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loadingGrootboek ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Grootboekrekeningen laden...</span>
                </div>
              ) : (
                <span>Klik op "Laden uit e-Boekhouden" om de grootboekrekeningen te bekijken</span>
              )}
            </div>
          )}
        </div>

        {/* Perpetual Inventory Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Perpetual Inventory Methode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Verkoop Boeking</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Soort:</strong> FactuurVerstuurd</li>
                <li>• <strong>Tegenrekening:</strong> 8000 (Omzet)</li>
                <li>• <strong>BTW:</strong> Automatisch berekend</li>
                <li>• <strong>Relatie:</strong> Automatisch aangemaakt/bijgewerkt</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">COGS + Voorraad Boeking</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Soort:</strong> Memoriaal</li>
                <li>• <strong>COGS:</strong> 7000 (Inkoopwaarde van de omzet)</li>
                <li>• <strong>Voorraad:</strong> 3000 (Voorraad balans)</li>
                <li>• <strong>Methode:</strong> Perpetual (direct bij verkoop)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Voordelen van Perpetual Inventory</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Real-time voorraadwaardes</li>
              <li>• Geen handmatige periodieke correcties nodig</li>
              <li>• Automatische COGS berekening</li>
              <li>• Betere financiële rapportages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
