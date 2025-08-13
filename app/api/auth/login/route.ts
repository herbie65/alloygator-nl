import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 }
      )
    }

    const usersRef = collection(db, 'customers')
    const q = query(usersRef, where('email', '==', email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      )
    }

    const user = querySnapshot.docs[0].data() as any

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Onjuist wachtwoord' },
        { status: 401 }
      )
    }

    // Derive first/last name from available fields
    const firstName = user.contact_first_name || user.first_name || ''
    const lastName = user.contact_last_name || user.last_name || ''
    let derivedFirst = firstName
    let derivedLast = lastName
    if (!firstName && !lastName && user.name) {
      const parts = String(user.name).trim().split(/\s+/)
      derivedFirst = parts[0] || ''
      derivedLast = parts.slice(1).join(' ') || ''
    }

    return NextResponse.json({
      success: true,
      user: {
        id: querySnapshot.docs[0].id,
        email: user.email,
        voornaam: derivedFirst,
        achternaam: derivedLast,
        telefoon: user.phone || '',
        adres: user.address || '',
        postcode: user.postal_code || '',
        plaats: user.city || '',
        land: user.country || 'Nederland',
        company_name: user.company_name || '',
        invoice_email: user.invoice_email || '',
        vat_number: user.vat_number || '',
        separate_shipping_address: !!user.separate_shipping_address,
        shipping_address: user.shipping_address || '',
        shipping_postal_code: user.shipping_postal_code || '',
        shipping_city: user.shipping_city || '',
        shipping_country: user.shipping_country || '',
        is_dealer: !!(user.is_dealer || user.dealer === true),
        dealer_group: user.dealer_group || user.group || '',
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
