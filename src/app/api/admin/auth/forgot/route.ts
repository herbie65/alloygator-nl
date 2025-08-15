import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'E-mail is verplicht' }, { status: 400 })
    }

    // Get admin user from Firebase
    const adminUsers = await FirebaseService.getDocuments('admin_users')
    const user = adminUsers.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
    
    if (!user) {
      return NextResponse.json({ error: 'Admin gebruiker niet gevonden' }, { status: 404 })
    }

    // Generate reset token (simple implementation)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Update user with reset token
    await FirebaseService.updateDocument('admin_users', user.id, {
      reset_token: resetToken,
      reset_expiry: resetExpiry
    })

    // TODO: Send reset email with token
    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Reset instructies verzonden naar je e-mail' 
    })

  } catch (error) {
    console.error('Admin forgot password error:', error)
    return NextResponse.json({ error: 'Fout bij verwerken verzoek' }, { status: 500 })
  }
}


