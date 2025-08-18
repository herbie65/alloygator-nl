import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = (searchParams.get('email') || '').toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'email vereist' }, { status: 400 })
    const customers = await FirebaseService.getDocuments('customers')
    const match = (customers || []).find((c: any) => String(c.email || '').toLowerCase().trim() === email)
    if (!match) return NextResponse.json(null)
    return NextResponse.json(match)
  } catch (e) {
    console.error('customers GET error', e)
    return NextResponse.json({ error: 'Fout bij ophalen klant' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email || '').toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'email vereist' }, { status: 400 })

    const customers = await FirebaseService.getDocuments('customers')
    const exists = (customers || []).find((c: any) => String(c.email || '').toLowerCase().trim() === email)

    const payload: any = {
      email,
      name: body.name || body.naam || `${body.voornaam || ''} ${body.achternaam || ''}`.trim(),
      contact_first_name: body.voornaam || body.first_name || '',
      contact_last_name: body.achternaam || body.last_name || '',
      phone: body.telefoon || body.phone || '',
      address: body.adres || body.address || '',
      postal_code: body.postcode || body.postalCode || '',
      city: body.plaats || body.city || '',
      country: body.land || body.country || 'NL',
      updated_at: new Date().toISOString(),
    }

    if (exists) {
      await FirebaseService.updateCustomer(exists.id, payload)
      return NextResponse.json({ ok: true, id: exists.id })
    }

    const created = await FirebaseService.addCustomer({ ...payload, created_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  } catch (e) {
    console.error('customers PUT error', e)
    return NextResponse.json({ error: 'Fout bij opslaan adres' }, { status: 500 })
  }
}
