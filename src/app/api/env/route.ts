import { NextResponse } from 'next/server'
export const dynamic = "force-static"
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  // Alleen NEXT_PUBLIC_ variabelen zijn veilig om te exposeren
  const envVars = {
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    mollieApiKey: process.env.NEXT_PUBLIC_MOLLIE_API_KEY || '',
    mollieTestApiKey: process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY || '',
    eboekUsername: process.env.NEXT_PUBLIC_EBOEK_USERNAME || '',
    eboekSecurityCode1: process.env.NEXT_PUBLIC_EBOEK_SECURITY_CODE1 || '',
    eboekSecurityCode2: process.env.NEXT_PUBLIC_EBOEK_SECURITY_CODE2 || '',
  }

  return NextResponse.json(envVars)
}

export async function PUT(request: Request) {
  try {
    const { key, value } = await request.json()
    
    // Alleen specifieke keys mogen worden bijgewerkt
    const allowedKeys = ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
    
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: 'Key niet toegestaan' }, { status: 400 })
    }
    
    // Pad naar .env.local bestand
    const envPath = join(process.cwd(), '.env.local')
    
    // Lees bestaande .env.local bestand
    let envContent = ''
    if (existsSync(envPath)) {
      envContent = readFileSync(envPath, 'utf8')
    }
    
    // Update of voeg de key toe
    const lines = envContent.split('\n')
    let keyFound = false
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`
        keyFound = true
        break
      }
    }
    
    if (!keyFound) {
      lines.push(`${key}=${value}`)
    }
    
    // Schrijf terug naar bestand
    writeFileSync(envPath, lines.join('\n'))
    
    return NextResponse.json({ success: true, message: 'API key bijgewerkt' })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: 'Fout bij bijwerken API key' }, { status: 500 })
  }
}
