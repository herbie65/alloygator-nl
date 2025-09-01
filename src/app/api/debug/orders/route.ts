import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Fetching all orders');
    
    // Haal alle orders op
    const orders = await FirebaseService.getOrders();
    
    console.log('📋 Debug: Found orders:', orders.length);
    
    // Toon alleen de IDs en order_numbers
    const orderSummary = orders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      payment_status: order.payment_status
    }));

    return NextResponse.json({
      success: true,
      totalOrders: orders.length,
      orders: orderSummary
    });

  } catch (error) {
    console.error('Debug orders error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
