import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { upsertEvent } from '@/lib/google-calendar'

async function getConfigFromSettingsOrEnv() {
  try {
    const snapshot = await adminFirestore.collection('settings').get()
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const s = Array.isArray(docs) && docs.length > 0 ? docs[0] : null
    const emailS = (s as any)?.gcal_service_account_email || (s as any)?.gcalServiceAccountEmail || ''
    const keyS = (s as any)?.gcal_service_account_key || (s as any)?.gcalServiceAccountKey || ''
    const calS = (s as any)?.gcal_calendar_id || (s as any)?.gcalCalendarId || ''
    if (emailS && keyS && calS) {
      const normalizedKey = String(keyS).replace(/\\n/g, '\n').replace(/\r\n/g, '\n')
      return { serviceAccountEmail: String(emailS), serviceAccountKey: normalizedKey, calendarId: String(calS) }
    }
  } catch (_) {}
  const email = process.env.GCAL_SERVICE_ACCOUNT_EMAIL || ''
  const key = (process.env.GCAL_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n')
  const calendarId = process.env.GCAL_CALENDAR_ID || ''
  if (!email || !key || !calendarId) return null
  return { serviceAccountEmail: email, serviceAccountKey: key, calendarId }
}

export async function POST(request: NextRequest) {
  try {
    const config = await getConfigFromSettingsOrEnv()
    if (!config) {
      return NextResponse.json({ ok: false, error: 'Missing Google Calendar env vars (GCAL_SERVICE_ACCOUNT_EMAIL, GCAL_SERVICE_ACCOUNT_KEY, GCAL_CALENDAR_ID)' }, { status: 400 })
    }
    const body = await request.json()
    const { id } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'appointment id required' }, { status: 400 })
    const aSnapshot = await adminFirestore.collection('appointments').doc(String(id)).get()
    const a = aSnapshot.data()
    if (!a) return NextResponse.json({ ok: false, error: 'appointment not found' }, { status: 404 })
    const start_at = (a as any).start_at || (a as any).startAt
    const end_at = (a as any).end_at || (a as any).endAt || new Date(new Date(start_at).getTime() + 30*60000).toISOString()
    const result = await upsertEvent(config, { id: (a as any).id, title: (a as any).title || 'Afspraak', start_at, end_at, location: (a as any).location, notes: (a as any).notes })
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = (e as any)?.message || 'Serverfout'
    console.error('gcal sync error', e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


