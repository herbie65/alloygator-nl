'use client';

import { useState, useEffect } from 'react';
import { FirebaseClientService } from '@/lib/firebase-client';

interface ShippingMethod {
  id: string;
  method_name: string;
  display_name: string;
  cost: number;
  description: string;
  delivery_time: string;
  is_active: boolean;
  sort_order: number;
}

export default function ShippingSettings() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      // Load from localStorage for static export
      const savedShippingSettings = localStorage.getItem('shippingSettings')
      if (savedShippingSettings) {
        const settings = JSON.parse(savedShippingSettings)
        if (settings.methods && Array.isArray(settings.methods)) {
          // Ensure all methods have unique IDs
          const methodsWithIds = settings.methods.map((method: any, index: number) => ({
            ...method,
            id: method.id || `shipping_${method.method_name}_${Date.now()}_${index}`
          }));
          setShippingMethods(methodsWithIds)
          console.log('Shipping methods loaded from localStorage:', methodsWithIds)
        } else {
          // Show empty state if no methods found
          setShippingMethods([])
          console.log('No shipping methods found in localStorage')
        }
      } else {
        // Show empty state if no localStorage data
        setShippingMethods([])
        console.log('No shipping settings found in localStorage')
      }
    } catch (error) {
      console.error('Error loading shipping settings:', error);
      setMessage({ type: 'error', text: 'Fout bij ophalen van verzendinstellingen' });
      // Show empty state on error
      setShippingMethods([])
    } finally {
      setLoading(false);
    }
  };

  const handleMethodUpdate = async (method: ShippingMethod) => {
    setSaving(true);
    try {
      // Update local state
      setShippingMethods(prev => 
        prev.map(m => m.id === method.id ? method : m)
      );
      
      // Save to localStorage
      const settingsToSave = {
        methods: shippingMethods.filter(m => m.is_active),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('shippingSettings', JSON.stringify(settingsToSave))
      
      setMessage({ type: 'success', text: 'Verzendinstellingen bijgewerkt! (Opgeslagen in browser)' });
    } catch (error) {
      console.error('Error updating shipping method:', error);
      setMessage({ type: 'error', text: 'Fout bij bijwerken van verzendinstellingen' });
    } finally {
      setSaving(false);
    }
  };

  const handleMethodChange = (id: string, field: keyof ShippingMethod, value: any) => {
    setShippingMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save to localStorage for static export
      const settingsToSave = {
        methods: shippingMethods.filter(method => method.is_active),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('shippingSettings', JSON.stringify(settingsToSave))
      
      setMessage({ type: 'success', text: 'Verzendinstellingen opgeslagen! (Opgeslagen in browser)' });
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      setMessage({ type: 'error', text: 'Fout bij opslaan van verzendinstellingen' });
    } finally {
      setSaving(false);
    }
  };

  const addNewMethod = () => {
    const newMethod: ShippingMethod = {
      id: 'shipping_new_' + Date.now(),
      method_name: '',
      display_name: '',
      cost: 0,
      description: '',
      delivery_time: '',
      is_active: true,
      sort_order: shippingMethods.length + 1
    };
    setShippingMethods(prev => [...prev, newMethod]);
  };

  const removeMethod = async (id: string) => {
    try {
      // Remove from local state
      setShippingMethods(prev => prev.filter(method => method.id !== id));
      
      // Save to localStorage
      const settingsToSave = {
        methods: shippingMethods.filter(m => m.is_active && m.id !== id),
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('shippingSettings', JSON.stringify(settingsToSave))
      
      setMessage({ type: 'success', text: 'Verzendmethode succesvol verwijderd! (Opgeslagen in browser)' });
    } catch (error) {
      console.error('Error removing shipping method:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen verzendmethode' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Verzendinstellingen</h2>
        <div className="space-x-2">
          <button
            onClick={addNewMethod}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Nieuwe Methode
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Alles Opslaan'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {shippingMethods.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen verzendmethodes geconfigureerd</h3>
            <p className="text-gray-600 mb-4">Klik op "Nieuwe Methode" om je eerste verzendmethode toe te voegen.</p>
            <button
              onClick={addNewMethod}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Eerste Verzendmethode Toevoegen
            </button>
          </div>
        ) : (
          shippingMethods.map((method, index) => (
          <div key={method.id || index} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {method.display_name || 'Nieuwe Verzendmethode'}
              </h3>
              <button
                onClick={() => removeMethod(method.id)}
                className="text-red-600 hover:text-red-800"
              >
                Verwijderen
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Methode Naam
                </label>
                <input
                  type="text"
                  value={method.method_name}
                  onChange={(e) => handleMethodChange(method.id, 'method_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weergave Naam
                </label>
                <input
                  type="text"
                  value={method.display_name}
                  onChange={(e) => handleMethodChange(method.id, 'display_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Standaard Verzending"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kosten (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={method.cost}
                  onChange={(e) => handleMethodChange(method.id, 'cost', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Levertijd
                </label>
                <input
                  type="text"
                  value={method.delivery_time}
                  onChange={(e) => handleMethodChange(method.id, 'delivery_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="2-3 werkdagen"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  value={method.description}
                  onChange={(e) => handleMethodChange(method.id, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Beschrijving van de verzendmethode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sorteer Volgorde
                </label>
                <input
                  type="number"
                  value={method.sort_order}
                  onChange={(e) => handleMethodChange(method.id, 'sort_order', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`active-${method.id}`}
                  checked={method.is_active}
                  onChange={(e) => handleMethodChange(method.id, 'is_active', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor={`active-${method.id}`} className="ml-2 block text-sm text-gray-900">
                  Actief
                </label>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => handleMethodUpdate(method)}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
} 