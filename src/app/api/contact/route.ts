import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-static"
import { EmailService } from '@/lib/email';
import { FirebaseService } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ 
        success: false, 
        message: 'Alle velden zijn verplicht' 
      }, { status: 400 });
    }

    // Get email settings from database
    const settings = await FirebaseService.getSettings();
    const emailSettings = settings.find((s: any) => s.smtpHost && s.smtpUser && s.smtpPass);
    
    if (emailSettings) {
      // Initialize email service with settings from database
      const emailService = new EmailService({
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUser: emailSettings.smtpUser,
        smtpPass: emailSettings.smtpPass,
        adminEmail: emailSettings.adminEmail || emailSettings.smtpUser,
        emailNotifications: emailSettings.emailNotifications || true
      });
      
      // Send contact form email to admin
      const adminEmail = emailSettings.adminEmail || emailSettings.smtpUser;
      
      const mailOptions = {
        from: `AlloyGator Contact Form <${emailSettings.smtpUser}>`,
        to: adminEmail,
        subject: `Nieuw contactformulier bericht van ${name}`,
        html: `
          <h2>Nieuw bericht via contactformulier</h2>
          <p><strong>Naam:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Bericht:</strong></p>
          <p>${message}</p>
          <hr>
          <p><em>Dit bericht is automatisch gegenereerd door het AlloyGator contactformulier.</em></p>
        `
      };
      
      const emailSent = await emailService.sendMail(mailOptions);
      
      if (emailSent) {
        console.log(`Contact form email sent to admin from ${name} (${email})`);
      } else {
        console.error('Failed to send contact form email to admin');
      }
    } else {
      console.log('No email settings found, skipping email sending');
    }

    // Log the contact form submission
    console.log(`Contact form submitted by ${name} (${email}): ${message}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Bericht succesvol verzonden' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
    }, { status: 500 });
  }
}
