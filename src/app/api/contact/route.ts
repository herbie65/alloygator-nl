import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ 
        success: false, 
        message: 'Alle velden zijn verplicht' 
      }, { status: 400 });
    }

    // Initialize email service
    const emailService = new EmailService();
    
    // Send contact form email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    if (adminEmail) {
      const mailOptions = {
        from: `AlloyGator Contact Form <${process.env.SMTP_USER}>`,
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
