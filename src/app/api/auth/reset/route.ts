import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json()
    if (!email || !token || !password) return NextResponse.json({ message: 'Ontbrekende velden' }, { status: 400 })

    const usersRef = collection(db, 'customers')
    const q = query(usersRef, where('email', '==', email))
    const snap = await getDocs(q)
    if (snap.empty) return NextResponse.json({ message: 'Ongeldige link' }, { status: 400 })

    const userDoc = snap.docs[0]
    const data: any = userDoc.data()
    const expires = data.password_reset_expires ? new Date(data.password_reset_expires).getTime() : 0
    if (!data.password_reset_token || data.password_reset_token !== token || Date.now() > expires) {
      return NextResponse.json({ message: 'Token ongeldig of verlopen' }, { status: 400 })
    }

    await updateDoc(doc(db, 'customers', userDoc.id), {
      password,
      password_reset_token: null,
      password_reset_expires: null
    })

    return NextResponse.json({ message: 'Wachtwoord bijgewerkt' })
  } catch (e) {
    console.error('Reset error:', e)
    return NextResponse.json({ message: 'Er ging iets mis' }, { status: 500 })
  }
}


