import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Validate auth if needed (optionally check admin session here)
    const formData = await request.formData()
    const file = formData.get('file') as unknown as File
    const category = (formData.get('category') as string) || 'algemeen'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Prepare local destination
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const safeBase = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeCategory = (category || 'algemeen').toString().replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileName = `${Date.now()}_${randomUUID()}_${safeBase}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'documents', safeCategory)
    await fs.mkdir(uploadDir, { recursive: true })
    const targetPath = path.join(uploadDir, fileName)
    await fs.writeFile(targetPath, buffer)

    const publicUrl = `/documents/${safeCategory}/${fileName}`

    return NextResponse.json({
      url: publicUrl,
      storage_path: `documents/${safeCategory}/${fileName}`,
      name: `${safeBase}.${ext}`,
      contentType: file.type,
      size: buffer.length,
    })
  } catch (e: any) {
    console.error('Server upload error:', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}


