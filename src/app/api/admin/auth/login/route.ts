import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const key = String(email || '').toLowerCase().trim()
    if (!key || !password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord verplicht' }, { status: 400 })
    }

    // Get admin users from Firebase
    const adminUsers = await FirebaseService.getDocuments('admin_users')
    const user = adminUsers.find((u: any) => u.email?.toLowerCase().trim() === key)
    
    if (!user) {
      return NextResponse.json({ error: 'Geen admin-toegang' }, { status: 403 })
    }

    const storedPassword = String(user.password || '').trim()
    const providedPassword = String(password).trim()

    // Simple password comparison (temporary fix)
    if (providedPassword !== storedPassword) {
      return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 })
    }

    const role: 'admin' | 'staff' = user.role === 'staff' ? 'staff' : 'admin'

    // ✅ zet login-cookie
    const res = NextResponse.json({ success: true, email: key, role })
    const maxAge = 60 * 60 * 24 * 30 // 30 dagen

    // Cookie-naam moet overeenkomen met wat je middleware leest.
    // Pas 'ag_admin' aan als je middleware iets anders verwacht.
    const serverSessionObj = { email: key, role, loginTime: new Date().toISOString() }
    const serverSession = JSON.stringify(serverSessionObj)
    // Gebruik officiële cookies-API voor betere compatibiliteit achter proxies (Firebase)
    res.cookies.set('ag_admin', '1', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge
    })
    res.cookies.set('adminSessionV2', serverSession, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge
    })

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login fout' }, { status: 500 })
  }
}