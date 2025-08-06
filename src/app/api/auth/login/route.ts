import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'E-mail en wachtwoord zijn verplicht' },
        { status: 400 }
      )
    }

    // Get user from Firebase
    const users = await FirebaseService.getDocuments('customers', [
      { field: 'email', operator: '==', value: email }
    ])

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ongeldige e-mail of wachtwoord' },
        { status: 401 }
      )
    }

    const user = users[0] as any

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Ongeldige e-mail of wachtwoord' },
        { status: 401 }
      )
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Login succesvol',
      user: {
        id: user.id,
        email: user.email,
        voornaam: user.voornaam,
        achternaam: user.achternaam
      },
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Er is een fout opgetreden bij het inloggen' },
      { status: 500 }
    )
  }
} 