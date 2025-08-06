'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

function PaymentReturnContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const orderIdParam = searchParams.get('orderId')

    if (!paymentId) {
      setStatus('failed')
      setError('Geen payment ID gevonden')
      return
    }

    setOrderId(orderIdParam)

    // Check if this is a test payment
    if (paymentId.startsWith('tr_test_')) {
      // Simulate successful test payment
      setTimeout(() => {
        setStatus('success')
      }, 1000)
      return
    }

    // Check payment status (simulated for static export)
    const checkPaymentStatus = async () => {
      try {
        // Simulate payment status check for static export
        // In a real implementation, you would use a payment service
        setTimeout(() => {
          setStatus('success')
          setOrderId(orderIdParam)
        }, 1000)
      } catch (error) {
        console.error('Error checking payment status:', error)
        setStatus('failed')
        setError('Fout bij controleren van betalingsstatus')
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Betaling controleren...</h2>
            <p className="text-gray-600">Even geduld, we controleren je betaling.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'success' ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Betaling succesvol!</h2>
              <p className="text-gray-600 mb-6">Je bestelling is succesvol betaald en wordt verwerkt.</p>
              {orderId && (
                <Link 
                  href={`/order-confirmation/${orderId}`}
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Bekijk bestelling
                </Link>
              )}
            </>
          ) : status === 'failed' ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Betaling mislukt</h2>
              <p className="text-gray-600 mb-6">
                {error || 'Er is een fout opgetreden bij de betaling. Probeer het opnieuw.'}
              </p>
              <Link 
                href="/checkout"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Opnieuw proberen
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Betaling geannuleerd</h2>
              <p className="text-gray-600 mb-6">Je hebt de betaling geannuleerd. Je bestelling is niet verwerkt.</p>
              <Link 
                href="/checkout"
                className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Terug naar checkout
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentReturn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Laden...</h2>
            <p className="text-gray-600">Even geduld.</p>
          </div>
        </div>
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  )
} 