import { NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

// Admin-only one-off endpoint to migrate product IDs to sequential numeric IDs starting at 1
// Safety: Do NOT expose publicly in production. Use only when explicitly requested.

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Optional: simple guard via env flag
    if (process.env.ALLOW_PRODUCT_ID_MIGRATION !== 'true') {
      return NextResponse.json({ error: 'Migration disabled. Set ALLOW_PRODUCT_ID_MIGRATION=true' }, { status: 403 })
    }

    const products: any[] = await FirebaseService.getDocuments('products')
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ migrated: 0, message: 'No products found' })
    }

    // Sorteer stabiel op created_at (fallback: name, id)
    const sorted = [...products].sort((a, b) => {
      const ta = new Date(String(a.created_at || '1970-01-01')).getTime()
      const tb = new Date(String(b.created_at || '1970-01-01')).getTime()
      if (ta !== tb) return ta - tb
      const na = String(a.name || a.title || '')
      const nb = String(b.name || b.title || '')
      if (na !== nb) return na.localeCompare(nb)
      return String(a.id || '').localeCompare(String(b.id || ''))
    })

    // Bepaal reeds gebruikte numerieke IDs zodat we aansluitend kunnen nummeren
    const numericIds = products
      .map((p) => {
        const m = String(p.id || '').match(/^\d+$/)
        return m ? parseInt(m[0], 10) : NaN
      })
      .filter((n) => Number.isFinite(n)) as number[]
    let nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1

    const migrations: Array<{ oldId: string; newId: string }> = []

    for (const p of sorted) {
      const oldId = String(p.id)
      // Skip als al numeriek
      if (/^\d+$/.test(oldId)) continue

      const newId = String(nextId++)
      // Schrijf nieuw doc met nieuwe ID, behoud velden en timestamps
      await FirebaseService.updateDocument('products', newId, {
        ...p,
        id: newId,
        updated_at: new Date().toISOString(),
      })

      // Verwijder oude
      await FirebaseService.deleteDocument('products', oldId)

      migrations.push({ oldId, newId })
    }

    return NextResponse.json({ migrated: migrations.length, migrations })
  } catch (error: any) {
    console.error('Product ID migration error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


