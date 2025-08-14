import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord verplicht' }, { status: 400 })
    }

    // Get user from Firebase
    const users = await FirebaseService.getDocuments('users')
    const user = users.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
    
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
