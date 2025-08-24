import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';

export async function GET() {
  try {
    const paymentMethods = await FirebaseService.getPaymentMethods();
    
    if (paymentMethods && Array.isArray(paymentMethods)) {
      return NextResponse.json(paymentMethods);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het ophalen van de betalingsmethoden' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const paymentMethodData = await request.json();
    
    const created = await FirebaseService.createPaymentMethod(paymentMethodData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Betalingsmethode succesvol aangemaakt',
      data: created
    });

  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het aanmaken van de betalingsmethode' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID is verplicht voor het bijwerken van een betalingsmethode' 
      }, { status: 400 });
    }
    
    await FirebaseService.updatePaymentMethod(id, updateData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Betalingsmethode succesvol bijgewerkt' 
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het bijwerken van de betalingsmethode' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID is verplicht voor het verwijderen van een betalingsmethode' 
      }, { status: 400 });
    }
    
    await FirebaseService.deletePaymentMethod(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Betalingsmethode succesvol verwijderd' 
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het verwijderen van de betalingsmethode' 
    }, { status: 500 });
  }
}
