'use client';

import { useState, useEffect } from 'react';

interface ServicePoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  opening_hours: string;
  services: string[];
}

interface ServicePointSelectorProps {
  postalCode: string;
  city: string;
  country: string;
  onSelect: (servicePoint: ServicePoint) => void;
  selectedServicePoint?: ServicePoint;
}

export default function ServicePointSelector({ 
  postalCode, 
  city, 
  country, 
  onSelect, 
  selectedServicePoint 
}: ServicePointSelectorProps) {
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  const fetchServicePoints = async () => {
    if (!postalCode && !city) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (postalCode) params.append('postal_code', postalCode);
      if (city) params.append('city', city);
      if (country) params.append('country', country);

      const response = await fetch(`/api/dhl-servicepoints?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setServicePoints(data.service_points);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fout bij ophalen van servicepunten');
      }
    } catch (error) {
      console.error('Error fetching service points:', error);
      setError('Fout bij ophalen van servicepunten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSelector && (postalCode || city)) {
      fetchServicePoints();
    }
  }, [showSelector, postalCode, city, country]);

  const handleServicePointSelect = (servicePoint: ServicePoint) => {
    onSelect(servicePoint);
    setShowSelector(false);
  };

  return (
    <div className="space-y-4">
      {/* ServicePoint Selection Button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">ServicePoint</span>
          {selectedServicePoint && (
            <p className="text-xs text-gray-500 mt-1">
              Geselecteerd: {selectedServicePoint.name}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {selectedServicePoint ? 'Wijzigen' : 'ServicePoint Zoeken'}
        </button>
      </div>

      {/* ServicePoint Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  ServicePoint Zoeken
                </h3>
                <button
                  onClick={() => setShowSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Zoeken naar DHL ServicePoints in de buurt van {city || postalCode}
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">ServicePoints zoeken...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!loading && !error && servicePoints.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">Geen ServicePoints gevonden in de buurt</p>
                </div>
              )}

              {!loading && !error && servicePoints.length > 0 && (
                <div className="space-y-4">
                  {servicePoints.map((servicePoint) => (
                    <div
                      key={servicePoint.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 cursor-pointer transition-colors"
                      onClick={() => handleServicePointSelect(servicePoint)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{servicePoint.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {servicePoint.address}, {servicePoint.postal_code} {servicePoint.city}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">
                              Afstand: {servicePoint.distance} km
                            </span>
                            <span className="text-xs text-gray-500">
                              {servicePoint.opening_hours}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            DHL ServicePoint
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <p className="text-xs text-gray-500">
                ServicePoints zijn DHL afhaalpunten waar je pakketten kunt ophalen en retourneren.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 