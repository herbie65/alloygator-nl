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
      const hasMetaTitle = typeof p.meta_title === 'string' && p.meta_title.trim().length > 0
      const hasMetaDesc = typeof p.meta_description === 'string' && p.meta_description.trim().length > 0

      if (!hasShort || !hasLong || !hasMetaTitle || !hasMetaDesc) {
        const update: any = {}
        if (!hasShort && hasDesc) update.short_description = p.description
        if (!hasLong && hasDesc) update.long_description = p.description
        if (!hasMetaTitle) update.meta_title = p.name || p.title || 'Product'
        if (!hasMetaDesc && (p.short_description || p.description)) {
          const raw = String(p.short_description || p.description || '')
          update.meta_description = raw.replace(/<[^>]*>/g, '').slice(0, 160)
        }

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


