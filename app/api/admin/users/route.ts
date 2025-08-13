import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService, db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get('adminSessionV2')?.value || ''
  if (!cookie) return false
  try {
    const s = JSON.parse(decodeURIComponent(cookie))
    return s?.role === 'admin'
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const list = await FirebaseService.getDocuments('admin_users')
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const email = String(body.email || '').toLowerCase().trim()
  const role = body.role === 'staff' ? 'staff' : 'admin'
  const name = String(body.name || '').trim()
  const password = String(body.password || '').trim()
  if (!email || !password) return NextResponse.json({ error: 'Email en wachtwoord verplicht' }, { status: 400 })
  const hash = await bcrypt.hash(password, 10)
  const ref = await addDoc(collection(db, 'admin_users'), { email, role, name, password_hash: hash, created_at: new Date().toISOString() })
  return NextResponse.json({ id: ref.id, email, role, name })
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const id = body.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const update: any = {}
  if (body.role) update.role = body.role === 'staff' ? 'staff' : 'admin'
  if (body.name !== undefined) update.name = String(body.name || '')
  if (body.password) update.password_hash = await bcrypt.hash(String(body.password), 10)
  await setDoc(doc(db, 'admin_users', id), { ...update, updated_at: new Date().toISOString() }, { merge: true })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteDoc(doc(db, 'admin_users', id))
  return NextResponse.json({ success: true })
}


