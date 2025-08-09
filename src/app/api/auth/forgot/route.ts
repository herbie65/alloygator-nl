import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { EmailService } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ message: 'E‑mail is verplicht' }, { status: 400 })

    const usersRef = collection(db, 'customers')
    const q = query(usersRef, where('email', '==', email))
    const snap = await getDocs(q)
    if (snap.empty) {
      // Do not leak that the email is unknown
      return NextResponse.json({ message: 'Als het e‑mailadres bekend is, is er een resetlink verzonden.' })
    }

    // Generate a simple one-time token (short for demo)
    const token = Math.random().toString(36).slice(2, 10)
    const userDoc = snap.docs[0]
    await updateDoc(doc(db, 'customers', userDoc.id), {
      password_reset_token: token,
      password_reset_expires: new Date(Date.now() + 1000 * 60 * 30).toISOString() // 30 min
    })

    const base = process.env.NEXT_PUBLIC_BASE_URL || (request.headers.get('origin') || '')
    const resetUrl = `${base}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

    // Try to send email
    try {
      const mailer = new EmailService()
      await mailer['transporter'].sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Wachtwoord resetten',
        html: `<p>We hebben een verzoek ontvangen om je wachtwoord te resetten.</p>
               <p>Klik op de link om een nieuw wachtwoord in te stellen (30 minuten geldig):</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>Heb je dit niet aangevraagd? Negeer deze e-mail.</p>`
      })
    } catch (e) {
      console.warn('Kon reset e-mail niet sturen, geef URL terug voor debug:', e)
      return NextResponse.json({ message: 'Resetlink gegenereerd.', resetUrl })
    }

    return NextResponse.json({ message: 'E‑mail met resetlink verzonden.' })
  } catch (e) {
    console.error('Forgot error:', e)
    return NextResponse.json({ message: 'Er ging iets mis' }, { status: 500 })
  }
}


