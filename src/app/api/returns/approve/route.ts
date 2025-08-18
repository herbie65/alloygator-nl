import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, note } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: 'id is verplicht' }, { status: 400 })

    const rma: any = await FirebaseService.getDocument('return_requests', id)
    if (!rma) return NextResponse.json({ ok: false, error: 'RMA niet gevonden' }, { status: 404 })

    const now = new Date().toISOString()
    const status = 'approved'
    const log = Array.isArray(rma.rma_log) ? rma.rma_log : []
    log.push({ ts: now, action: 'approved', note: note || null })

    await FirebaseService.updateDocument('return_requests', id, {
      status,
      approved_at: rma.approved_at || now,
      updated_at: now,
      rma_log: log
    })

    return NextResponse.json({ ok: true, id, status })
  } catch (e) {
    console.error('RMA approve error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


