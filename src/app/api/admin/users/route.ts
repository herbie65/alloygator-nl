import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const users = await FirebaseService.getDocuments('admin_users')
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const newUser = await FirebaseService.addDocument('admin_users', userData)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
  }
}


