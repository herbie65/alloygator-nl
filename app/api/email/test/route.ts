import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Haal settings op uit de database
    const settingsArray = await FirebaseService.getSettings()
    
    if (!settingsArray || settingsArray.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Geen e-mail instellingen gevonden. Vul eerst de SMTP instellingen in.'
      }, { status: 400 })
    }

    // Gebruik het eerste settings document
    const settings = settingsArray[0]
    
    console.log('E-mail test settings:', {
      host: settings.smtpHost,
      port: settings.smtpPort,
      user: settings.smtpUser,
      pass: settings.smtpPass ? '***' : 'empty'
    })
    
    // Maak EmailService met settings uit database
    const emailService = new EmailService({
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || '587',
      smtpUser: settings.smtpUser || '',
      smtpPass: settings.smtpPass || '',
      adminEmail: settings.adminEmail || '',
      emailNotifications: settings.emailNotifications || false
    })
    
    const isConnected = await emailService.testConnection()
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'E-mail configuratie werkt correct'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'E-mail configuratie werkt niet. Controleer je SMTP instellingen.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('E-mail test error:', error)
    return NextResponse.json({
      success: false,
      message: `Er is een fout opgetreden bij het testen van de e-mail configuratie: ${error}`
    }, { status: 500 })
  }
}
