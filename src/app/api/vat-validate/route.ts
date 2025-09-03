import { NextRequest, NextResponse } from 'next/server'
import soap from 'soap'

const url = "https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl"

async function checkVAT(countryCode: string, vatNumber: string) {
  const client = await soap.createClientAsync(url)
  const [result] = await client.checkVatAsync({ 
    countryCode, 
    vatNumber 
  })
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vatNumber = searchParams.get('vat')

    if (!vatNumber) {
      return NextResponse.json({
        error: 'BTW nummer is verplicht'
      }, { status: 400 })
    }

    // Valideer BTW nummer formaat
    const vatRegex = /^[A-Z]{2}[0-9A-Z]+$/
    if (!vatRegex.test(vatNumber)) {
      return NextResponse.json({
        error: 'Ongeldig BTW nummer formaat'
      }, { status: 400 })
    }

    try {
      const countryCode = vatNumber.substring(0, 2)
      const vatNumberOnly = vatNumber.substring(2)
      
      const result = await checkVAT(countryCode, vatNumberOnly)
      
      if (result.valid) {
        return NextResponse.json({
          valid: true,
          company_name: result.name || '',
          address: result.address || '',
          country: result.countryCode || countryCode,
          request_date: result.requestDate || '',
          message: 'BTW nummer is geldig'
        })
      } else {
        return NextResponse.json({
          valid: false,
          message: 'BTW nummer is niet geldig'
        })
      }

    } catch (apiError) {
      console.error('VIES API error:', apiError)
      return NextResponse.json({
        error: 'Fout bij BTW validatie: ' + (apiError as Error).message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in VAT validation API:', error)
    return NextResponse.json({
      error: 'Interne server fout'
    }, { status: 500 })
  }
}
