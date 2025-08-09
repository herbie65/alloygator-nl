import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

// Fallback lijst wanneer er geen admin_users zijn aangemaakt
const FALLBACK: Record<string, { role: 'admin' | 'staff' }> = {
  'herbert@alloygator.nl': { role: 'admin' },
  'marcel@alloyagtor.nl': { role: 'staff' },
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email verplicht' }, { status: 400 })
    const key = String(email).toLowerCase().trim()
    // Zoek in Firestore admin_users; zo niet, gebruik fallback
    const usersRef = collection(db, 'admin_users')
    const q = query(usersRef, where('email', '==', key))
    const snap = await getDocs(q)
    let role: 'admin' | 'staff' | null = null
    if (!snap.empty) {
      const data = snap.docs[0].data() as any
      role = data.role === 'staff' ? 'staff' : 'admin'
    } else {
      role = FALLBACK[key]?.role || null
    }
    if (!role) return NextResponse.json({ error: 'Geen admin-toegang' }, { status: 403 })

    return NextResponse.json({ success: true, email: key, role })
  } catch (e) {
    return NextResponse.json({ error: 'Login fout' }, { status: 500 })
  }
}


