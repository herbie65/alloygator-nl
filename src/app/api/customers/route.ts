import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    try {
      // Haal klantgegevens op uit Firestore
      const customers = await FirebaseService.getCustomersByEmail(email)
      
      if (!customers || customers.length === 0) {
        return NextResponse.json(null, { status: 404 })
      }

      // Retourneer de eerste (en meest recente) klant
      const customer = customers[0]
      
      return NextResponse.json(customer)
    } catch (firebaseError) {
      console.error('Firebase error, fallback naar dummy data:', firebaseError)
      
      // Fallback naar dummy klantgegevens om redirect loop te voorkomen
      return NextResponse.json({
        email: email,
        contact_first_name: '',
        contact_last_name: '',
        phone: '',
        address: '',
        postal_code: '',
        city: '',
        country: 'NL',
        company_name: '',
        isDealer: false
      })
    }
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const customerData = await request.json()
    
    if (!customerData || !customerData.email) {
      return NextResponse.json({ error: 'Customer data and email are required' }, { status: 400 })
    }

    // Zoek eerst de klant op basis van email om de document ID te krijgen
    const customers = await FirebaseService.getCustomersByEmail(customerData.email)
    
    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    const customerDoc = customers[0]
    
    // Update klantgegevens in Firestore
    const success = await FirebaseService.updateDocument('customers', customerDoc.id, customerData)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
