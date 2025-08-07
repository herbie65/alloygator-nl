import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, address } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, wachtwoord en naam zijn verplicht' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const usersRef = collection(db, 'customers')
    const q = query(usersRef, where('email', '==', email))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Email is al in gebruik' },
        { status: 409 }
      )
    }

    // Create new user
    const userData = {
      email,
      password,
      name,
      phone: phone || '',
      address: address || '',
      group: 'customer',
      createdAt: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, 'customers'), userData)

    return NextResponse.json({
      success: true,
      user: {
        id: docRef.id,
        email,
        name,
        group: 'customer'
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
