import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      )
    }

    // Get orders for this customer
    const orders = await FirebaseService.getDocuments('orders', [
      { field: 'customer.email', operator: '==', value: customerId }
    ])

    // Sort orders by creation date (newest first)
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
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
} 