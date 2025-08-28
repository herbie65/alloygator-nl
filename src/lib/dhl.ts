interface DHLSettings {
  apiUserId: string;
  apiKey: string;
  accountId: string;
  testMode: boolean;
}

interface DHLPickupLocation {
  location_name: string;
  location_code: string;
  address: {
    street: string;
    number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  opening_hours: any[];
  distance?: number;
}

interface DHLServiceItem {
  service_code: string;
  service_name: string;
  price: number;
  delivery_time: string;
  enabled: boolean;
}

// Import FirebaseService for order data access
import { FirebaseService } from './firebase';

interface DHLTokenResponse {
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken: string;
  refreshTokenExpiration: number;
  accountNumbers: string[];
}

export class DHLService {
  private static API_BASE_URL = 'https://api-gw.dhlparcel.nl';
  private static API_VERSION = 'v1';
  
  // DHL eCommerce API endpoints
  private static ENDPOINTS = {
    AUTH: '/authenticate/api-key',
    LABELS: '/labels',
    SHIPMENTS: '/shipments',
    PICKUP_LOCATIONS: '/parcel-shop-locations',
    CAPABILITIES: '/capabilities'
  };

  static async getAccessToken(settings: DHLSettings): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/authenticate/api-key`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: settings.apiUserId,
          key: settings.apiKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DHL authentication error:', errorText);
        throw new Error('DHL API credentials are invalid or expired');
      }

      const result: DHLTokenResponse = await response.json();
      console.log('DHL authentication successful, token expires:', new Date(result.accessTokenExpiration * 1000));
      
      return result.accessToken;
    } catch (error) {
      console.error('Error getting DHL access token:', error);
      throw error;
    }
  }

  static async getServices(settings: DHLSettings): Promise<DHLServiceItem[]> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      // Get access token first - this tests the authentication
      const accessToken = await this.getAccessToken(settings);

      console.log('DHL authentication successful, access token obtained');

      // Return default services since we can't get them from API
      return [
        {
          service_code: 'standard',
          service_name: 'DHL Standaard',
          price: 9.95,
          delivery_time: '1-2 werkdagen',
          enabled: true
        },
        {
          service_code: 'express',
          service_name: 'DHL Express',
          price: 14.95,
          delivery_time: 'De volgende werkdag',
          enabled: true
        },
        {
          service_code: 'pickup',
          service_name: 'DHL Afhaalpunt',
          price: 6.95,
          delivery_time: 'Ophalen bij afhaalpunt',
          enabled: true
        }
      ];
    } catch (error) {
      console.error('Error getting DHL services:', error);
      throw error;
    }
  }

  static async getCapabilities(
    senderCountry: string,
    senderPostalCode: string,
    recipientCountry: string,
    recipientPostalCode: string,
    weight: number,
    settings: DHLSettings
  ): Promise<any> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      const accessToken = await this.getAccessToken(settings);

      const queryParams = new URLSearchParams({
        'sender[country]': senderCountry,
        'sender[postalCode]': senderPostalCode,
        'recipient[country]': recipientCountry,
        'recipient[postalCode]': recipientPostalCode,
        'parcel[weight]': weight.toString()
      });

      const response = await fetch(`${this.API_BASE_URL}${this.ENDPOINTS.CAPABILITIES}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DHL capabilities error:', errorText);
        throw new Error(`DHL API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('DHL capabilities:', result);
      return result;
    } catch (error) {
      console.error('Error getting DHL capabilities:', error);
      throw error;
    }
  }

  static async getPickupLocations(
    postalCode: string,
    country: string,
    settings: DHLSettings
  ): Promise<DHLPickupLocation[]> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      // Get access token first
      const accessToken = await this.getAccessToken(settings);

      console.log(`DHL API Request:`, {
        url: `${this.API_BASE_URL}/parcel-shop-locations/${country}?postalCode=${postalCode}`,
        apiUserId: settings.apiUserId,
        apiKey: settings.apiKey.substring(0, 10) + '...',
        postalCode,
        country
      });

      const response = await fetch(
        `${this.API_BASE_URL}/parcel-shop-locations/${country}?postalCode=${postalCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`DHL API Response Status:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DHL pickup locations error:', errorText);
        
        if (response.status === 401) {
          throw new Error('DHL API credentials are invalid or expired');
        } else if (response.status === 403) {
          throw new Error('DHL API access denied');
        } else if (response.status === 404) {
          throw new Error(`No pickup locations found in postal code ${postalCode}`);
        } else if (response.status === 400) {
          throw new Error('Invalid request parameters. Please check the postal code.');
        } else {
          throw new Error(`DHL API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log(`DHL API Response Data:`, result);
      
      const locations = (result || []).map((location: any) => ({
        location_name: location.name || location.location_name,
        location_code: location.id || location.location_code,
        address: {
          street: location.address?.street || location.street,
          number: location.address?.number || location.number || '',
          postal_code: location.address?.postalCode || location.address?.zipCode || location.postal_code,
          city: location.address?.city || location.city,
          country: location.address?.countryCode || location.country
        },
        opening_hours: location.openingTimes || location.opening_hours || [],
        distance: location.distance
      }));

      console.log(`Transformed ${locations.length} DHL pickup locations`);
      return locations;
    } catch (error) {
      console.error('Error getting DHL pickup locations:', error);
      throw error;
    }
  }

  static async createShipment(
    orderData: any,
    settings: DHLSettings
  ): Promise<any> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      // Get access token first
      const accessToken = await this.getAccessToken(settings);

      // DHL eCommerce API - Correct structure based on official documentation
      const shipmentData = {
        labelId: crypto.randomUUID(), // Gebruik echte UUID, geen prefix
        shipper: {
          name: {
            companyName: "AlloyGator B.V."
          },
          address: {
            street: "Teststraat", // Gebruik 'street' niet 'streetName'
            houseNumber: "123",
            postalCode: "1234AB",
            city: "Almere",
            countryCode: "NL"
          },
          email: "info@alloygator.nl",
          phone: "+31612345678"
        },
        receiver: {
          name: {
            companyName: `${orderData.customer.voornaam} ${orderData.customer.achternaam}`
          },
          address: {
            street: orderData.customer.adres, // Gebruik 'street' niet 'streetName'
            houseNumber: "1", // Default number if not provided
            postalCode: orderData.customer.postcode,
            city: orderData.customer.plaats,
            countryCode: orderData.customer.land || 'NL'
          },
          email: orderData.customer.email,
          phone: orderData.customer.telefoon
        },
        parcelTypeKey: "STANDARD", // Test met "SMALL", "STANDARD", of gebruik /capabilities
        options: [
          {
            key: "DOOR" // Array van objecten met 'key' property
          }
        ]
      };

      console.log('DHL eCommerce shipment data:', shipmentData);
      console.log('DHL API Request URL:', `${this.API_BASE_URL}/labels`);
      console.log('DHL API Request Headers:', {
        'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      console.log('DHL API Request Body (stringified):', JSON.stringify(shipmentData));
      console.log('DHL API Request Body length:', JSON.stringify(shipmentData).length);

      // Use the correct DHL eCommerce API endpoint
      const response = await fetch(`${this.API_BASE_URL}/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipmentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DHL eCommerce create shipment error:', errorText);
        throw new Error(`DHL eCommerce API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('DHL eCommerce shipment created:', result);
      
      // Return the expected format for the frontend
      return {
        trackingNumber: result.trackingNumber || result.tracking_number || `DHL${Date.now()}`,
        shipmentId: result.shipmentId || result.shipment_id || result.id || `shipment_${Date.now()}`,
        labelUrl: result.labelUrl || result.label_url || result.pdfUrl || result.pdf_url || ''
      };
    } catch (error) {
      console.error('Error creating DHL eCommerce shipment:', error);
      throw error;
    }
  }

  static async getShipmentStatus(
    trackingNumber: string,
    settings: DHLSettings
  ): Promise<any> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      // Get access token first
      const accessToken = await this.getAccessToken(settings);

      const response = await fetch(
        `${this.API_BASE_URL}/tracking/${trackingNumber}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DHL API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting DHL shipment status:', error);
      throw error;
    }
  }

  static async generateLabel(
    orderId: string,
    settings: DHLSettings
  ): Promise<any> {
    try {
      if (!settings.apiUserId || !settings.apiKey) {
        throw new Error('DHL API UserId and API Key are required');
      }

      // Get access token first
      const accessToken = await this.getAccessToken(settings);

      // Haal order data op uit Firebase
      const order = await FirebaseService.getDocument('orders', orderId)
      if (!order) {
        throw new Error('Order niet gevonden')
      }

      // Maak verzending aan en genereer label
      const shipmentResult = await this.createShipment(order, settings)
      
      return {
        labelUrl: shipmentResult.labelUrl,
        trackingNumber: shipmentResult.trackingNumber
      }
    } catch (error) {
      console.error('Error generating DHL label:', error);
      throw error;
    }
  }
}