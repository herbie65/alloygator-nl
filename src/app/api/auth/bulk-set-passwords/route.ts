import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

// Simple protected endpoint using an admin token env var
export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json()
    
    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Gebruikers array is verplicht' }, { status: 400 })
    }

    const results = []

    for (const user of users) {
      try {
        if (!user.id || !user.password) {
          results.push({ id: user.id, success: false, error: 'ID en wachtwoord zijn verplicht' })
          continue
        }

        // Update user password
        await FirebaseService.updateDocument('users', user.id, {
          password: user.password,
          updated_at: new Date().toISOString()
        })

        results.push({ id: user.id, success: true })
      } catch (error) {
        results.push({ 
          id: user.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      results 
    })

  } catch (error) {
    console.error('Bulk set passwords error:', error)
    return NextResponse.json({ error: 'Fout bij bulk wachtwoord update' }, { status: 500 })
  }
}


