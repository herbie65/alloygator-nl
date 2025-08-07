import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is verplicht' },
        { status: 400 }
      )
    }

    // Get orders for customer
    const orders = await FirebaseService.getDocuments('orders', [
      { field: 'customer_id', operator: '==', value: customerId }
    ])

    // Sort by created_at descending (newest first)
    const sortedOrders = orders.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      success: true,
      orders: sortedOrders
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het ophalen van bestellingen' },
      { status: 500 }
    )
  }
} 