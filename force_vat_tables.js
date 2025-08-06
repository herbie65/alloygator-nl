const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function forceVatTables() {
  try {
    const dbPath = path.join(process.cwd(), 'alloygator.db');
    console.log('Opening database at:', dbPath);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Creating VAT tables...');

    // Create VAT Settings table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS vat_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code TEXT NOT NULL,
        country_name TEXT NOT NULL,
        standard_rate REAL NOT NULL,
        reduced_rate REAL NOT NULL,
        zero_rate REAL DEFAULT 0,
        is_eu_member BOOLEAN DEFAULT 0,
        reverse_charge_enabled BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(country_code)
      )
    `);

    // Create VAT Display Settings table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS vat_display_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('VAT tables created successfully');

    // Check if VAT settings exist
    const vatSettingsCount = await db.get('SELECT COUNT(*) as count FROM vat_settings');
    if (vatSettingsCount.count === 0) {
      console.log('Inserting VAT settings...');
      await db.run(`
        INSERT INTO vat_settings (country_code, country_name, standard_rate, reduced_rate, zero_rate, is_eu_member, reverse_charge_enabled) VALUES 
        ('NL', 'Nederland', 21.0, 9.0, 0.0, 1, 1),
        ('BE', 'België', 21.0, 6.0, 0.0, 1, 1),
        ('DE', 'Duitsland', 19.0, 7.0, 0.0, 1, 1),
        ('FR', 'Frankrijk', 20.0, 10.0, 0.0, 1, 1),
        ('GB', 'Verenigd Koninkrijk', 20.0, 5.0, 0.0, 0, 0)
      `);
      console.log('VAT settings inserted successfully');
    } else {
      console.log('VAT settings already exist');
    }

    // Check if VAT display settings exist
    const vatDisplaySettingsCount = await db.get('SELECT COUNT(*) as count FROM vat_display_settings');
    if (vatDisplaySettingsCount.count === 0) {
      console.log('Inserting VAT display settings...');
      await db.run(`
        INSERT INTO vat_display_settings (setting_key, setting_value, description) VALUES 
        ('frontend_prices_include_vat', 'true', 'Toon prijzen inclusief BTW in frontend'),
        ('dealer_prices_exclude_vat', 'true', 'Toon prijzen exclusief BTW voor dealers'),
        ('backend_prices_exclude_vat', 'true', 'Prijzen in backend zijn exclusief BTW'),
        ('auto_calculate_vat', 'true', 'Automatische BTW berekening'),
        ('reverse_charge_enabled', 'true', 'BTW verlegging inschakelen')
      `);
      console.log('VAT display settings inserted successfully');
    } else {
      console.log('VAT display settings already exist');
    }

    // Verify the data
    const vatSettings = await db.all('SELECT * FROM vat_settings');
    const displaySettings = await db.all('SELECT * FROM vat_display_settings');

    console.log('\nVAT Settings:');
    vatSettings.forEach(setting => {
      console.log(`- ${setting.country_name}: ${setting.standard_rate}% standaard, ${setting.reduced_rate}% verlaagd`);
    });

    console.log('\nDisplay Settings:');
    displaySettings.forEach(setting => {
      console.log(`- ${setting.setting_key}: ${setting.setting_value}`);
    });

    await db.close();
    console.log('\n✅ BTW tabellen succesvol aangemaakt en gevuld!');

  } catch (error) {
    console.error('Error creating VAT tables:', error);
  }
}

forceVatTables(); 