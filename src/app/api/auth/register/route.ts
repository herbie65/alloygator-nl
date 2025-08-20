import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    
    if (!userData.email || !userData.password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord zijn verplicht' }, { status: 400 })
    }

    // Check if user already exists using Admin SDK
    const usersRef = adminFirestore.collection('users')
    const snapshot = await usersRef.where('email', '==', userData.email.toLowerCase().trim()).get()
    
    if (!snapshot.empty) {
      return NextResponse.json({ error: 'Gebruiker met dit e-mailadres bestaat al' }, { status: 409 })
    }

    // Create new user
    const newUser = {
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      created_at: new Date().toISOString(),
      ...userData
    }

    // Remove password from response
    const { password: _, ...userResponse } = newUser

    const savedUser = await usersRef.add(newUser)

    return NextResponse.json({
      success: true,
      user: { ...userResponse, id: savedUser.id }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Fout bij registreren' }, { status: 500 })
  }
}
