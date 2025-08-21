import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = await request.json();

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({ 
        success: false, 
        message: 'Alle SMTP velden zijn verplicht' 
      }, { status: 400 });
    }

    // Initialize email service with provided settings
    const emailService = new EmailService({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      adminEmail: smtpUser,
      emailNotifications: true
    });

    // Test the connection
    const connectionTest = await emailService.testConnection();

    if (connectionTest) {
      return NextResponse.json({ 
        success: true, 
        message: 'E-mail configuratie werkt correct!' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail configuratie test gefaald' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het testen van de e-mail configuratie' 
    }, { status: 500 });
  }
}
