import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { rmaId, items } = await request.json()
    
    if (!rmaId) {
      return NextResponse.json(
        { error: 'Missing rmaId' },
        { status: 400 }
      )
    }

    // Update RMA status naar 'received' en sla ontvangen items op
    await FirebaseService.updateDocument('returns', rmaId, {
      status: 'received',
      received_at: new Date().toISOString(),
      items: items || []
    })
    
    return NextResponse.json({
      success: true,
      message: 'RMA received successfully'
    })
  } catch (error) {
    console.error('RMA receive error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
