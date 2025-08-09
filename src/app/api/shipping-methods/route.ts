import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET() {
  try {
    const shippingMethods = await FirebaseService.getShippingMethods()
    return NextResponse.json(shippingMethods || [])
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping methods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const shippingMethod = await request.json()
    
    const result = await FirebaseService.createShippingMethod(shippingMethod)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating shipping method:', error)
    return NextResponse.json({ error: 'Failed to create shipping method' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, price, delivery_time, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing shipping method ID' },
        { status: 400 }
      )
    }

    const updatedShippingMethod = {
      id,
      name,
      description,
      price: Number(price),
      delivery_time,
      is_active,
      updated_at: new Date().toISOString()
    }

    await FirebaseService.updateShippingMethod(id, updatedShippingMethod)
    
    return NextResponse.json(updatedShippingMethod)
  } catch (error) {
    console.error('Error updating shipping method:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping method' },
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
        { error: 'Missing shipping method ID' },
        { status: 400 }
      )
    }

    await FirebaseService.deleteShippingMethod(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping method:', error)
    return NextResponse.json(
      { error: 'Failed to delete shipping method' },
      { status: 500 }
    )
  }
}
