import { NextRequest, NextResponse } from 'next/server'


import { FirebaseService } from '@/lib/firebase';

// Helper functie om admin sessie te controleren
function checkAdminSession(request: NextRequest): boolean {
  const session = request.cookies.get('adminSessionV2')?.value || '';
  if (!session) {
    console.log('❌ Geen admin sessie cookie gevonden');
    return false;
  }
  
  try {
    const s = JSON.parse(decodeURIComponent(session));
    const isValid = s && s.email;
    console.log('🔍 Admin sessie check:', { hasSession: !!s, hasEmail: !!s?.email, isValid });
    return isValid;
  } catch (error) {
    console.log('❌ Fout bij parsen admin sessie:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Settings POST request ontvangen');
    
    // Controleer admin sessie
    if (!checkAdminSession(request)) {
      console.log('❌ Admin sessie check gefaald');
      return NextResponse.json({ 
        success: false, 
        message: 'Geen geldige admin sessie' 
      }, { status: 401 });
    }

    console.log('✅ Admin sessie geldig, instellingen ophalen...');
    const settingsData = await request.json();
    console.log('📝 Ontvangen instellingen:', Object.keys(settingsData));

    // Filter e-mail instellingen uit - deze komen uit environment variables
    const { smtpHost, smtpPort, smtpUser, smtpPass, adminEmail, emailNotifications, ...otherSettings } = settingsData;
    
    console.log('📧 E-mail instellingen gefilterd (gebruik environment variables)');
    console.log('💾 Overige instellingen opslaan in database');

    // Get existing settings to find the ID
    const existingSettings = await FirebaseService.getSettings();
    console.log('🔍 Bestaande instellingen gevonden:', existingSettings ? existingSettings.length : 0);
    
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const settingsId = existingSettings[0].id;
      console.log('🔄 Instellingen bijwerken met ID:', settingsId);
      
      await FirebaseService.updateSettings(settingsId, {
        ...existingSettings[0],
        ...otherSettings, // Alleen niet-e-mail instellingen
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Instellingen succesvol bijgewerkt');
    } else {
      // Create new settings
      console.log('🆕 Nieuwe instellingen aanmaken');
      
      await FirebaseService.createSettings({
        ...otherSettings, // Alleen niet-e-mail instellingen
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Nieuwe instellingen succesvol aangemaakt');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Instellingen succesvol opgeslagen (e-mail instellingen uit environment variables)' 
    });

  } catch (error) {
    console.error('❌ Fout bij opslaan instellingen:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het opslaan van de instellingen',
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Voor checkout pagina: geen admin sessie vereist
    // Voor admin pagina's: wel admin sessie vereist
    const isAdminRequest = request.nextUrl.pathname.includes('/admin');
    
    if (isAdminRequest && !checkAdminSession(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Geen geldige admin sessie' 
      }, { status: 401 });
    }

    const settings = await FirebaseService.getSettings();
    
    if (settings && settings.length > 0) {
      // Voeg e-mail instellingen toe uit environment variables
      const settingsWithEmail = {
        ...settings[0],
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || '587',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASSWORD ? '••••••••••••' : '', // Verberg wachtwoord
        adminEmail: process.env.ADMIN_EMAIL || 'admin@alloygator.nl',
        emailNotifications: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true'
      };
      
      return NextResponse.json(settingsWithEmail);
    } else {
      // Fallback naar standaard instellingen als database leeg is
      return NextResponse.json({
        shippingCost: '8.95',
        freeShippingThreshold: '300',
        shippingMethods: [
          { id: 'standard', name: 'Standaard verzending', price: 8.95, enabled: true, carrier: 'standard' }
        ],
        enabledCarriers: ['standard'],
        // E-mail instellingen uit environment variables
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || '587',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASSWORD ? '••••••••••••' : '',
        adminEmail: process.env.ADMIN_EMAIL || 'admin@alloygator.nl',
        emailNotifications: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true'
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Fallback naar standaard instellingen bij error
    return NextResponse.json({
      shippingCost: '8.95',
      freeShippingThreshold: '300',
      shippingMethods: [
        { id: 'standard', name: 'Standaard verzending', price: 8.95, enabled: true, carrier: 'standard' }
      ],
      enabledCarriers: ['standard'],
      // E-mail instellingen uit environment variables
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASSWORD ? '••••••••••••' : '',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@alloygator.nl',
      emailNotifications: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true'
    });
  }
}
