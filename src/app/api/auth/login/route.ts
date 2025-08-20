import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord verplicht' }, { status: 400 })
    }

    // Get user from Firebase using Admin SDK
    const usersRef = adminFirestore.collection('users')
    const snapshot = await usersRef.where('email', '==', email.toLowerCase().trim()).get()
    const user = snapshot.docs[0]?.data()
    
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 401 })
    }

    // Simple password comparison (temporary fix)
    if (password !== user.password) {
      return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 })
    }

    // Return user data (without password)
    const { password: _, ...userData } = user
    return NextResponse.json({ 
      success: true, 
      user: userData 
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login fout' }, { status: 500 })
  }
}
