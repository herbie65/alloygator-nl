import { NextRequest, NextResponse } from 'next/server';
import { FirebaseClientService } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token en wachtwoord zijn verplicht' 
      }, { status: 400 });
    }

    // Wachtwoord validatie
    const passwordErrors = [];
    
    if (password.length < 8) {
      passwordErrors.push('Wachtwoord moet minimaal 8 karakters lang zijn');
    }
    
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('Wachtwoord moet minimaal 1 hoofdletter bevatten');
    }
    
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('Wachtwoord moet minimaal 1 kleine letter bevatten');
    }
    
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('Wachtwoord moet minimaal 1 cijfer bevatten');
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wachtwoord voldoet niet aan de vereisten',
        errors: passwordErrors
      }, { status: 400 });
    }

    // Valideer reset token
    const resetData = await FirebaseClientService.getPasswordResetByToken(token);
    if (!resetData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ongeldige of verlopen reset link. Vraag een nieuwe aan.' 
      }, { status: 400 });
    }

    // Controleer of email overeenkomt
    if (resetData.email !== email) {
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail komt niet overeen met de reset link.' 
      }, { status: 400 });
    }

    try {
      // Zoek gebruiker op email
      const customers = await FirebaseClientService.getCustomersByEmail(email);
      if (!customers || customers.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'Gebruiker niet gevonden' 
        }, { status: 404 });
      }

      const user = customers[0];
      
      // Update wachtwoord in database
      await FirebaseClientService.updateCustomer(user.id, { password: password });
      console.log(`Password reset successful for user ${email} - token: ${token}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Wachtwoord succesvol aangepast' 
      });

    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json({ 
        success: false, 
        message: 'Fout bij het bijwerken van wachtwoord. Probeer het later opnieuw.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
    }, { status: 500 });
  }
}
