import { NextRequest, NextResponse } from 'next/server'

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
      // VIES SOAP API endpoint
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Header/>
  <soap:Body>
    <tns:checkVat>
      <tns:countryCode>${vatNumber.substring(0, 2)}</tns:countryCode>
      <tns:vatNumber>${vatNumber.substring(2)}</tns:vatNumber>
    </tns:checkVat>
  </soap:Body>
</soap:Envelope>`

      const response = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        },
        body: soapEnvelope
      })

      if (response.ok) {
        const xmlText = await response.text()
        
        // Parse XML response
        const isValid = xmlText.includes('<valid>true</valid>')
        const companyName = xmlText.match(/<name>(.*?)<\/name>/)?.[1] || ''
        const address = xmlText.match(/<address>(.*?)<\/address>/)?.[1] || ''
        const city = xmlText.match(/<city>(.*?)<\/city>/)?.[1] || ''
        const postalCode = xmlText.match(/<postcode>(.*?)<\/postcode>/)?.[1] || ''
        const country = xmlText.match(/<countryCode>(.*?)<\/countryCode>/)?.[1] || ''

        if (isValid) {
          return NextResponse.json({
            valid: true,
            company_name: companyName,
            address: address,
            city: city,
            postal_code: postalCode,
            country: country,
            message: 'BTW nummer is geldig'
          })
        } else {
          return NextResponse.json({
            valid: false,
            message: 'BTW nummer is niet geldig'
          })
        }
      } else {
        return NextResponse.json({
          error: 'Kon geen verbinding maken met VIES service'
        }, { status: 503 })
      }

    } catch (apiError) {
      console.error('VIES API error:', apiError)
      return NextResponse.json({
        error: 'Fout bij BTW validatie'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in VAT validation API:', error)
    return NextResponse.json({
      error: 'Interne server fout'
    }, { status: 500 })
  }
}
