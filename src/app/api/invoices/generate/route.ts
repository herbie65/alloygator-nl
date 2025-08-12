import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { ensureInvoice } from '@/lib/invoice'
import path from 'path'
import { promises as fs } from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fetchOrder(orderId: string): Promise<any> {
  const ref = doc(db as any, 'orders', orderId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as any) }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

    const order = await fetchOrder(id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Generate & save (also updates order with invoice_number + invoice_url)
    const { url, number } = await ensureInvoice(id)

    // Read saved file and return it
    const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
    const pdf = await fs.readFile(filePath)

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factuur-${number}.pdf"`
      }
    })
  } catch (e:any) {
    console.error('invoice generate error', e)
    return NextResponse.json({ error: 'Failed to generate invoice', details: e?.message || String(e) }, { status: 500 })
  }
}


