import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'wysiwyg', 'media')
    await fs.mkdir(dir, { recursive: true })
    const names = await fs.readdir(dir)
    const entries = await Promise.all(names.map(async (name) => {
      const full = path.join(dir, name)
      const stat = await fs.stat(full)
      return {
        name,
        url: '/wysiwyg/media/' + name,
        size: stat.size,
        mtime: stat.mtimeMs,
        isFile: stat.isFile(),
      }
    }))
    // Only files
    const files = entries.filter(e => e.isFile)
    // Sort by modified desc
    files.sort((a, b) => b.mtime - a.mtime)
    return NextResponse.json({ files })
  } catch (e) {
    console.error('media/list error:', e)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}




