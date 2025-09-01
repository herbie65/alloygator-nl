'use client';

import { useState, useEffect } from 'react';

interface EBoekhoudenData {
  relations?: any[];
  articles?: any[];
  ledgers?: any[];
}

export default function EBoekhoudenSettings() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [eboekhoudenData, setEboekhoudenData] = useState<EBoekhoudenData>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'relations' | 'articles' | 'ledgers'>('overview');

  // Test de e-Boekhouden verbinding
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/eboekhouden/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult(`✅ ${result.message}`);
      } else {
        setTestResult(`❌ ${result.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Fout bij testen: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Laad E-boekhouden data
  const loadEboekhoudenData = async () => {
    setIsLoadingData(true);
    
    try {
      // Laad relaties
      const relationsResponse = await fetch('/api/eboekhouden/relations');
      const relationsResult = await relationsResponse.json();
      
      // Laad artikelen
      const articlesResponse = await fetch('/api/eboekhouden/articles');
      const articlesResult = await articlesResponse.json();
      
      setEboekhoudenData({
        relations: relationsResult.success ? relationsResult.relations : [],
        articles: articlesResult.success ? articlesResult.articles : [],
      });
    } catch (error) {
      console.error('Error loading E-boekhouden data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadEboekhoudenData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">e-Boekhouden Koppeling</h1>
      
      {/* Configuratie Sectie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuratie</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value="Uit environment variables"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Code 1
            </label>
            <input
              type="password"
              value="••••••••••••••••"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Code 2
            </label>
            <input
              type="password"
              value="••••••••••••••••"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testen...' : 'Test Verbinding'}
          </button>
          
          {testResult && (
            <span className={`text-sm ${testResult.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {testResult}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          E-boekhouden credentials worden beheerd via Vercel Environment Variables en kunnen niet hier worden gewijzigd.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overzicht
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'relations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Relaties ({eboekhoudenData.relations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'articles'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Artikelen ({eboekhoudenData.articles?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('ledgers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ledgers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Grootboek
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">E-boekhouden Overzicht</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Relaties</h4>
                  <p className="text-2xl font-bold text-blue-600">{eboekhoudenData.relations?.length || 0}</p>
                  <p className="text-sm text-blue-700">Klanten & Leveranciers</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Artikelen</h4>
                  <p className="text-2xl font-bold text-green-600">{eboekhoudenData.articles?.length || 0}</p>
                  <p className="text-sm text-green-700">Producten & Diensten</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Grootboek</h4>
                  <p className="text-2xl font-bold text-purple-600">{eboekhoudenData.ledgers?.length || 0}</p>
                  <p className="text-sm text-purple-700">Rekeningen</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={loadEboekhoudenData}
                  disabled={isLoadingData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingData ? 'Laden...' : 'Vernieuw Data'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Relaties (Klanten & Leveranciers)</h3>
              {isLoadingData ? (
                <p>Laden...</p>
              ) : eboekhoudenData.relations && eboekhoudenData.relations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrijf</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contactpersoon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {eboekhoudenData.relations.map((relation, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{relation.Code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{relation.Bedrijf || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{relation.Contactpersoon || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{relation.Email || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {relation.BP === 'B' ? 'Bedrijf' : 'Persoon'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Geen relaties gevonden.</p>
              )}
            </div>
          )}

          {activeTab === 'articles' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Artikelen (Producten & Diensten)</h3>
              {isLoadingData ? (
                <p>Laden...</p>
              ) : eboekhoudenData.articles && eboekhoudenData.articles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groep</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs Excl. BTW</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BTW Code</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {eboekhoudenData.articles.map((article, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{article.Code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.Omschrijving}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.Groep || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{article.PrijsExclBTW || '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{article.BTWCode || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Geen artikelen gevonden.</p>
              )}
            </div>
          )}

          {activeTab === 'ledgers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Grootboek Rekeningen</h3>
              <p className="text-gray-500">Grootboek functionaliteit wordt binnenkort toegevoegd.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
