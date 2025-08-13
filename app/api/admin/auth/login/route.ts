import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const key = String(email || '').toLowerCase().trim()
    if (!key || !password) {
      return NextResponse.json({ error: 'E-mail en wachtwoord verplicht' }, { status: 400 })
    }

    const usersRef = collection(db, 'admin_users')
    const q = query(usersRef, where('email', '==', key))
    const snap = await getDocs(q)
    if (snap.empty) return NextResponse.json({ error: 'Geen admin-toegang' }, { status: 403 })

    const user = snap.docs[0].data() as any
    const storedPassword = String(user.password || '').trim()

    // Simple password comparison (temporary fix)
    if (password !== storedPassword) {
      return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 })
    }

    const role: 'admin' | 'staff' = user.role === 'staff' ? 'staff' : 'admin'

    // ✅ zet login-cookie
    const res = NextResponse.json({ success: true, email: key, role })
    const maxAge = 60 * 60 * 24 * 30 // 30 dagen

    // Cookie-naam moet overeenkomen met wat je middleware leest.
    // Pas 'ag_admin' aan als je middleware iets anders verwacht.
    res.headers.append(
      'Set-Cookie',
      [
        `ag_admin=1`,
        `Path=/`,
        `Max-Age=${maxAge}`,
        `HttpOnly`,
        `Secure`,
        `SameSite=Lax`
      ].join('; ')
    )

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login fout' }, { status: 500 })
  }
}