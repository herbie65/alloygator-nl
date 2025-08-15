import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()
    
    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'E-mail, token en nieuw wachtwoord zijn verplicht' }, { status: 400 })
    }

    // Get admin user from Firebase
    const adminUsers = await FirebaseService.getDocuments('admin_users')
    const user = adminUsers.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
    
    if (!user) {
      return NextResponse.json({ error: 'Admin gebruiker niet gevonden' }, { status: 404 })
    }

    // Check if reset token is valid and not expired
    if (user.reset_token !== token) {
      return NextResponse.json({ error: 'Ongeldige reset token' }, { status: 400 })
    }

    if (user.reset_expiry && new Date(user.reset_expiry) < new Date()) {
      return NextResponse.json({ error: 'Reset token is verlopen' }, { status: 400 })
    }

    // Update password and clear reset token
    await FirebaseService.updateDocument('admin_users', user.id, {
      password: newPassword,
      reset_token: null,
      reset_expiry: null,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Wachtwoord succesvol bijgewerkt' 
    })

  } catch (error) {
    console.error('Admin reset password error:', error)
    return NextResponse.json({ error: 'Fout bij resetten wachtwoord' }, { status: 500 })
  }
}


