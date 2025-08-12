import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadDir = path.join(process.cwd(), 'public', 'wysiwyg', 'media')
    await fs.mkdir(uploadDir, { recursive: true })
    let safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    // Keep original filename; if it exists, append incremental suffix to avoid overwrite
    const base = safeName.replace(/\.[^.]+$/, '')
    const ext = (safeName.match(/\.[^.]+$/) || [''])[0]
    let candidate = safeName
    let counter = 1
    while (true) {
      try {
        await fs.access(path.join(uploadDir, candidate))
        candidate = `${base}-${counter}${ext}`
        counter += 1
      } catch {
        break
      }
    }
    const target = path.join(uploadDir, candidate)
    await fs.writeFile(target, buffer)
    const url = '/wysiwyg/media/' + path.basename(target)
    return NextResponse.json({ url, name: path.basename(target) })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


