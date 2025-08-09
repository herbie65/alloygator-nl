import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore'
import { EmailService } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const key = String(email || '').toLowerCase().trim()
    if (!key) return NextResponse.json({ error: 'Email verplicht' }, { status: 400 })

    const usersRef = collection(db, 'admin_users')
    const q = query(usersRef, where('email', '==', key))
    const snap = await getDocs(q)
    if (snap.empty) return NextResponse.json({ success: true }) // niet lekken
    const userId = snap.docs[0].id

    // eenvoudige token
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    await setDoc(doc(db, 'admin_password_resets', userId), { token, created_at: new Date().toISOString() }, { merge: true })

    // Mail
    const settingsArr = await (await import('@/lib/firebase')).FirebaseService.getSettings()
    const settings = settingsArr && settingsArr.length > 0 ? settingsArr[0] : undefined
    const emailService = new EmailService(settings as any)
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/reset?token=${encodeURIComponent(token)}&id=${encodeURIComponent(userId)}`
    await emailService.sendPasswordResetEmail(key, resetUrl)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Fout' }, { status: 500 })
  }
}


