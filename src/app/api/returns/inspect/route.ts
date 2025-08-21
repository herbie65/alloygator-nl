import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, decisions } = body || {}
    // decisions: [{ product_id, qty_credit, qty_restock, condition, reason }]
    if (!id || !Array.isArray(decisions)) return NextResponse.json({ ok: false, error: 'id en decisions zijn verplicht' }, { status: 400 })

    const rma: any = await FirebaseService.getDocument('return_requests', id)
    if (!rma) return NextResponse.json({ ok: false, error: 'RMA niet gevonden' }, { status: 404 })

    const now = new Date().toISOString()
    const items = Array.isArray(rma.items) ? [...rma.items] : []
    for (const d of decisions) {
      const pid = String(d.product_id || d.id || '')
      const ex = items.find((m:any)=> String(m.product_id) === pid)
      if (!ex) continue
      ex.qty_credit = Number(d.qty_credit || 0)
      ex.qty_restock = Number(d.qty_restock || 0)
      ex.condition = d.condition || ex.condition
      ex.reason = d.reason || ex.reason
    }
    const log = Array.isArray(rma.rma_log) ? rma.rma_log : []
    log.push({ ts: now, action: 'inspected', decisions })

    await FirebaseService.updateDocument('return_requests', id, {
      status: 'inspected',
      items,
      inspected_at: now,
      updated_at: now,
      rma_log: log
    })

    return NextResponse.json({ ok: true, id, status: 'inspected' })
  } catch (e) {
    console.error('RMA inspect error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


