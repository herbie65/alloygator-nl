import { NextRequest, NextResponse } from 'next/server';
import { OrderToEboekhoudenService } from '@/services/accounting/orderToEboekhouden';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is verplicht'
      }, { status: 400 });
    }

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

    return NextResponse.json(result);

  } catch (error) {
    console.error('E-boekhouden export order error:', error);
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
