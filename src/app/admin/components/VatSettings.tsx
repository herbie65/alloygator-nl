"use client";

import { useState, useEffect } from 'react';
import { FirebaseClientService } from '@/lib/firebase-client';

interface VatSetting {
  id: string;
  country_code: string;
  country_name: string;
  standard_rate: number;
  reduced_rate: number;
  zero_rate: number;
  is_eu_member: boolean;
  reverse_charge_enabled: boolean;
}

interface DisplaySetting {
  id?: string;
  setting_key: string;
  setting_value: boolean;
  description: string;
}

export default function VatSettings() {
  const [vatSettings, setVatSettings] = useState<VatSetting[]>([]);
  const [displaySettings, setDisplaySettings] = useState<DisplaySetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVatSettings();
  }, []);

  const fetchVatSettings = async () => {
    try {
      console.log('Fetching VAT settings...');
      const data = await FirebaseClientService.getVatSettings();
      console.log('VAT settings data:', data);
      
      if (data && Array.isArray(data)) {
        setVatSettings(data as VatSetting[]);
      } else {
        // Create default VAT settings if none exist
        const defaultVatSettings: VatSetting[] = [
          {
            id: '',
            country_code: 'NL',
            country_name: 'Nederland',
            standard_rate: 21,
            reduced_rate: 9,
            zero_rate: 0,
            is_eu_member: true,
            reverse_charge_enabled: true
          },
          {
            id: '',
            country_code: 'BE',
            country_name: 'België',
            standard_rate: 21,
            reduced_rate: 12,
            zero_rate: 0,
            is_eu_member: true,
            reverse_charge_enabled: true
          },
          {
            id: '',
            country_code: 'DE',
            country_name: 'Duitsland',
            standard_rate: 19,
            reduced_rate: 7,
            zero_rate: 0,
            is_eu_member: true,
            reverse_charge_enabled: true
          },
          {
            id: '',
            country_code: 'FR',
            country_name: 'Frankrijk',
            standard_rate: 20,
            reduced_rate: 10,
            zero_rate: 0,
            is_eu_member: true,
            reverse_charge_enabled: true
          },
          {
            id: '',
            country_code: 'GB',
            country_name: 'Verenigd Koninkrijk',
            standard_rate: 20,
            reduced_rate: 5,
            zero_rate: 0,
            is_eu_member: false,
            reverse_charge_enabled: false
          }
        ];
        setVatSettings(defaultVatSettings);
      }
      
      // Create default display settings
      const defaultDisplaySettings: DisplaySetting[] = [
        {
          setting_key: 'frontend_prices_include_vat',
          setting_value: true,
          description: 'Toon prijzen inclusief BTW in frontend'
        },
        {
          setting_key: 'dealer_prices_exclude_vat',
          setting_value: true,
          description: 'Toon prijzen exclusief BTW voor dealers'
        },
        {
          setting_key: 'backend_prices_exclude_vat',
          setting_value: true,
          description: 'Prijzen in backend zijn exclusief BTW'
        },
        {
          setting_key: 'auto_calculate_vat',
          setting_value: true,
          description: 'Automatische BTW berekening'
        },
        {
          setting_key: 'reverse_charge_enabled',
          setting_value: true,
          description: 'BTW verlegging inschakelen'
        }
      ];
      setDisplaySettings(defaultDisplaySettings);
    } catch (error) {
      console.error('Error fetching VAT settings:', error);
    }
  };

  const handleVatSettingUpdate = async (setting: VatSetting) => {
    setLoading(true);
    setMessage('');
    
    try {
      if (setting.id) {
        // Update existing setting
        await FirebaseClientService.updateDocumentInCollection('vat_settings', setting.id, setting);
        setMessage('BTW instelling succesvol bijgewerkt!');
      } else {
        // Add new setting
        const newSetting = await FirebaseClientService.addDocument('vat_settings', setting);
        setMessage('BTW instelling succesvol toegevoegd!');
        // Update the setting with the new ID
        setting.id = newSetting.id;
      }
      
      // Update local state
      setVatSettings(prev => 
        prev.map(s => s.id === setting.id ? setting : s)
      );
    } catch (error) {
      console.error('Error updating VAT setting:', error);
      setMessage('Fout bij bijwerken BTW instelling');
    } finally {
      setLoading(false);
    }
  };

  const handleDisplaySettingUpdate = async (settingKey: string, settingValue: boolean) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Update local state immediately
      setDisplaySettings(prev => 
        prev.map(s => s.setting_key === settingKey ? { ...s, setting_value: settingValue } : s)
      );
      
      // Find existing display setting
      const existingSetting = displaySettings.find(s => s.setting_key === settingKey);
      
      if (existingSetting && existingSetting.id) {
        // Update existing setting
        await FirebaseClientService.updateDocumentInCollection('vat_display_settings', existingSetting.id, {
          setting_key: settingKey,
          setting_value: settingValue,
          description: existingSetting.description
        });
      } else {
        // Add new setting
        const newSetting = await FirebaseClientService.addDocument('vat_display_settings', {
          setting_key: settingKey,
          setting_value: settingValue,
          description: 'BTW display instelling'
        });
        
        // Update local state with new ID
        setDisplaySettings(prev => 
          prev.map(s => s.setting_key === settingKey ? { ...s, id: newSetting.id } : s)
        );
      }
      
      setMessage('Display instelling succesvol bijgewerkt!');
    } catch (error) {
      console.error('Error updating display setting:', error);
      setMessage('Fout bij bijwerken display instelling');
    } finally {
      setLoading(false);
    }
  };

  const updateVatSetting = (id: string, field: keyof VatSetting, value: any) => {
    setVatSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, [field]: value } : setting
      )
    );
  };

  const updateDisplaySetting = (settingKey: string, value: boolean) => {
    setDisplaySettings(prev => 
      prev.map(setting => 
        setting.setting_key === settingKey ? { ...setting, setting_value: value } : setting
      )
    );
  };

  const addNewVatSetting = () => {
    const newSetting: VatSetting = {
      id: '',
      country_code: '',
      country_name: '',
      standard_rate: 21,
      reduced_rate: 9,
      zero_rate: 0,
      is_eu_member: true,
      reverse_charge_enabled: true
    };
    setVatSettings(prev => [...prev, newSetting]);
  };

  const removeVatSetting = async (id: string) => {
    try {
      if (id) {
        // Remove from database
        await FirebaseClientService.deleteDocumentFromCollection('vat_settings', id);
        setMessage('BTW instelling succesvol verwijderd!');
      }
      // Remove from local state
      setVatSettings(prev => prev.filter(setting => setting.id !== id));
    } catch (error) {
      console.error('Error removing VAT setting:', error);
      setMessage('Fout bij verwijderen BTW instelling');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">BTW Instellingen</h2>
        <button
          onClick={addNewVatSetting}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nieuwe BTW Instelling
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded ${message.includes('succesvol') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* VAT Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">BTW Tarieven per Land</h3>
        <div className="space-y-4">
          {vatSettings.map((setting, index) => (
            <div key={setting.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land Code</label>
                  <input
                    type="text"
                    value={setting.country_code}
                    onChange={(e) => updateVatSetting(setting.id, 'country_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="NL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land Naam</label>
                  <input
                    type="text"
                    value={setting.country_name}
                    onChange={(e) => updateVatSetting(setting.id, 'country_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nederland"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standaard Tarief (%)</label>
                  <input
                    type="number"
                    value={setting.standard_rate}
                    onChange={(e) => updateVatSetting(setting.id, 'standard_rate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verlaagd Tarief (%)</label>
                  <input
                    type="number"
                    value={setting.reduced_rate}
                    onChange={(e) => updateVatSetting(setting.id, 'reduced_rate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nul Tarief (%)</label>
                  <input
                    type="number"
                    value={setting.zero_rate}
                    onChange={(e) => updateVatSetting(setting.id, 'zero_rate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={setting.is_eu_member}
                      onChange={(e) => updateVatSetting(setting.id, 'is_eu_member', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">EU Lid</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={setting.reverse_charge_enabled}
                      onChange={(e) => updateVatSetting(setting.id, 'reverse_charge_enabled', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">BTW Verlegging</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => handleVatSettingUpdate(setting)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Opslaan...' : 'Opslaan'}
                </button>
                {setting.id && (
                  <button
                    onClick={() => removeVatSetting(setting.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">BTW Weergave Instellingen</h3>
        <div className="space-y-4">
          {displaySettings.map((setting) => (
            <div key={setting.setting_key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{setting.description}</h4>
                <p className="text-sm text-gray-600">Instelling: {setting.setting_key}</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={setting.setting_value}
                    onChange={(e) => {
                      updateDisplaySetting(setting.setting_key, e.target.checked);
                      handleDisplaySettingUpdate(setting.setting_key, e.target.checked);
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ingeschakeld</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 