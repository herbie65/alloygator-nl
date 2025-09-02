import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-static"
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Gebruik environment variables direct
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    const emailNotifications = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';

    // Debug: Log alle environment variables
    console.log('🔍 Debug environment variables:');
    console.log('smtpHost:', smtpHost);
    console.log('smtpPort:', smtpPort);
    console.log('smtpUser:', smtpUser);
    console.log('smtpPass:', smtpPass ? '***' : 'Niet ingesteld');

    // Controleer of alle SMTP instellingen aanwezig zijn
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({ 
        success: false, 
        message: `SMTP instellingen ontbreken in environment variables: ${[
          !smtpHost && 'SMTP_HOST',
          !smtpPort && 'SMTP_PORT', 
          !smtpUser && 'SMTP_USER',
          !smtpPass && 'SMTP_PASSWORD'
        ].filter(Boolean).join(', ')}.` 
      }, { status: 400 });
    }

    // Maak EmailService aan met environment variables
    const emailService = new EmailService({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      adminEmail: adminEmail || smtpUser,
      emailNotifications
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
      message: error instanceof Error ? error.message : 'Er is een fout opgetreden bij het testen van de e-mail configuratie' 
    }, { status: 500 });
  }
}
