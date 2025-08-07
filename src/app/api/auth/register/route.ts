import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      voornaam,
      achternaam,
      email,
      telefoon,
      bedrijfsnaam,
      btw_nummer,
      adres,
      postcode,
      plaats,
      land,
      password,
      password_confirm
    } = await request.json()

    // Validation
    if (!voornaam || !achternaam || !email || !telefoon || !adres || !postcode || !plaats || !land || !password) {
      return NextResponse.json(
        { success: false, message: 'Alle verplichte velden moeten worden ingevuld' },
        { status: 400 }
      )
    }

    if (password !== password_confirm) {
      return NextResponse.json(
        { success: false, message: 'Wachtwoorden komen niet overeen' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Wachtwoord moet minimaal 6 karakters bevatten' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUsers = await FirebaseService.getDocuments('customers', [
      { field: 'email', operator: '==', value: email }
    ])

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'E-mailadres is al in gebruik' },
        { status: 400 }
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
      bedrijfsnaam: bedrijfsnaam || '',
      btw_nummer: btw_nummer || '',
      adres,
      postcode,
      plaats,
      land,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to Firebase
    const customerId = await FirebaseService.addDocument('customers', customerData)

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Er is een fout opgetreden bij het aanmaken van het account' },
        { status: 500 }
      )
    }

    // Generate token
    const token = Buffer.from(`${customerId}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Account succesvol aangemaakt',
      user: {
        id: customerId,
        email,
        voornaam,
        achternaam
      },
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het registreren' },
      { status: 500 }
    )
  }
} 