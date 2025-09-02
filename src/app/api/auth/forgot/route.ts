import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-static"
import { EmailService } from '@/lib/email';
import { FirebaseClientService } from '@/lib/firebase-client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Forgot password API called');
    const { email } = await request.json();
    console.log('🔍 Email received:', email);

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail is verplicht' 
      }, { status: 400 });
    }

    // Controleer of gebruiker bestaat
    console.log('🔍 Checking if user exists in database...');
    const customers = await FirebaseClientService.getCustomersByEmail(email);
    console.log('🔍 Customers found:', customers ? customers.length : 0);
    
    if (!customers || customers.length === 0) {
      // Stuur geen foutmelding om te voorkomen dat hackers kunnen controleren welke emails bestaan
      console.log(`❌ No customers found for email: ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Als deze e-mail bij ons bekend is, ontvang je een resetlink' 
      });
    }

    console.log('✅ User found, generating reset token...');
    // Gebruiker bestaat, genereer reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('🔍 Reset token generated:', resetToken);
    
    // Sla reset token op in database met vervaldatum (24 uur)
    const resetData = {
      email: email,
      token: resetToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 uur
      used: false,
      created_at: new Date().toISOString()
    };

    try {
      // Voeg reset token toe aan password_resets collectie
      console.log('🔍 Storing reset token in database...');
      await FirebaseClientService.addPasswordReset(resetData);
      console.log(`✅ Reset token stored for ${email}: ${resetToken}`);
    } catch (dbError) {
      console.error('❌ Error storing reset token:', dbError);
      // Ga door met email versturen, maar log de fout
    }
    
    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('❌ NEXT_PUBLIC_BASE_URL environment variable is not set');
      return NextResponse.json({ 
        success: false, 
        message: 'Server configuratie fout. Neem contact op met de beheerder.' 
      }, { status: 500 });
    }
    
    const resetUrl = `${baseUrl}/auth/reset?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('🔍 Reset URL created:', resetUrl);
    
    // Email instellingen worden direct uit environment variables gehaald
    
    // Gebruik environment variables direct
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    
    // Controleer of alle benodigde instellingen aanwezig zijn
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error('❌ Missing email settings:', { smtpHost, smtpPort, smtpUser, hasPass: !!smtpPass });
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail configuratie niet volledig. Neem contact op met de beheerder.' 
      }, { status: 500 });
    }
    
    console.log('🔍 Creating EmailService with environment variables:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      hasPass: !!smtpPass
    });
    
    const emailService = new EmailService({
      smtpHost: smtpHost,
      smtpPort: smtpPort,
      smtpUser: smtpUser,
      smtpPass: smtpPass,
      adminEmail: process.env.ADMIN_EMAIL || smtpUser,
      emailNotifications: true
    });
    
    // Send password reset email
    console.log('🔍 Attempting to send email with environment variables:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      hasPass: !!smtpPass
    });
    
    console.log('🔍 Calling sendCustomerPasswordResetEmail...');
    const emailSent = await emailService.sendCustomerPasswordResetEmail(email, resetUrl);
    console.log('🔍 Email service result:', emailSent);
    
    if (emailSent) {
      console.log(`✅ Password reset email sent to ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Als deze e-mail bij ons bekend is, ontvang je een resetlink' 
      });
    } else {
      console.error('❌ Failed to send password reset email');
      return NextResponse.json({ 
        success: false, 
        message: 'Er is een fout opgetreden bij het verzenden van de e-mail. Probeer het later opnieuw.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
    }, { status: 500 });
  }
}
