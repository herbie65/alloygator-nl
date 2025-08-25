import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, emailNotifications, smtpHost, smtpPort, smtpUser, smtpPass } = await request.json();

    // Debug: Log alle ontvangen instellingen
    console.log('🔍 Debug ontvangen instellingen:');
    console.log('smtpHost:', smtpHost);
    console.log('smtpPort:', smtpPort);
    console.log('smtpUser:', smtpUser);
    console.log('smtpPass:', smtpPass ? '***' : 'Niet ingesteld');

    // Controleer of alle SMTP instellingen aanwezig zijn
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({ 
        success: false, 
        message: `SMTP instellingen ontbreken: ${[
          !smtpHost && 'SMTP Host',
          !smtpPort && 'SMTP Port', 
          !smtpUser && 'SMTP Gebruiker',
          !smtpPass && 'SMTP Wachtwoord'
        ].filter(Boolean).join(', ')}. Vul alle velden in en sla de instellingen op.` 
      }, { status: 400 });
    }

    // Maak EmailService aan met database instellingen
    const emailService = new EmailService({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      adminEmail: adminEmail || smtpUser,
      emailNotifications: emailNotifications || false
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
