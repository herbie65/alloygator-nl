import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    const dir = path.join(process.cwd(), 'public', 'wysiwyg', 'media')
    const target = path.join(dir, name)
    await fs.unlink(target)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('media/delete error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}




