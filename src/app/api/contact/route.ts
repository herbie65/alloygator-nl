import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { naam, email, telefoon, onderwerp, bericht, privacy_accepted } = body

    // Validate required fields
    if (!naam || !email || !onderwerp || !bericht || !privacy_accepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create contact message object
    const contactMessage = {
      id: Date.now().toString(),
      naam,
      email,
      telefoon: telefoon || '',
      onderwerp,
      bericht,
      privacy_accepted,
      status: 'new',
      created_at: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }

    // In a real application, you would:
    // 1. Save to database
    // 2. Send notification email to admin
    // 3. Send confirmation email to customer
    // 4. Log the contact request

    console.log('Contact form submitted:', contactMessage)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Send notification email to admin (in real app)
    const adminNotificationEmail = `
      Nieuwe contactformulier ingediend:
      
      Naam: ${naam}
      Email: ${email}
      Telefoon: ${telefoon || 'Niet opgegeven'}
      Onderwerp: ${onderwerp}
      
      Bericht:
      ${bericht}
      
      Datum: ${new Date().toLocaleString('nl-NL')}
      IP: ${contactMessage.ip_address}
    `

    console.log('Admin notification email would be sent:', adminNotificationEmail)

    // Send confirmation email to customer (in real app)
    const customerConfirmationEmail = `
      Beste ${naam},
      
      Bedankt voor uw bericht. We hebben uw contactformulier ontvangen en nemen binnen 24 uur contact met u op.
      
      Uw bericht:
      Onderwerp: ${onderwerp}
      Bericht: ${bericht}
      
      Met vriendelijke groet,
      AlloyGator Nederland
      
      Contactgegevens:
      Telefoon: 085-3033400
      Email: info@alloygator.nl
      Adres: Kweekgrasstraat 36, 1313 BX Almere
    `

    console.log('Customer confirmation email would be sent to:', email)

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      contactId: contactMessage.id
    })

  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
