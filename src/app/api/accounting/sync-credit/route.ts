import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { openSession, closeSession, addMemoriaal, addRelatie } from '@/services/accounting/eboekhouden'

// Grootboekrekeningen (configureerbaar via env, met veilige defaults)
const COA = {
  omzetHoog: process.env.EB_OMZET_HOOG || '8000',
  omzetLaag: process.env.EB_OMZET_LAAG || '8010',
  btwHoog: process.env.EB_BTW_HOOG || '1520',
  btwLaag: process.env.EB_BTW_LAAG || '1525',
  debiteuren: process.env.EB_DEBITEUREN || '1300',
  cogs: process.env.EB_COGS || '4000',
  voorraad: process.env.EB_VOORRAAD || '3000',
  retourverlies: process.env.EB_RETOURVERLIES || '4960', // Retourverlies/Schade
}

function to2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100 }

export async function POST(request: NextRequest) {
  let sessionId = ''
  try {
    const body = await request.json()
    const { creditId } = body || {}
    if (!creditId) return NextResponse.json({ ok: false, error: 'creditId verplicht' }, { status: 400 })

    const credit: any = await FirebaseService.getDocument('credit_notes', creditId)
    if (!credit) return NextResponse.json({ ok: false, error: 'Creditnota niet gevonden' }, { status: 404 })
    if (credit.eboekhouden_sync?.status === 'success') return NextResponse.json({ ok: true, already: true })

    const order: any = await FirebaseService.getDocument('orders', credit.order_id)
    if (!order) return NextResponse.json({ ok: false, error: 'Order niet gevonden' }, { status: 404 })

    const orderItems: any[] = Array.isArray(order.items) ? order.items : []
    const creditItems: any[] = Array.isArray(credit.items) ? credit.items : []
    const rma: any = credit.rma_id ? await FirebaseService.getDocument('return_requests', credit.rma_id) : null
    const rmaItems: any[] = Array.isArray(rma?.items) ? rma.items : []

    // Totals per VAT-category based on credit items (net amounts)
    const netHigh = creditItems.filter(i => Number(i.vat_rate || order.vatHighRate || 21) >= 20)
      .reduce((s, i) => s + Number(i.unit_price || 0) * Number(i.quantity || 0), 0)
    const netLow = creditItems.filter(i => {
      const r = Number(i.vat_rate || order.vatLowRate || 9)
      return r > 0 && r < 20
    }).reduce((s, i) => s + Number(i.unit_price || 0) * Number(i.quantity || 0), 0)

    const vatHigh = to2(netHigh * 0.21)
    const vatLow = to2(netLow * 0.09)
    const totalIncl = to2(netHigh + netLow + vatHigh + vatLow)

    // Memoriaalregels voor credit (verkoop + btw terugdraaien; debiteuren crediteren)
    const regels: { Rekening: string; Omschrijving: string; Bedrag: string; DebetCredit: 'D'|'C'; BTWCode?: string }[] = []
    if (netHigh) regels.push({ Rekening: COA.omzetHoog, Omschrijving: `Credit omzet 21% ${credit.credit_number}` , Bedrag: to2(Math.abs(netHigh)).toFixed(2), DebetCredit: 'D' })
    if (netLow)  regels.push({ Rekening: COA.omzetLaag, Omschrijving: `Credit omzet 9% ${credit.credit_number}`  , Bedrag: to2(Math.abs(netLow)).toFixed(2),  DebetCredit: 'D' })
    if (vatHigh) regels.push({ Rekening: COA.btwHoog,  Omschrijving: `Credit BTW 21% ${credit.credit_number}`   , Bedrag: to2(Math.abs(vatHigh)).toFixed(2), DebetCredit: 'D' })
    if (vatLow)  regels.push({ Rekening: COA.btwLaag,  Omschrijving: `Credit BTW 9% ${credit.credit_number}`    , Bedrag: to2(Math.abs(vatLow)).toFixed(2),  DebetCredit: 'D' })
    regels.push({ Rekening: COA.debiteuren, Omschrijving: `Debiteuren credit ${credit.credit_number}`, Bedrag: to2(Math.abs(totalIncl)).toFixed(2), DebetCredit: 'C' })

    // Perpetual: COGS/Voorraad terugdraaien voor het gerestockte deel, en verlies boeken voor niet‑restock
    for (const r of rmaItems) {
      const pid = String(r.product_id || '')
      const qtyCredit = Number(r.qty_credit || 0)
      const qtyRestock = Number(r.qty_restock || 0)
      if (!pid || (qtyCredit <= 0 && qtyRestock <= 0)) continue
      const match = orderItems.find((oi:any)=> String(oi.id || oi.productId) === pid) || {}
      const cost = Number(match.cost_price || match.unit_cost || 0)

      if (qtyRestock > 0 && cost > 0) {
        const amount = to2(cost * qtyRestock)
        regels.push({ Rekening: COA.voorraad, Omschrijving: `Voorraad retour ${pid}`, Bedrag: amount.toFixed(2), DebetCredit: 'D' })
        regels.push({ Rekening: COA.cogs,     Omschrijving: `COGS correctie retour ${pid}`, Bedrag: amount.toFixed(2), DebetCredit: 'C' })
      }

      const lossQty = Math.max(0, qtyCredit - qtyRestock)
      if (lossQty > 0 && cost > 0) {
        const amount = to2(cost * lossQty)
        regels.push({ Rekening: COA.retourverlies, Omschrijving: `Retourverlies ${pid}`, Bedrag: amount.toFixed(2), DebetCredit: 'D' })
        regels.push({ Rekening: COA.cogs,          Omschrijving: `COGS correctie verlies ${pid}`, Bedrag: amount.toFixed(2), DebetCredit: 'C' })
      }
    }

    // Boek naar e‑Boekhouden
    sessionId = await openSession()
    // Relatie zekerstellen (best‑effort)
    try {
      const c = order.customer || {}
      await addRelatie(sessionId, {
        Code: String(order.customer_id || c.email || credit.order_id),
        Bedrijf: c.bedrijfsnaam,
        Email: c.email,
        BP: c.bedrijfsnaam ? 'B' : 'P',
        Adres: c.adres,
        Postcode: c.postcode,
        Plaats: c.plaats,
      })
    } catch {}

    const res = await addMemoriaal(sessionId, {
      omschrijving: `Creditnota ${credit.credit_number}`,
      datum: new Date().toISOString().slice(0, 10),
      regels,
    })

    await FirebaseService.updateDocument('credit_notes', creditId, {
      eboekhouden_sync: { status: 'success', credit_mutatie_id: res.mutatienummer, sync_timestamp: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })

    try { if (sessionId) await closeSession(sessionId) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('sync-credit error', e)
    try { if (sessionId) await closeSession(sessionId) } catch {}
    return NextResponse.json({ ok: false, error: e?.message || 'Serverfout' }, { status: 500 })
  }
}


