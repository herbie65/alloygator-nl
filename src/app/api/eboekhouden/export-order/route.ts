import { NextRequest, NextResponse } from 'next/server';
import { OrderToEboekhoudenService } from '@/services/accounting/orderToEboekhouden';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json({
        success: false,
        message: 'Ongeldige JSON in request body'
      }, { status: 400 });
    }

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is verplicht'
      }, { status: 400 });
    }

    console.log('🔍 E-boekhouden export request for order:', orderId);

    // Controleer of order al geëxporteerd is
    const isExported = await OrderToEboekhoudenService.isOrderExported(orderId);
    if (isExported) {
      return NextResponse.json({
        success: false,
        message: 'Order is al geëxporteerd naar E-boekhouden'
      }, { status: 400 });
    }

    // Export order naar E-boekhouden
    const result = await OrderToEboekhoudenService.exportOrder(orderId);

    console.log('✅ E-boekhouden export result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ E-boekhouden export order error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij exporteren order'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is verplicht'
      }, { status: 400 });
    }

    // Controleer of order geëxporteerd is
    const isExported = await OrderToEboekhoudenService.isOrderExported(orderId);

    return NextResponse.json({
      success: true,
      isExported: isExported
    });

  } catch (error) {
    console.error('E-boekhouden check export status error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij controleren export status'
    }, { status: 500 });
  }
}
