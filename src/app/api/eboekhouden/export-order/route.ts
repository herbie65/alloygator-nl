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

    console.log('🔍 E-boekhouden factuur export request for order:', orderId);

    // Controleer of factuur al geëxporteerd is
    const isExported = await OrderToEboekhoudenService.isOrderExported(orderId);
    if (isExported) {
      return NextResponse.json({
        success: false,
        message: 'Factuur is al geëxporteerd naar E-boekhouden'
      }, { status: 400 });
    }

    // Export factuur naar E-boekhouden
    const result = await OrderToEboekhoudenService.exportOrder(orderId);

    console.log('✅ E-boekhouden factuur export result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ E-boekhouden factuur export error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij exporteren factuur naar E-boekhouden'
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

    // Controleer of factuur geëxporteerd is
    const isExported = await OrderToEboekhoudenService.isOrderExported(orderId);

    return NextResponse.json({
      success: true,
      isExported: isExported
    });

  } catch (error) {
    console.error('E-boekhouden check factuur export status error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij controleren factuur export status'
    }, { status: 500 });
  }
}
