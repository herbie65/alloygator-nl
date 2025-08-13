import { NextRequest, NextResponse } from 'next/server'

function findTagValue(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
    new RegExp(`<\\w+:${tag}[^>]*>([\\s\\S]*?)<\\/\\w+:${tag}>`, 'i'),
  ]
  for (const re of patterns) {
    const m = xml.match(re)
    if (m && m[1] !== undefined) return m[1].trim()
  }
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vat = searchParams.get('vat')

    if (!vat) {
      return NextResponse.json({ error: 'BTW nummer is vereist' }, { status: 400 })
    }

    const cleanVat = vat.replace(/[\s\-\.]/g, '').toUpperCase()
    const countryCode = cleanVat.substring(0, 2)
    const vatNumber = cleanVat.substring(2)

    if (!/^[A-Z]{2}$/.test(countryCode) || !vatNumber) {
      return NextResponse.json({
        valid: false,
        message: 'Ongeldig BTW nummer formaat. Gebruik bijv. NL123456789B01',
      })
    }

    try {
      const viesUrl = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService'
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`

      const response = await fetch(viesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'User-Agent': 'AlloyGator-NL/1.0',
        },
        body: soapEnvelope,
      })

      if (!response.ok) {
        throw new Error(`VIES SOAP service error: ${response.status}`)
      }

      const xml = await response.text()

      // SOAP Fault handling
      const faultString = findTagValue(xml, 'faultstring')
      if (faultString) {
        throw new Error(`VIES SOAP Fault: ${faultString}`)
      }

      const validText = findTagValue(xml, 'valid')
      const nameText = findTagValue(xml, 'name')
      const addressText = findTagValue(xml, 'address')
      const requestDateText = findTagValue(xml, 'requestDate') || new Date().toISOString()

      let isValid: boolean | null = null
      if (validText) isValid = validText.trim().toLowerCase() === 'true'
      // Heuristic: if name or address present, treat as valid
      if (isValid === null) isValid = !!(nameText || addressText)

      if (!isValid) {
        return NextResponse.json({
          valid: false,
          message: 'BTW nummer niet gevonden in EU database',
          vat_number: cleanVat,
        })
      }

      // Parse address into street / postal_code / city
      let street = ''
      let postalCode = ''
      let city = ''
      if (addressText) {
        const lines = addressText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) street = lines[0]
        if (lines.length > 1) {
          // NL style: 1234 AB Amsterdam
          const m = lines[1].match(/([0-9]{4}\s?[A-Z]{2})\s+(.+)/)
          if (m) {
            postalCode = m[1]
            city = m[2]
          } else {
            city = lines[1]
          }
        }
      }

      return NextResponse.json({
        company_name: nameText || '',
        address: street || '',
        city,
        postal_code: postalCode,
        country: countryCode,
        vat_number: cleanVat,
        valid: true,
        request_date: requestDateText,
      })
    } catch (err) {
      console.error('VIES SOAP error:', err)
      return NextResponse.json({
        valid: true,
        vat_number: cleanVat,
        country: countryCode,
        company_name: '',
        address: '',
        city: '',
        postal_code: '',
        note: 'VIES niet bereikbaar; alleen formaat gevalideerd',
      })
    }
  } catch (error) {
    console.error('VAT validation error:', error)
    return NextResponse.json(
      { error: 'Interne server fout bij BTW validatie', valid: false },
      { status: 500 },
    )
  }
}
