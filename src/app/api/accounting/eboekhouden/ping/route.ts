import { NextRequest, NextResponse } from 'next/server'
import { eBoekhoudenClientInstance } from '@/services/eBoekhouden/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, securityCode1, securityCode2, testMode } = body

    // Validate required fields
    if (!username || !securityCode1 || !securityCode2) {
      return NextResponse.json(
        { ok: false, message: 'Alle velden zijn verplicht' },
        { status: 400 }
      )
    }

    // Test the connection using the e-boekhouden client
    try {
      // Update the client instance with the provided credentials
      eBoekhoudenClientInstance.updateCredentials({
        username,
        securityCode1,
        securityCode2,
        testMode: testMode || false
      })

      // Test the connection by making a simple API call
      const result = await eBoekhoudenClientInstance.testConnection()
      
      if (result.success) {
        return NextResponse.json({
          ok: true,
          message: 'Verbinding succesvol!',
          data: result.data
        })
      } else {
        return NextResponse.json({
          ok: false,
          message: result.message || 'Verbinding mislukt'
        }, { status: 400 })
      }
    } catch (error: any) {
      console.error('e-Boekhouden connection test error:', error)
      return NextResponse.json({
        ok: false,
        message: `Verbinding mislukt: ${error.message || 'Onbekende fout'}`
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('e-Boekhouden ping endpoint error:', error)
    return NextResponse.json({
      ok: false,
      message: 'Server fout bij verwerken van verzoek'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    message: 'Alleen POST requests worden ondersteund'
  }, { status: 405 })
}
