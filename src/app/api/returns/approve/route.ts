import { NextRequest, NextResponse } from 'next/server'
export const dynamic = "force-static"
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { rmaId } = await request.json()
    
    if (!rmaId) {
      return NextResponse.json(
        { error: 'Missing rmaId' },
        { status: 400 }
      )
    }

    // Update RMA status naar 'approved'
    await FirebaseService.updateDocument('returns', rmaId, {
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'RMA approved successfully'
    })
  } catch (error) {
    console.error('RMA approve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
