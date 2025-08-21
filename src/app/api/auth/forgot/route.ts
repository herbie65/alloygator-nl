import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail is verplicht' 
      }, { status: 400 });
    }

    // TODO: Implement actual user lookup in database
    // For now, we'll send the reset email to any valid email format
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Create reset URL (this should point to your reset password page)
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset?token=${resetToken}`;
    
    // Initialize email service
    const emailService = new EmailService();
    
    // Send password reset email
    const emailSent = await emailService.sendCustomerPasswordResetEmail(email, resetUrl);
    
    if (emailSent) {
      console.log(`Password reset email sent to ${email}`);
      
      // TODO: Store reset token in database with expiry
      // For now, we'll just log it
      console.log(`Reset token generated: ${resetToken}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Als deze e-mail bij ons bekend is, ontvang je een resetlink' 
      });
    } else {
      console.error('Failed to send password reset email');
      return NextResponse.json({ 
        success: false, 
        message: 'Er is een fout opgetreden bij het verzenden van de e-mail. Probeer het later opnieuw.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
    }, { status: 500 });
  }
}
