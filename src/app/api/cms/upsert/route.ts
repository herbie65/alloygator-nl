import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, slug, meta_description, content, is_published = true } = body || {}
    if (!title || !slug || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing title, slug or content' }, { status: 400 })
    }

    // Find by slug
    const existing = await FirebaseService.getDocuments('cms_pages', [
      { field: 'slug', operator: '==', value: slug }
    ])

    const pageData = {
      title,
      slug,
      content,
      meta_description: meta_description || '',
      is_published: !!is_published,
      updated_at: new Date().toISOString(),
    }

    if (Array.isArray(existing) && existing.length > 0) {
      const page = existing[0] as any
      await FirebaseService.updateCMSPage(String(page.id), pageData)
      return NextResponse.json({ ok: true, id: page.id, updated: true })
    }

    const created = await FirebaseService.createCMSPage({
      ...pageData,
      created_at: new Date().toISOString(),
    } as any)
    return NextResponse.json({ ok: true, id: (created as any)?.id || null, created: true })
  } catch (e) {
    console.error('cms/upsert error:', e)
    return NextResponse.json({ error: 'Failed to upsert page' }, { status: 500 })
  }
}




