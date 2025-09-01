import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'orderId parameter required' }, { status: 400 });
    }

    console.log('🔍 Debug order lookup for ID:', orderId);
    
    // Probeer order op te halen
    const order = await getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found',
        orderId,
        debug: {
          type: typeof orderId,
          length: orderId.length,
          value: orderId
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId,
      order: {
        id: order.id,
        order_number: order.order_number,
        orderNumber: order.orderNumber,
        customer_id: order.customer_id,
        total: order.total,
        status: order.status,
        payment_status: order.payment_status
      }
    });

  } catch (error) {
    console.error('Debug order error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
