import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

// Simple protected endpoint using an admin token env var
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-admin-token') || (await request.json().catch(()=>({}))).token
    const expected = process.env.ADMIN_PASSWORD_TOKEN || process.env.NEXT_PUBLIC_ADMIN_PASSWORD_TOKEN
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const snap = await getDocs(collection(db, 'customers'))
    let updated = 0
    for (const d of snap.docs) {
      const data = d.data() as any
      if (!data.password) {
        // Set a temporary password (last 4 of timestamp for demo)
        const temp = 'ag-' + (Date.now().toString().slice(-4))
        await updateDoc(doc(db, 'customers', d.id), { password: temp })
        updated++
      }
    }
    return NextResponse.json({ updated })
  } catch (e) {
    console.error('bulk-set-passwords error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


