import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json()
    
    if (!emailData || !emailData.customerEmail || !emailData.orderNumber) {
      return NextResponse.json({ error: 'Customer email and order number are required' }, { status: 400 })
    }

    const {
      orderNumber,
      customerEmail,
      customerName,
      oldStatus,
      newStatus
    } = emailData

    // Status vertalingen voor Nederlandse emails
    const statusTranslations: Record<string, string> = {
      'nieuw': 'Nieuw',
      'verwerken': 'Wordt verwerkt',
      'verzonden': 'Verzonden',
      'afgerond': 'Afgerond',
      'annuleren': 'Geannuleerd',
      'pending': 'In behandeling',
      'processing': 'Wordt verwerkt',
      'shipped': 'Verzonden',
      'delivered': 'Afgerond',
      'cancelled': 'Geannuleerd'
    }

    const oldStatusText = statusTranslations[oldStatus?.toLowerCase()] || oldStatus
    const newStatusText = statusTranslations[newStatus?.toLowerCase()] || newStatus

    // Email template voor status update
    const emailSubject = `Bestelling ${orderNumber} - Status bijgewerkt naar ${newStatusText}`
    
    const emailBody = `
Beste ${customerName},

De status van je bestelling ${orderNumber} is bijgewerkt.

**Oude status:** ${oldStatusText}
**Nieuwe status:** ${newStatusText}

${getStatusSpecificMessage(newStatus)}

Als je vragen hebt over je bestelling, neem dan gerust contact met ons op.

Met vriendelijke groet,
Het AlloyGator Team

---
Dit is een automatisch gegenereerde email. Reageer niet op dit bericht.
    `.trim()

    // Voor nu: log de email (kan later worden vervangen door echte email service)
    console.log('Status Update Email zou worden verzonden:')
    console.log('Naar:', customerEmail)
    console.log('Onderwerp:', emailSubject)
    console.log('Bericht:', emailBody)

    // TODO: Implementeer echte email verzending
    // Voor nu simuleren we succesvolle verzending
    const emailSent = true

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Status update email logged successfully',
        email: {
          to: customerEmail,
          subject: emailSubject,
          body: emailBody
        }
      })
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in status update email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Functie om status-specifieke berichten te genereren
function getStatusSpecificMessage(status: string): string {
  const statusLower = status?.toLowerCase()
  
  if (statusLower === 'verwerken' || statusLower === 'processing') {
    return `
Je bestelling wordt momenteel verwerkt in ons magazijn. 
We bereiden alles voor voor verzending en je ontvangt binnenkort een factuur.
    `.trim()
  }
  
  if (statusLower === 'verzonden' || statusLower === 'shipped') {
    return `
Je bestelling is verzonden! Je ontvangt binnenkort een tracking nummer per email.
    `.trim()
  }
  
  if (statusLower === 'afgerond' || statusLower === 'delivered') {
    return `
Je bestelling is succesvol afgerond. Bedankt voor je aankoop!
    `.trim()
  }
  
  if (statusLower === 'annuleren' || statusLower === 'cancelled') {
    return `
Je bestelling is geannuleerd. Als je vragen hebt, neem dan contact met ons op.
    `.trim()
  }
  
  return `
Je bestelling is bijgewerkt. We houden je op de hoogte van verdere ontwikkelingen.
  `.trim()
}
