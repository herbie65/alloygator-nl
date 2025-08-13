import { NextRequest, NextResponse } from 'next/server'
import { ensureInvoice } from '@/lib/invoice'
import { FirebaseService } from '@/lib/firebase'
const MOLLIE_API_URL = 'https://api.mollie.com/v2'

async function getMollieApiKey(): Promise<string> {
  const envKey = process.env.MOLLIE_API_KEY
  if (envKey && envKey.trim().length > 0) return envKey
  try {
    const settingsArray = await FirebaseService.getSettings()
    if (settingsArray && settingsArray.length > 0) {
      const s = settingsArray[0] as any
      return s.mollieApiKey || s.mollie_api_key || 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  } catch {}
  return 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

async function parseBody(request: NextRequest): Promise<{ id?: string }> {
  try {
    // Try JSON
    const json = await request.clone().json().catch(() => null)
    if (json && typeof json === 'object') {
      return json as any
    }
  } catch {}

  // Try form-encoded
  try {
    const text = await request.text()
    const params = new URLSearchParams(text)
    const id = params.get('id') || undefined
    return { id }
  } catch {
    return {}
  }
}

function mapStatuses(mollieStatus: string) {
  // Map Mollie payment status to our order fields
  // Mollie: open, pending, authorized, paid, canceled, failed, expired
  const payment_status = mollieStatus
  let status = 'pending'
  switch (mollieStatus) {
    case 'paid':
      status = 'processing'
      break
    case 'authorized':
      status = 'processing'
      break
    case 'failed':
    case 'expired':
    case 'canceled':
      status = 'cancelled'
      break
    case 'open':
    case 'pending':
    default:
      status = 'pending'
  }
  return { payment_status, status }
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is a localhost test request
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost')
    
    if (isLocal) {
      console.log('🔧 Localhost webhook test: Simulating webhook response')
      // For localhost testing, we'll simulate a successful payment
      const testPaymentId = 'tr_test_simulated'
      const testOrderId = 'test_order_123'
      
      console.log('📊 Simulated webhook data:', {
        paymentId: testPaymentId,
        orderId: testOrderId,
        status: 'paid'
      })
      
      // Return success for localhost testing
      return NextResponse.json({ 
        success: true, 
        simulated: true,
        message: 'Localhost webhook simulation successful'
      })
    }
    
    const body = await parseBody(request)
    const paymentId = body.id

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
    }

    // Fetch payment details from Mollie
    const apiKey = await getMollieApiKey()
    const response = await fetch(`${MOLLIE_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mollie webhook fetch error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 502 })
    }

    const payment: any = await response.json()

    const orderId = payment?.metadata?.orderId
    if (!orderId) {
      console.error('Mollie payment metadata.orderId missing')
      // Acknowledge webhook to avoid retries, but we cannot update any order
      return NextResponse.json({ success: true })
    }

    const { payment_status, status } = mapStatuses(payment.status)

    const update: any = {
      payment_status,
      status,
      mollie_payment_id: payment.id,
      updatedAt: new Date().toISOString(),
    }
    if (payment.paidAt || payment.settlementAmount) {
      update.paidAt = payment.paidAt || new Date().toISOString()
    }

    await FirebaseService.updateDocument('orders', orderId, update)

    // Generate + email invoice only when paid
    try {
      if (update.payment_status === 'paid') {
        await ensureInvoice(orderId)
      }
    } catch (e) {
      console.error('ensureInvoice error', e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mollie webhook error:', error)
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
}


