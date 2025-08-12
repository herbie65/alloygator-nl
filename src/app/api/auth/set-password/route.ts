import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(()=>({}))
    const { id, email, name, password, token } = body
    const expected = process.env.ADMIN_PASSWORD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_PASSWORD_TOKEN
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    let targetId: string | null = null

    if (id) {
      const snap = await getDoc(doc(db, 'customers', String(id)))
      if (snap.exists()) targetId = snap.id
    }
    if (!targetId && email) {
      const q = query(collection(db, 'customers'), where('email', '==', email))
      const res = await getDocs(q)
      if (!res.empty) targetId = res.docs[0].id
    }
    if (!targetId && name) {
      // Try exact match first
      try {
        const qExact = query(collection(db, 'customers'), where('name', '==', name))
        const resExact = await getDocs(qExact)
        if (!resExact.empty) targetId = resExact.docs[0].id
      } catch {}
      // Fallback: scan all customers and match case-insensitief
      if (!targetId) {
        const all = await getDocs(collection(db, 'customers'))
        const n = String(name).trim().toLowerCase()
        const found = all.docs.find(d => String((d.data() as any).name || '').trim().toLowerCase() === n)
        if (found) targetId = found.id
      }
    }

    if (!targetId) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    await updateDoc(doc(db, 'customers', targetId), { password })
    return NextResponse.json({ success: true, id: targetId })
  } catch (e) {
    console.error('set-password error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


