import { useState, useEffect } from 'react';

interface ShippingAddress {
  id?: number;
  customer_id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ShippingAddressManagerProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
}

export default function ShippingAddressManager({ customerId, customerName, onClose }: ShippingAddressManagerProps) {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [formData, setFormData] = useState<ShippingAddress>({
    customer_id: customerId,
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Nederland',
    phone: '',
    is_default: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [customerId]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`/api/shipping-addresses?customer_id=${customerId}`);
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingAddress 
        ? `/api/shipping-addresses` 
        : `/api/shipping-addresses`;
      
      const method = editingAddress ? 'PUT' : 'POST';
      const body = editingAddress 
        ? { ...formData, id: editingAddress.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        const error = await response.json();
        alert('Fout: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Fout bij opslaan van verzendadres');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('Weet je zeker dat je dit verzendadres wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/shipping-addresses?id=${addressId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAddresses();
      } else {
        alert('Fout bij verwijderen van verzendadres');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Fout bij verwijderen van verzendadres');
    }
  };

  const handleEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    setFormData(address);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: customerId,
      name: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'Nederland',
      phone: '',
      is_default: false
    });
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Verzendadressen - {customerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!showForm ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                {addresses.length} verzendadres(sen) gevonden
              </p>
              <button
                onClick={handleAddNew}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Nieuw Verzendadres
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen verzendadressen gevonden. Voeg er een toe om te beginnen.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{address.name}</h3>
                          {address.is_default && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Standaard
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {address.address}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {address.postal_code} {address.city}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-gray-600">
                            📞 {address.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(address)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => address.id && handleDelete(address.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Bijv. Thuis, Werk, Vakantiehuis"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0612345678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Straatnaam en huisnummer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stad *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Amsterdam"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1000 AA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nederland"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                Dit is het standaard verzendadres
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuleer
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Opslaan...' : (editingAddress ? 'Bijwerken' : 'Toevoegen')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 