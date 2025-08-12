'use client';

import { useState, useEffect } from 'react';

interface DhlSettings {
  enabled: boolean;
  api_key: string;
  api_secret: string;
  account_number: string;
  test_mode: boolean;
  default_service: string;
  pickup_location: string;
  sender_name: string;
  sender_company: string;
  sender_address: string;
  sender_city: string;
  sender_postal_code: string;
  sender_country: string;
  sender_phone: string;
  sender_email: string;
}

export default function DhlParcelSettings() {
  const [settings, setSettings] = useState<DhlSettings>({
    enabled: false,
    api_key: '',
    api_secret: '',
    account_number: '',
    test_mode: true,
    default_service: 'parcel',
    pickup_location: '',
    sender_name: '',
    sender_company: '',
    sender_address: '',
    sender_city: '',
    sender_postal_code: '',
    sender_country: 'NL',
    sender_phone: '',
    sender_email: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/dhl-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching DHL settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/dhl-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('DHL instellingen opgeslagen!');
      } else {
        alert('Fout bij opslaan van DHL instellingen');
      }
    } catch (error) {
      console.error('Error saving DHL settings:', error);
      alert('Fout bij opslaan van DHL instellingen');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTestResult('Testing connection...');
    
    try {
      const response = await fetch('/api/dhl-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult('✅ Verbinding succesvol! DHL API is bereikbaar.');
      } else {
        setTestResult(`❌ Fout: ${result.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      setTestResult('❌ Fout bij testen van verbinding');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Laden...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">DHL Parcel Instellingen</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enabled"
            checked={settings.enabled}
            onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
            className="rounded"
          />
          <label htmlFor="enabled" className="text-sm font-medium">
            DHL Parcel integratie inschakelen
          </label>
        </div>

        {settings.enabled && (
          <>
            {/* API Configuration */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium mb-4">API Configuratie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="password"
                    value={settings.api_key}
                    onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="DHL API Key"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">API Secret</label>
                  <input
                    type="password"
                    value={settings.api_secret}
                    onChange={(e) => setSettings({...settings, api_secret: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="DHL API Secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="text"
                    value={settings.account_number}
                    onChange={(e) => setSettings({...settings, account_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="DHL Account Number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Test Mode</label>
                  <select
                    value={settings.test_mode ? 'true' : 'false'}
                    onChange={(e) => setSettings({...settings, test_mode: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="true">Test Mode</option>
                    <option value="false">Production Mode</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={testConnection}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Test Verbinding
                </button>
                {testResult && (
                  <p className="mt-2 text-sm">{testResult}</p>
                )}
              </div>
            </div>

            {/* Sender Information */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium mb-4">Afzender Informatie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Naam</label>
                  <input
                    type="text"
                    value={settings.sender_name}
                    onChange={(e) => setSettings({...settings, sender_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Afzender naam"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrijf</label>
                  <input
                    type="text"
                    value={settings.sender_company}
                    onChange={(e) => setSettings({...settings, sender_company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Bedrijfsnaam"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Adres</label>
                  <input
                    type="text"
                    value={settings.sender_address}
                    onChange={(e) => setSettings({...settings, sender_address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Straat en huisnummer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Plaats</label>
                  <input
                    type="text"
                    value={settings.sender_city}
                    onChange={(e) => setSettings({...settings, sender_city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Plaats"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Postcode</label>
                  <input
                    type="text"
                    value={settings.sender_postal_code}
                    onChange={(e) => setSettings({...settings, sender_postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Postcode"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Land</label>
                  <select
                    value={settings.sender_country}
                    onChange={(e) => setSettings({...settings, sender_country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="NL">Nederland</option>
                    <option value="BE">België</option>
                    <option value="DE">Duitsland</option>
                    <option value="FR">Frankrijk</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Telefoon</label>
                  <input
                    type="tel"
                    value={settings.sender_phone}
                    onChange={(e) => setSettings({...settings, sender_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Telefoonnummer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={settings.sender_email}
                    onChange={(e) => setSettings({...settings, sender_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="E-mailadres"
                  />
                </div>
              </div>
            </div>

            {/* Service Configuration */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium mb-4">Service Configuratie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Standaard Service</label>
                  <select
                    value={settings.default_service}
                    onChange={(e) => setSettings({...settings, default_service: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="parcel">DHL Parcel</option>
                    <option value="express">DHL Express</option>
                    <option value="economy">DHL Economy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={settings.pickup_location}
                    onChange={(e) => setSettings({...settings, pickup_location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Pickup locatie (optioneel)"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Instellingen Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
} 