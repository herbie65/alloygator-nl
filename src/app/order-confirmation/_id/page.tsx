'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  customer: any;
  items: any[];
  subtotal: number;
  vat_amount: number;
  total: number;
  shipping_method: string;
  shipping_cost: number;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('Debug: Fetching order for ID:', orderId);
        
        // Haal order op uit localStorage
        const savedOrder = localStorage.getItem('lastOrder');
        if (savedOrder) {
          try {
            const parsedOrder = JSON.parse(savedOrder);
            console.log('Debug: Order loaded from localStorage:', parsedOrder);
            setOrder(parsedOrder);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing localStorage order:', parseError);
            localStorage.removeItem('lastOrder'); // Clean up corrupted data
          }
        }

        // Als geen localStorage, probeer uit database
        try {
          console.log('Debug: Attempting to fetch order from database...');
          // TODO: Implementeer database lookup
          setError('Bestelling niet gevonden in localStorage. Probeer de pagina te verversen.');
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          setError('Fout bij ophalen bestelling uit database');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchOrder:', err);
        setError('Onverwachte fout bij ophalen bestelling');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      setError('Geen order ID opgegeven');
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-600">ALLOYGATOR</div>
              <Link href="/" className="text-gray-600 hover:text-gray-900">Terug naar Home</Link>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#a2c614' }}></div>
            <p className="text-gray-600">Bestelling laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-600">ALLOYGATOR</div>
              <Link href="/" className="text-gray-600 hover:text-gray-900">Terug naar Home</Link>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bestelling Niet Gevonden</h1>
            <p className="text-gray-600 mb-6">{error || 'De bestelling kon niet worden opgehaald'}</p>
            <Link 
              href="/winkel" 
              className="inline-block text-white px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: '#a2c614' }}
            >
              Terug naar Winkel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-blue-600">ALLOYGATOR</div>
            <Link href="/" className="text-gray-600 hover:text-gray-900">Terug naar Home</Link>
          </div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" style={{ color: '#a2c614' }}>✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bestelling Bevestigd!</h1>
          <p className="text-gray-600">Bedankt voor je bestelling. Hieronder vind je alle details.</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelling Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Bestelling</h3>
              <p className="text-gray-600">Nummer: <span className="font-mono font-semibold">{order.order_number}</span></p>
              <p className="text-gray-600">Datum: {formatDate(order.created_at)}</p>
              <p className="text-gray-600">Status: <span className="capitalize">{order.status}</span></p>
              <p className="text-gray-600">Betaalstatus: <span className="capitalize">{order.payment_status}</span></p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Klantgegevens</h3>
              <p className="text-gray-600">
                {order.customer?.contact_first_name} {order.customer?.contact_last_name}
              </p>
              <p className="text-gray-600">{order.customer?.email}</p>
              <p className="text-gray-600">{order.customer?.phone}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelde Producten</h2>
          
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center space-x-4">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">Aantal: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.price)} per stuk</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelling Overzicht</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotaal:</span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            
            {order.vat_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">BTW:</span>
                <span className="font-medium">{formatPrice(order.vat_amount)}</span>
              </div>
            )}
            
            {order.shipping_cost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Verzendkosten:</span>
                <span className="font-medium">{formatPrice(order.shipping_cost)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Totaal:</span>
                <span className="text-lg font-bold" style={{ color: '#a2c614' }}>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verzending & Betaling</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Verzending</h3>
              <p className="text-gray-600">{order.shipping_method}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Betaalmethode</h3>
              <p className="text-gray-600 capitalize">{order.payment_method}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#f0f8e6' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#a2c614' }}>Volgende Stappen</h2>
          
          <div className="space-y-3" style={{ color: '#2d5016' }}>
            {order.payment_method === 'invoice' ? (
              <>
                <p>• Je bestelling is geplaatst en wordt verwerkt</p>
                <p>• Je ontvangt binnenkort een factuur per e-mail</p>
                <p>• De factuur dient binnen 14 dagen voldaan te zijn</p>
              </>
            ) : (
              <>
                <p>• Je bestelling is geplaatst en wordt verwerkt</p>
                <p>• Je ontvangt een bevestiging per e-mail</p>
                <p>• Je bestelling wordt binnen 1-2 werkdagen verzonden</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/winkel" 
            className="inline-block text-white px-8 py-3 rounded-lg transition-colors text-center hover:opacity-90"
            style={{ backgroundColor: '#a2c614' }}
          >
            Verder Winkelen
          </Link>
          
          <Link 
            href="/account" 
            className="inline-block text-white px-8 py-3 rounded-lg transition-colors text-center hover:opacity-90"
            style={{ backgroundColor: '#a2c614' }}
          >
            Mijn Account
          </Link>
        </div>
      </main>
    </div>
  );
}
