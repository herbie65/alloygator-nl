import Link from 'next/link'

// Add generateStaticParams for static export
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ]
}

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  vat_rate: number
  vat_amount: number
  total: number
}

interface Order {
  id: string
  order_number: string
  customer_id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  customer_city: string
  customer_postal_code: string
  customer_country: string
  order_date: string
  status: string
  subtotal: number
  vat_total: number
  shipping_cost: number
  total: number
  payment_method: string
  shipping_method: string
  notes: string
  items: OrderItem[]
}

export default function OrderConfirmation({ params }: { params: { id: string } }) {
  // For static export, we'll use mock data
  const order: Order = {
    id: params.id,
    order_number: `ORD-${params.id.padStart(6, '0')}`,
    customer_id: 1,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '+31 6 12345678',
    customer_address: 'Teststraat 123',
    customer_city: 'Amsterdam',
    customer_postal_code: '1234 AB',
    customer_country: 'Nederland',
    order_date: new Date().toISOString(),
    status: 'paid',
    subtotal: 299.99,
    vat_total: 62.99,
    shipping_cost: 5.99,
    total: 368.97,
    payment_method: 'Mollie',
    shipping_method: 'DHL Parcel',
    notes: 'Test order',
    items: [
      {
        id: 1,
        product_id: 1,
        product_name: 'AlloyGator Set',
        quantity: 1,
        price: 299.99,
        vat_rate: 21,
        vat_amount: 62.99,
        total: 362.98
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Bestelling Bevestigd</h1>
                <p className="text-green-100">Bedankt voor je bestelling!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-100">Bestelnummer</p>
                <p className="text-lg font-semibold">{order.order_number}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Klantgegevens</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Naam:</strong> {order.customer_name}</p>
                  <p><strong>Email:</strong> {order.customer_email}</p>
                  <p><strong>Telefoon:</strong> {order.customer_phone}</p>
                  <p><strong>Adres:</strong></p>
                  <p className="ml-4">{order.customer_address}</p>
                  <p className="ml-4">{order.customer_postal_code} {order.customer_city}</p>
                  <p className="ml-4">{order.customer_country}</p>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestelgegevens</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Besteldatum:</strong> {new Date(order.order_date).toLocaleDateString('nl-NL')}</p>
                  <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{order.status}</span></p>
                  <p><strong>Betaalmethode:</strong> {order.payment_method}</p>
                  <p><strong>Verzendmethode:</strong> {order.shipping_method}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestelde Producten</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aantal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BTW</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totaal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          €{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          €{item.vat_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          €{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotaal:</span>
                      <span className="font-medium">€{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">BTW:</span>
                      <span className="font-medium">€{order.vat_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verzendkosten:</span>
                      <span className="font-medium">€{order.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Totaal:</span>
                        <span className="text-lg font-semibold text-green-600">€{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Terug naar home
              </Link>
              <Link 
                href="/winkel"
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors text-center"
              >
                Meer producten bekijken
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 