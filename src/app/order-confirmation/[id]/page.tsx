import { FirebaseService } from '@/lib/firebase'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status?: string
  payment_id?: string
  total: number
  customer: {
    voornaam: string
    achternaam: string
    email: string
  }
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
  }>
  created_at: string
}

// Add generateStaticParams for static export compatibility
export async function generateStaticParams() {
  // Return empty array for now - this will be handled dynamically
  return []
}

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const orderId = params.id
  let order: Order | null = null
  let paymentStatus = 'pending'

  try {
    // Get order from Firebase
    const orderData = await FirebaseService.getOrderById(orderId)
    if (orderData) {
      order = orderData as any
      paymentStatus = order?.payment_status || 'pending'
    }
  } catch (error) {
    console.error('Error loading order:', error)
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bestelling niet gevonden</h2>
          <p className="text-gray-600 mb-6">De bestelling kon niet worden gevonden.</p>
          <a
            href="/"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Terug naar home
          </a>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600'
      case 'failed':
      case 'expired':
      case 'cancelled':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Betaald'
      case 'pending':
        return 'In behandeling'
      case 'failed':
        return 'Mislukt'
      case 'expired':
        return 'Verlopen'
      case 'cancelled':
        return 'Geannuleerd'
      default:
        return 'Onbekend'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center mb-6">
              <div className={`text-6xl mb-4 ${paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {paymentStatus === 'paid' ? '✅' : '⏳'}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {paymentStatus === 'paid' ? 'Bestelling Bevestigd!' : 'Betaling in Behandeling'}
              </h1>
              <p className="text-gray-600">
                {paymentStatus === 'paid' 
                  ? 'Bedankt voor je bestelling. Je ontvangt binnen 24 uur een bevestiging per e-mail.'
                  : 'Je betaling wordt verwerkt. Je ontvangt een bevestiging zodra de betaling is voltooid.'
                }
              </p>
            </div>

            {/* Order Details */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelgegevens</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Bestelnummer:</span>
                  <p className="font-mono">{order.order_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Datum:</span>
                  <p>{new Date(order.created_at).toLocaleDateString('nl-NL')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className={getStatusColor(paymentStatus)}>{getStatusText(paymentStatus)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Totaal:</span>
                  <p className="font-semibold">€{order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Klantgegevens</h2>
              <div className="text-sm">
                <p><span className="font-medium text-gray-600">Naam:</span> {order.customer.voornaam} {order.customer.achternaam}</p>
                <p><span className="font-medium text-gray-600">E-mail:</span> {order.customer.email}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelde Producten</h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">€{(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/winkel"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              Verder Winkelen
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
            >
              Terug naar Home
            </a>
          </div>

          {/* Payment Status Info */}
          {paymentStatus !== 'paid' && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Betaling in behandeling</h3>
              <p className="text-sm text-yellow-700">
                Je betaling wordt momenteel verwerkt. Dit kan enkele minuten duren. 
                Je ontvangt een e-mail zodra de betaling is voltooid.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 