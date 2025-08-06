import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '../../../../../lib/firebase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 }
      )
    }

    // Find customer by email
    const customers = await FirebaseService.getDocuments('customers', [
      { field: 'email', operator: '==', value: email }
    ])

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email of wachtwoord is onjuist' },
        { status: 401 }
      )
    }

    const customer = customers[0]

    // Check if customer has password (for existing customers without password)
    if (!customer.password) {
      return NextResponse.json(
        { success: false, error: 'Account heeft geen wachtwoord ingesteld. Gebruik wachtwoord vergeten.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email of wachtwoord is onjuist' },
        { status: 401 }
      )
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${customer.id}:${Date.now()}`).toString('base64')

    // Return user data (without password)
    const { password: _, ...userData } = customer

    return NextResponse.json({
      success: true,
      user: userData,
      token: token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
} 