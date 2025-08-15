import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(_req: NextRequest) {
  try {
    const products: any[] = await FirebaseService.getDocuments('products')
    const taken = new Set<string>()
    for (const p of products) {
      const s = String(p.slug || '').toLowerCase()
      if (s) taken.add(s)
    }

    let updated = 0
    for (const p of products) {
      if (p.slug) continue
      const base = p.name || p.title || p.id
      let s = slugify(base)
      if (!s) continue
      let candidate = s
      let i = 2
      while (taken.has(candidate)) {
        candidate = `${s}-${i++}`
      }
      await FirebaseService.updateDocument('products', p.id, { slug: candidate })
      taken.add(candidate)
      updated++
    }

    return NextResponse.json({ ok: true, updated })
  } catch (e: any) {
    console.error('backfill-slugs error', e)
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to run backfill-slugs' }, { status: 405 })
}


