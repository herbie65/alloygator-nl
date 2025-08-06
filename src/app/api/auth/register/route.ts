import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '../../../../../lib/firebase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      voornaam, 
      achternaam, 
      email, 
      telefoon, 
      password, 
      adres, 
      postcode, 
      plaats, 
      land, 
      bedrijfsnaam, 
      btwNummer 
    } = body

    // Validate required fields
    if (!voornaam || !achternaam || !email || !telefoon || !password || !adres || !postcode || !plaats || !land) {
      return NextResponse.json(
        { success: false, error: 'Alle verplichte velden moeten worden ingevuld' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingCustomers = await FirebaseService.getDocuments('customers', [
      { field: 'email', operator: '==', value: email }
    ])

    if (existingCustomers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Dit e-mailadres is al in gebruik' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create customer data
    const customerData = {
      voornaam,
      achternaam,
      email,
      telefoon,
      password: hashedPassword,
      adres,
      postcode,
      plaats,
      land,
      bedrijfsnaam: bedrijfsnaam || '',
      btwNummer: btwNummer || '',
      customer_type: 'particulier',
      group: 'particulier',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add customer to database
    const result = await FirebaseService.addDocument('customers', customerData)

    // Generate token
    const token = Buffer.from(`${result.id}:${Date.now()}`).toString('base64')

    // Return user data (without password)
    const { password: _, ...userData } = result

    return NextResponse.json({
      success: true,
      user: userData,
      token: token
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Er is een fout opgetreden bij het aanmaken van je account' },
      { status: 500 }
    )
  }
} 