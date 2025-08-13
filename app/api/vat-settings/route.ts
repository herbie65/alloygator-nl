import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET() {
  try {
    const vatSettings = await FirebaseService.getVatSettings()
    return NextResponse.json(vatSettings)
  } catch (error) {
    console.error('Error fetching VAT settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VAT settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { country, vat_rate, customer_type, vat_category } = body

    // Validate required fields
    if (!country || !vat_rate || !customer_type || !vat_category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const vatSetting = {
      id: Date.now().toString(),
      country,
      vat_rate: Number(vat_rate),
      customer_type,
      vat_category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await FirebaseService.createVatSetting(vatSetting)
    
    return NextResponse.json(vatSetting, { status: 201 })
  } catch (error) {
    console.error('Error creating VAT setting:', error)
    return NextResponse.json(
      { error: 'Failed to create VAT setting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, country, vat_rate, customer_type, vat_category } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing VAT setting ID' },
        { status: 400 }
      )
    }

    const updatedVatSetting = {
      id,
      country,
      vat_rate: Number(vat_rate),
      customer_type,
      vat_category,
      updated_at: new Date().toISOString()
    }

    await FirebaseService.updateVatSetting(id, updatedVatSetting)
    
    return NextResponse.json(updatedVatSetting)
  } catch (error) {
    console.error('Error updating VAT setting:', error)
    return NextResponse.json(
      { error: 'Failed to update VAT setting' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing VAT setting ID' },
        { status: 400 }
      )
    }

    await FirebaseService.deleteVatSetting(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting VAT setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete VAT setting' },
      { status: 500 }
    )
  }
}
