import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

// Backfill: vul short_description en long_description als ze ontbreken.
// Non-destructive: bestaande velden worden NIET overschreven.
export async function POST(_req: NextRequest) {
  try {
    const products: any[] = await FirebaseService.getDocuments('products')
    let updated = 0

    for (const p of products) {
      const hasShort = typeof p.short_description === 'string' && p.short_description.trim().length > 0
      const hasLong = typeof p.long_description === 'string' && p.long_description.trim().length > 0
      const hasDesc = typeof p.description === 'string' && p.description.trim().length > 0

      if (!hasShort || !hasLong) {
        const update: any = {}
        if (!hasShort && hasDesc) update.short_description = p.description
        if (!hasLong && hasDesc) update.long_description = p.description

        if (Object.keys(update).length > 0) {
          await FirebaseService.updateDocument('products', p.id, update)
          updated++
        }
      }
    }

    return NextResponse.json({ ok: true, updated })
  } catch (e: any) {
    console.error('backfill-descriptions error', e)
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to run backfill' }, { status: 405 })
}


