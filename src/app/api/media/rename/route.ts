import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { currentName, nextName } = await request.json()
    if (!currentName || !nextName) return NextResponse.json({ error: 'Missing names' }, { status: 400 })
    const dir = path.join(process.cwd(), 'public', 'wysiwyg', 'media')
    const src = path.join(dir, currentName)
    const safe = String(nextName).replace(/[^a-zA-Z0-9._-]/g, '_')
    const dest = path.join(dir, safe)
    await fs.rename(src, dest)
    return NextResponse.json({ url: '/wysiwyg/media/' + safe, name: safe })
  } catch (e) {
    console.error('media/rename error:', e)
    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 })
  }
}




