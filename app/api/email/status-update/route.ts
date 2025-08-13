import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, customerEmail, customerName, oldStatus, newStatus } = await request.json()

    if (!orderNumber || !customerEmail || !customerName || !oldStatus || !newStatus) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
        { status: 400 }
      )
    }

    // Haal settings op uit de database
    const settingsArray = await FirebaseService.getSettings()
    let emailService: EmailService
    
    if (settingsArray && settingsArray.length > 0) {
      const settings = settingsArray[0]
      emailService = new EmailService({
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || '587',
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass || '',
        adminEmail: settings.adminEmail || '',
        emailNotifications: settings.emailNotifications || false
      })
    } else {
      // Fallback naar environment variables
      emailService = new EmailService()
    }

    const success = await emailService.sendStatusUpdateNotification(
      orderNumber,
      customerEmail,
      customerName,
      oldStatus,
      newStatus
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Status update e-mail verzonden'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Fout bij het verzenden van status update e-mail'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Status update email error:', error)
    return NextResponse.json({
      success: false,
      message: 'Er is een fout opgetreden bij het verzenden van de status update e-mail'
    }, { status: 500 })
  }
}
