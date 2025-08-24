import { useState } from 'react';

interface CustomerImportProps {
  onImport: (customers: any[]) => void;
  onClose: () => void;
}

interface ImportedCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  invoice_email?: string;
  website?: string;
  vat_number?: string;
  customer_group_id: number;
  is_dealer: boolean;
  show_on_map: boolean;
  // Verzendadres velden
  separate_shipping_address?: boolean;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
}

export default function CustomerImport({ onImport, onClose }: CustomerImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Alleen CSV bestanden zijn toegestaan');
      return;
    }

    setFile(selectedFile);
    setError('');
    parseCSV(selectedFile);
  };

  // Functie om adres te parsen uit één veld
  const parseAddress = (addressString: string) => {
    if (!addressString) return { address: '', city: '', postal_code: '' };
    
    // Verwijder dubbele spaties en trim
    const cleanAddress = addressString.replace(/\s+/g, ' ').trim();
    
    // Regex patterns voor Nederlandse adressen
    const patterns = [
      // Patroon: "Straatnaam 123 Stad 1234 AB"
      /^(.+?)\s+(\d+[A-Za-z]?)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})$/,
      // Patroon: "Straatnaam 123 Stad 1234AB"
      /^(.+?)\s+(\d+[A-Za-z]?)\s+(.+?)\s+(\d{4}[A-Z]{2})$/,
      // Patroon: "Straatnaam 123, Stad 1234 AB"
      /^(.+?)\s+(\d+[A-Za-z]?),\s*(.+?)\s+(\d{4}\s*[A-Z]{2})$/,
      // Patroon: "Straatnaam 123, Stad 1234AB"
      /^(.+?)\s+(\d+[A-Za-z]?),\s*(.+?)\s+(\d{4}[A-Z]{2})$/,
      // Patroon: "Straatnaam 123 Stad 1234 AB"
      /^(.+?)\s+(\d+[A-Za-z]?)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})$/,
      // Patroon: "Straatnaam 123 Stad 1234AB"
      /^(.+?)\s+(\d+[A-Za-z]?)\s+(.+?)\s+(\d{4}[A-Z]{2})$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanAddress.match(pattern);
      if (match) {
        return {
          address: `${match[1]} ${match[2]}`.trim(),
          city: match[3].trim(),
          postal_code: match[4].replace(/\s+/g, '').toUpperCase()
        };
      }
    }
    
    // Als geen patroon matcht, probeer postcode te vinden
    const postcodeMatch = cleanAddress.match(/(\d{4}\s*[A-Z]{2})/);
    if (postcodeMatch && postcodeMatch.index !== undefined) {
      const postcode = postcodeMatch[1].replace(/\s+/g, '').toUpperCase();
      const beforePostcode = cleanAddress.substring(0, postcodeMatch.index).trim();
      const afterPostcode = cleanAddress.substring(postcodeMatch.index + postcode.length).trim();
      
      // Zoek naar huisnummer
      const houseNumberMatch = beforePostcode.match(/(.+?)\s+(\d+[A-Za-z]?)$/);
      if (houseNumberMatch) {
        return {
          address: beforePostcode.trim(),
          city: afterPostcode.trim(),
          postal_code: postcode
        };
      }
    }
    
    // Default: alles als adres
    return {
      address: cleanAddress,
      city: '',
      postal_code: ''
    };
  };

  // Betere CSV parser die rekening houdt met komma's binnen velden
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(field => field.replace(/^"|"$/g, '')); // Verwijder quotes
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setError('CSV bestand is leeg');
        return;
      }
      
      const headers = parseCSVLine(lines[0]);
      console.log('Headers:', headers); // Debug
      
      const customers: ImportedCustomer[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = parseCSVLine(lines[i]);
          console.log(`Row ${i}:`, values); // Debug
          
          const customer: any = {};
          
          headers.forEach((header, index) => {
            customer[header] = values[index] || '';
          });

          // Map verschillende mogelijke header namen naar standaard namen
          const headerMapping: { [key: string]: string } = {
            'naam': 'name',
            'name': 'name',
            'email': 'email',
            'telefoon': 'phone',
            'phone': 'phone',
            'adres': 'address',
            'address': 'address',
            'plaats': 'city',
            'city': 'city',
            'postcode': 'postal_code',
            'postal_code': 'postal_code',
            'land': 'country',
            'country': 'country',
            'bedrijfsnaam': 'company_name',
            'company_name': 'company_name',
            'voornaam': 'first_name',
            'first_name': 'first_name',
            'achternaam': 'last_name',
            'last_name': 'last_name',
            'factuur_email': 'invoice_email',
            'invoice_email': 'invoice_email',
            'website': 'website',
            'btw_nummer': 'vat_number',
            'vat_number': 'vat_number',
            'klantgroep': 'customer_group_id',
            'customer_group_id': 'customer_group_id',
            'is_dealer': 'is_dealer',
            'show_on_map': 'show_on_map',
            // Nieuwe mappings voor jouw CSV formaat
            'billing address': 'address',
            'shipping address': 'shipping_address',
            'street address': 'address',
            'zip': 'postal_code'
          };

          // Normaliseer de data naar standaard veldnamen
          const normalizedCustomer: any = {};
          Object.keys(customer).forEach(key => {
            const normalizedKey = headerMapping[key.toLowerCase()] || key;
            normalizedCustomer[normalizedKey] = customer[key];
          });
          
          // Vervang customer met genormaliseerde versie
          Object.assign(customer, normalizedCustomer);

          // Parse adres als het in één veld staat
          if (customer.address && !customer.city && !customer.postal_code) {
            const parsedAddress = parseAddress(customer.address);
            customer.address = parsedAddress.address;
            customer.city = parsedAddress.city;
            customer.postal_code = parsedAddress.postal_code;
          }

          // Als we nog steeds geen adres hebben, probeer andere velden
          if (!customer.address || !customer.city || !customer.postal_code) {
            // Probeer Billing Address als hoofdadres
            if (customer['Billing Address'] && !customer.address) {
              const parsedAddress = parseAddress(customer['Billing Address']);
              customer.address = parsedAddress.address;
              customer.city = parsedAddress.city;
              customer.postal_code = parsedAddress.postal_code;
            }
            
            // Probeer Street Address + City + ZIP combinatie
            if (customer['Street Address'] && customer.City && customer.ZIP && !customer.address) {
              customer.address = customer['Street Address'];
              customer.city = customer.City;
              customer.postal_code = customer.ZIP;
            }
            
            // Probeer Shipping Address als verzendadres
            if (customer['Shipping Address'] && !customer.shipping_address) {
              const parsedShippingAddress = parseAddress(customer['Shipping Address']);
              customer.shipping_address = parsedShippingAddress.address;
              customer.shipping_city = parsedShippingAddress.city;
              customer.shipping_postal_code = parsedShippingAddress.postal_code;
              customer.separate_shipping_address = true;
            }
          }

          // Default waarden instellen voor zilver dealers
          customer.customer_group_id = customer.customer_group_id || 3; // Zilver Dealers
          customer.is_dealer = customer.is_dealer === 'true' || customer.is_dealer === '1' || true; // Standaard dealer voor zilver
          customer.show_on_map = customer.show_on_map === 'true' || customer.show_on_map === '1' || true; // Standaard zichtbaar
          customer.country = customer.country || 'Nederland';
          
          // Verzendadres default waarden
          customer.separate_shipping_address = customer.separate_shipping_address === 'true' || customer.separate_shipping_address === '1';
          customer.shipping_address = customer.shipping_address || customer.address || '';
          customer.shipping_city = customer.shipping_city || customer.city || '';
          customer.shipping_postal_code = customer.shipping_postal_code || customer.postal_code || '';
          customer.shipping_country = customer.shipping_country || customer.country || 'Nederland';
          
          customers.push(customer);
        }
      }
      
      console.log('Parsed customers:', customers); // Debug
      setPreview(customers);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    
    setIsLoading(true);
    try {
      await onImport(preview);
      onClose();
    } catch (error) {
      setError('Fout bij importeren: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Klanten Importeren</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV Bestand Selecteren
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Debug Info:</strong> {preview.length} klanten geladen. 
            Eerste klant: {preview[0]?.name || 'Geen naam'} - 
            Adres: {preview[0]?.address || 'Geen adres'}
            <br />
            <strong>Headers gevonden:</strong> {Object.keys(preview[0] || {}).join(', ')}
            <br />
            <strong>Eerste rij data:</strong> {JSON.stringify(preview[0] || {}, null, 2)}
          </div>
        )}

        {preview.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">
              Voorvertoning ({preview.length} klanten)
            </h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Naam
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefoon
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factuuradres
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verzendadres
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dealer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(0, 10).map((customer, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.email}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.phone}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.address ? `${customer.address}, ${customer.city}` : 'Geen adres'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.separate_shipping_address ? (
                          <span className="text-green-600">
                            {customer.shipping_address}, {customer.shipping_city}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Gelijk aan factuuradres</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {customer.is_dealer ? 'Ja' : 'Nee'}
                      </td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-sm text-gray-500 text-center">
                        ... en {preview.length - 10} meer klanten
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuleer
          </button>
          <button
            onClick={handleImport}
            disabled={!preview.length || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importeren...' : `Importeer ${preview.length} klanten`}
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">CSV Formaat:</h4>
          <p className="text-sm text-gray-600 mb-2">
            Je CSV bestand moet de volgende kolommen bevatten:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li><strong>name</strong> - Volledige naam</li>
            <li><strong>email</strong> - Email adres</li>
            <li><strong>phone</strong> - Telefoonnummer</li>
            <li><strong>address</strong> - Factuuradres (kan ook gecombineerd zijn: "Straatnaam 123 Stad 1234 AB")</li>
            <li><strong>city</strong> - Factuuradres stad (optioneel als address gecombineerd is)</li>
            <li><strong>postal_code</strong> - Factuuradres postcode (optioneel als address gecombineerd is)</li>
            <li><strong>country</strong> - Factuuradres land (optioneel, standaard: Nederland)</li>
            <li><strong>company_name</strong> - Bedrijfsnaam (optioneel)</li>
            <li><strong>first_name</strong> - Voornaam (optioneel)</li>
            <li><strong>last_name</strong> - Achternaam (optioneel)</li>
            <li><strong>invoice_email</strong> - Factuur email (optioneel)</li>
            <li><strong>website</strong> - Website (optioneel)</li>
            <li><strong>vat_number</strong> - BTW nummer (optioneel)</li>
            <li><strong>customer_group_id</strong> - Klantgroep ID (standaard: 1)</li>
            <li><strong>is_dealer</strong> - Is dealer (true/false, standaard: false)</li>
            <li><strong>show_on_map</strong> - Zichtbaar op kaart (true/false, standaard: false)</li>
            <li><strong>separate_shipping_address</strong> - Apart verzendadres (true/false, standaard: false)</li>
            <li><strong>shipping_address</strong> - Verzendadres (optioneel, standaard: factuuradres)</li>
            <li><strong>shipping_city</strong> - Verzendadres stad (optioneel, standaard: factuuradres stad)</li>
            <li><strong>shipping_postal_code</strong> - Verzendadres postcode (optioneel, standaard: factuuradres postcode)</li>
            <li><strong>shipping_country</strong> - Verzendadres land (optioneel, standaard: factuuradres land)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 