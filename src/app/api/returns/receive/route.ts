import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, items } = body || {}
    if (!id || !Array.isArray(items)) return NextResponse.json({ ok: false, error: 'id en items zijn verplicht' }, { status: 400 })

    const rma: any = await FirebaseService.getDocument('return_requests', id)
    if (!rma) return NextResponse.json({ ok: false, error: 'RMA niet gevonden' }, { status: 404 })

    const now = new Date().toISOString()
    const merged: any[] = Array.isArray(rma.items) ? [...rma.items] : []
    for (const it of items) {
      const pid = String(it.product_id || it.id || '')
      const qty = Number(it.qty || it.quantity || 0)
      if (!pid || qty <= 0) continue
      const ex = merged.find((m:any)=> String(m.product_id) === pid)
      if (ex) ex.qty_received = Number(ex.qty_received || 0) + qty
      else merged.push({ product_id: pid, name: it.name || '', qty_requested: 0, qty_received: qty })
    }
    const log = Array.isArray(rma.rma_log) ? rma.rma_log : []
    log.push({ ts: now, action: 'received', items })

    await FirebaseService.updateDocument('return_requests', id, {
      status: 'received',
      items: merged,
      received_at: rma.received_at || now,
      updated_at: now,
      rma_log: log
    })

    return NextResponse.json({ ok: true, id, status: 'received' })
  } catch (e) {
    console.error('RMA receive error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


