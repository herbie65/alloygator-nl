'use client';

import { useState, useEffect } from 'react'

interface MollieIDEALProps {
  onBankSelected: (bankId: string, bankName: string) => void;
  selectedBank?: string;
}

interface IDEALBank {
  id: string;
  name: string;
  image?: {
    size1x: string;
    size2x: string;
  };
}

export default function MollieIDEAL({ onBankSelected, selectedBank }: MollieIDEALProps) {
  const [banks, setBanks] = useState<IDEALBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/payment/mollie/methods/ideal');
        
        if (!response.ok) {
          throw new Error('Fout bij ophalen van iDEAL banken');
        }
        
        const data = await response.json();
        if (data.success && data.banks) {
          setBanks(data.banks);
        } else {
          throw new Error(data.message || 'Geen banken gevonden');
        }
      } catch (err) {
        console.error('Error fetching iDEAL banks:', err);
        setError(err instanceof Error ? err.message : 'Onbekende fout');
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          iDEAL Bank Selectie
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Banken laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Fout bij laden van banken
        </h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Kies je bank
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {banks.map((bank) => (
          <div
            key={bank.id}
            onClick={() => onBankSelected(bank.id, bank.name)}
            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
              selectedBank === bank.id
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {bank.image && (
                <img
                  src={bank.image.size2x || bank.image.size1x}
                  alt={`${bank.name} logo`}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="font-medium text-gray-900">{bank.name}</span>
              {selectedBank === bank.id && (
                <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Je wordt doorgestuurd naar je eigen bank om de betaling te autoriseren
      </p>
    </div>
  );
}
