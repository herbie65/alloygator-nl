import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';

// Helper functie om admin sessie te controleren
function checkAdminSession(request: NextRequest): boolean {
  const session = request.cookies.get('adminSessionV2')?.value || '';
  if (!session) return false;
  
  try {
    const s = JSON.parse(decodeURIComponent(session));
    return s && s.email; // Basis check voor geldige sessie
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Controleer admin sessie
    if (!checkAdminSession(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Geen geldige admin sessie' 
      }, { status: 401 });
    }

    const settingsData = await request.json();

    // Get existing settings to find the ID
    const existingSettings = await FirebaseService.getSettings();
    
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const settingsId = existingSettings[0].id;
      await FirebaseService.updateSettings(settingsId, {
        ...existingSettings[0],
        ...settingsData,
        updated_at: new Date().toISOString()
      });
      
      console.log('Settings updated successfully');
    } else {
      // Create new settings
      await FirebaseService.createSettings({
        ...settingsData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('Settings created successfully');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Instellingen succesvol opgeslagen' 
    });

  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het opslaan van de instellingen' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Controleer admin sessie
    if (!checkAdminSession(request)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Geen geldige admin sessie' 
      }, { status: 401 });
    }

    const settings = await FirebaseService.getSettings();
    
    if (settings && settings.length > 0) {
      return NextResponse.json(settings[0]);
    } else {
      return NextResponse.json({});
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het ophalen van de instellingen' 
    }, { status: 500 });
  }
}
