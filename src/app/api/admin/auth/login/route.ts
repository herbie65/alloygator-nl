import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const key = String(email || '').toLowerCase().trim()
    if (!key || !password) return NextResponse.json({ error: 'E-mail en wachtwoord verplicht' }, { status: 400 })

    const usersRef = collection(db, 'admin_users')
    const q = query(usersRef, where('email', '==', key))
    const snap = await getDocs(q)
    if (snap.empty) return NextResponse.json({ error: 'Geen admin-toegang' }, { status: 403 })
    const user = snap.docs[0].data() as any

    const ok = await bcrypt.compare(String(password), String(user.password_hash || ''))
    if (!ok) return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 })

    const role: 'admin' | 'staff' = user.role === 'staff' ? 'staff' : 'admin'
    return NextResponse.json({ success: true, email: key, role })
  } catch (e) {
    return NextResponse.json({ error: 'Login fout' }, { status: 500 })
  }
}


