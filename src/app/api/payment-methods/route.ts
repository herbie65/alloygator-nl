import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET() {
  try {
    const paymentMethods = await FirebaseService.getPaymentMethods()
    // Ensure 'Op rekening' exists
    const hasInvoice = (paymentMethods || []).some((pm: any) => pm.mollie_id === 'invoice')
    if (!hasInvoice) {
      const fallback = {
        id: Date.now().toString(),
        name: 'Op rekening',
        description: 'Betalen op rekening (na goedkeuring)',
        mollie_id: 'invoice',
        is_active: false,
        fee_percent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      await FirebaseService.createPaymentMethod(fallback as any)
      paymentMethods.push(fallback)
    }
    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, mollie_id, is_active, fees, fee_percent } = body

    // Validate required fields
    if (!name || !description || !mollie_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const paymentMethod = {
      id: Date.now().toString(),
      name,
      description,
      mollie_id,
      is_active: is_active !== undefined ? is_active : true,
      fee_percent: typeof fee_percent === 'number' ? fee_percent : (typeof fees === 'number' ? fees : 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await FirebaseService.createPaymentMethod(paymentMethod)
    
    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, mollie_id, is_active, fees, fee_percent } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing payment method ID' },
        { status: 400 }
      )
    }

    const updatedPaymentMethod = {
      id,
      name,
      description,
      mollie_id,
      is_active,
      fee_percent: typeof fee_percent === 'number' ? fee_percent : Number(fees),
      updated_at: new Date().toISOString()
    }

    await FirebaseService.updatePaymentMethod(id, updatedPaymentMethod)
    
    return NextResponse.json(updatedPaymentMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing payment method ID' },
        { status: 400 }
      )
    }

    await FirebaseService.deletePaymentMethod(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
