import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()
    
    if (!userId || !password) {
      return NextResponse.json({ error: 'Gebruiker ID en wachtwoord zijn verplicht' }, { status: 400 })
    }

    // Check if user exists
    const user = await FirebaseService.getDocument('users', userId)
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    // Update user password
    await FirebaseService.updateDocument('users', userId, {
      password: password,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Wachtwoord succesvol bijgewerkt' 
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken wachtwoord' }, { status: 500 })
  }
}


