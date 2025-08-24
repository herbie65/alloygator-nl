'use client';

import { useState, useEffect } from 'react';
import { COA, BTW } from '@/services/accounting/chartOfAccounts';

export default function EBoekhoudenSettings() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [grootboekRekeningen, setGrootboekRekeningen] = useState<any[]>([]);
  const [isLoadingGrootboek, setIsLoadingGrootboek] = useState(false);

  // Test de e-Boekhouden verbinding
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/accounting/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.ok) {
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

  // Laad grootboekrekeningen (placeholder voor nu)
  const loadGrootboekRekeningen = async () => {
    setIsLoadingGrootboek(true);
    // Dit kan later uitgebreid worden met echte API call
    setTimeout(() => {
      setGrootboekRekeningen([
        { code: '1300', naam: 'Debiteuren', categorie: 'Activa' },
        { code: '8000', naam: 'Omzet hoog', categorie: 'Passiva' },
        { code: '1630', naam: 'BTW hoog', categorie: 'Passiva' },
        { code: '7000', naam: 'Kostprijs verkopen', categorie: 'Kosten' },
        { code: '3000', naam: 'Voorraad', categorie: 'Activa' },
      ]);
      setIsLoadingGrootboek(false);
    }, 1000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">e-Boekhouden Instellingen</h1>
      
      {/* Configuratie Sectie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuratie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={process.env.NEXT_PUBLIC_EBOEK_USERNAME || 'Uit environment variables'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Mode
            </label>
            <input
              type="text"
              value={process.env.NEXT_PUBLIC_EBOEK_TEST_MODE || 'false'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            {isTesting ? 'Testen...' : 'Test Verbinding'}
          </button>
          
          {testResult && (
            <div className="mt-3 p-3 rounded-md bg-gray-100">
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grootboekrekeningen Sectie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Grootboekrekeningen</h2>
        <button
          onClick={loadGrootboekRekeningen}
          disabled={isLoadingGrootboek}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md mb-4"
        >
          {isLoadingGrootboek ? 'Laden...' : 'Laden uit e-Boekhouden'}
        </button>
        
        {grootboekRekeningen.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grootboekRekeningen.map((rekening, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rekening.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rekening.naam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rekening.categorie}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BTW Codes Sectie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">BTW Codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Factuur BTW Codes</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Hoog ({settings?.vatHighRate || 0}%):</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{BTW.FACTUUR.HOOG}</code>
              </div>
              <div className="flex justify-between">
                <span>Laag (9%):</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{BTW.FACTUUR.LAAG}</code>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Memoriaal BTW Code</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Geen BTW:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{BTW.GEEN}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart of Accounts Sectie */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Chart of Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Hoofdrekeningen</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Debiteuren:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{COA.debiteuren}</code>
              </div>
              <div className="flex justify-between">
                <span>Omzet hoog:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{COA.omzetHoog}</code>
              </div>
              <div className="flex justify-between">
                <span>BTW hoog:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{COA.btwHoog}</code>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Kosten & Voorraad</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>COGS:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{COA.cogs}</code>
              </div>
              <div className="flex justify-between">
                <span>Voorraad:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">{COA.voorraad}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
