import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { id, token, password } = await req.json()
    if (!id || !token || !password) return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    const resetRef = doc(db, 'admin_password_resets', id)
    const resetSnap = await getDoc(resetRef)
    if (!resetSnap.exists() || resetSnap.data()?.token !== token) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

    const hash = await bcrypt.hash(String(password), 10)
    await setDoc(doc(db, 'admin_users', id), { password_hash: hash, updated_at: new Date().toISOString() }, { merge: true })
    await setDoc(resetRef, { used_at: new Date().toISOString() }, { merge: true })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Fout' }, { status: 500 })
  }
}


