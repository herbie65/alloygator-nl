import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting customer migration to numeric IDs...');
    
    const migratedCustomers = await FirebaseService.migrateCustomersToNumericIds();
    
    if (migratedCustomers && migratedCustomers.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully migrated ${migratedCustomers.length} customers to numeric IDs`,
        migratedCustomers 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'No customers needed migration - all already have numeric IDs' 
      });
    }
  } catch (error) {
    console.error('❌ Customer migration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
