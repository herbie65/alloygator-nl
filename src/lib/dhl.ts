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

interface DHLTokenResponse {
  accessToken: string;
  accessTokenExpiration: number;
  refreshToken: string;
  refreshTokenExpiration: number;
  accountNumbers: string[];
}

export class DHLService {
  private static API_BASE_URL = 'https://api-gw.dhlparcel.nl';

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

      const shipmentData = {
        accountNumber: settings.accountId,
        customer: {
          name: `${orderData.customer.voornaam} ${orderData.customer.achternaam}`,
          email: orderData.customer.email,
          phone: orderData.customer.telefoon,
          address: {
            street: orderData.customer.adres,
            postalCode: orderData.customer.postcode,
            city: orderData.customer.plaats,
            countryCode: orderData.customer.land || 'NL'
          }
        },
        packages: orderData.items.map((item: any) => ({
          weight: 1.0, // Default weight
          length: 30,
          width: 20,
          height: 10
        })),
        serviceCode: orderData.shipping_method || 'standard',
        pickupDate: new Date().toISOString().split('T')[0]
      };

      console.log('DHL shipment data:', shipmentData);

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
        console.error('DHL create shipment error:', errorText);
        throw new Error(`DHL API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('DHL shipment created:', result);
      return result;
    } catch (error) {
      console.error('Error creating DHL shipment:', error);
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
}