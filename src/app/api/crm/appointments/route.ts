import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { resolveGCalConfig, upsertEvent } from '@/lib/google-calendar'

// GET /api/crm/appointments?customer_id=&from=&to=&status=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id') || undefined
    const status = searchParams.get('status') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limitStr = searchParams.get('limit')
    const limit = limitStr ? parseInt(limitStr, 10) : undefined

    let conditions: any[] = []
    if (customerId) conditions.push({ field: 'customer_id', operator: '==', value: customerId })
    if (status) conditions.push({ field: 'status', operator: '==', value: status })
    // Tijd filtering doen we client-side als index ontbreekt
    const list = await FirebaseService.getDocuments('appointments', conditions)
    const filtered = list.filter((a:any) => {
      const t = new Date(a.start_at || a.startAt || 0).getTime()
      const fromOk = from ? t >= new Date(from).getTime() : true
      const toOk = to ? t <= new Date(to).getTime() : true
      return fromOk && toOk
    })
    filtered.sort((a:any,b:any)=> new Date(a.start_at||0).getTime() - new Date(b.start_at||0).getTime())
    const trimmed = typeof limit === 'number' ? filtered.slice(0, limit) : filtered
    return NextResponse.json(trimmed)
  } catch (e) {
    console.error('appointments GET error', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

// POST /api/crm/appointments { customer_id, title, type, status, start_at, end_at, location, assigned_to, notes }
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    if (!data.customer_id || !data.title || !data.start_at) {
      return NextResponse.json({ ok: false, error: 'customer_id, title en start_at zijn verplicht' }, { status: 400 })
    }
    const payload = {
      customer_id: String(data.customer_id),
      title: String(data.title),
      type: String(data.type || 'call'),
      status: String(data.status || 'gepland'),
      start_at: String(data.start_at),
      end_at: data.end_at ? String(data.end_at) : null,
      location: String(data.location || ''),
      meeting_url: String(data.meeting_url || ''),
      assigned_to: String(data.assigned_to || ''),
      notes: String(data.notes || ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const rec = await FirebaseService.addDocument('appointments', payload)
    // Trigger Google Calendar sync (best-effort)
    try {
      const cfg = await resolveGCalConfig()
      if (cfg) {
        const start = payload.start_at
        const end = payload.end_at || new Date(new Date(start).getTime() + 30*60000).toISOString()
        await upsertEvent(cfg, { id: rec.id, title: payload.title, start_at: start, end_at: end, location: payload.location, notes: payload.notes })
      }
    } catch (e) { console.log('gcal upsert (POST) best-effort error', (e as any)?.message) }
    return NextResponse.json({ ok: true, id: rec.id })
  } catch (e) {
    console.error('appointments POST error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}

// PUT /api/crm/appointments { id, ...fields }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...update } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'id is verplicht' }, { status: 400 })
    update.updated_at = new Date().toISOString()
    await FirebaseService.updateDocument('appointments', id, update)
    // Trigger Google Calendar sync (best-effort)
    try {
      const cfg = await resolveGCalConfig()
      if (cfg) {
        const doc = await FirebaseService.getDocument('appointments', String(id))
        if (doc && typeof doc === 'object') {
          const start = (doc as any).start_at || (doc as any).startAt
          const end = (doc as any).end_at || new Date(new Date(start).getTime() + 30*60000).toISOString()
          await upsertEvent(cfg, { id: (doc as any).id, title: (doc as any).title || 'Afspraak', start_at: start, end_at: end, location: (doc as any).location, notes: (doc as any).notes })
        }
      }
    } catch (e) { console.log('gcal upsert (PUT) best-effort error', (e as any)?.message) }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('appointments PUT error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


