const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'alloygator.db')
const db = new sqlite3.Database(dbPath)

console.log('Creating database with updated schema...')

db.serialize(() => {
  // Create products table with vat_category
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    price REAL NOT NULL,
    cost REAL DEFAULT 0,
    category TEXT,
    stock INTEGER DEFAULT 0,
    weight REAL DEFAULT 0,
    colour TEXT DEFAULT 'Mixed',
    ean TEXT,
    image TEXT,
    meta_title TEXT,
    meta_keywords TEXT,
    meta_description TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    vat_category TEXT DEFAULT 'standard',
    dimensions TEXT,
    material TEXT,
    warranty TEXT,
    shipping_class TEXT DEFAULT 'standard',
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER DEFAULT 999,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    land TEXT DEFAULT 'Nederland',
    company_name TEXT,
    invoice_email TEXT,
    lat REAL,
    lng REAL,
    is_dealer BOOLEAN DEFAULT 0,
    show_on_map BOOLEAN DEFAULT 0,
    separate_shipping_address BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create customer_groups table
  db.run(`CREATE TABLE IF NOT EXISTS customer_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_percentage REAL DEFAULT 0,
    show_on_map BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create vat_settings table
  db.run(`CREATE TABLE IF NOT EXISTS vat_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    standard_rate REAL NOT NULL,
    reduced_rate REAL NOT NULL,
    zero_rate REAL DEFAULT 0,
    is_eu_member BOOLEAN DEFAULT 1,
    reverse_charge_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create vat_display_settings table
  db.run(`CREATE TABLE IF NOT EXISTS vat_display_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create header_settings table
  db.run(`CREATE TABLE IF NOT EXISTS header_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logo_url TEXT,
    logo_alt TEXT DEFAULT 'AlloyGator Logo',
    show_cart BOOLEAN DEFAULT 1,
    show_login BOOLEAN DEFAULT 1,
    show_dealer_login BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create header_navigation table
  db.run(`CREATE TABLE IF NOT EXISTS header_navigation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    order_position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

  // Insert initial VAT settings
  db.run(`INSERT OR IGNORE INTO vat_settings (country_code, country_name, standard_rate, reduced_rate, zero_rate, is_eu_member, reverse_charge_enabled) VALUES 
    ('NL', 'Nederland', 21, 9, 0, 1, 0),
    ('BE', 'België', 21, 6, 0, 1, 1),
    ('DE', 'Duitsland', 19, 7, 0, 1, 0),
    ('FR', 'Frankrijk', 20, 10, 0, 1, 1),
    ('GB', 'Verenigd Koninkrijk', 20, 5, 0, 0, 0)
  `)

  // Insert VAT display settings
  db.run(`INSERT OR IGNORE INTO vat_display_settings (setting_key, setting_value, description) VALUES 
    ('frontend_prices_include_vat', 'true', 'Toon prijzen inclusief BTW in frontend'),
    ('dealer_prices_exclude_vat', 'true', 'Toon prijzen exclusief BTW voor dealers'),
    ('backend_prices_exclude_vat', 'true', 'Prijzen in backend zijn exclusief BTW'),
    ('auto_calculate_vat', 'true', 'Automatische BTW berekening'),
    ('reverse_charge_enabled', 'true', 'BTW verlegging inschakelen')
  `)

  // Insert customer groups
  db.run(`INSERT OR IGNORE INTO customer_groups (name, discount_percentage, show_on_map) VALUES 
    ('Particulieren', 0, 0),
    ('Brons Dealers', 10, 1),
    ('Zilver Dealers', 15, 1),
    ('Goud Dealers', 20, 1)
  `)

  // Insert header settings
  db.run(`INSERT OR IGNORE INTO header_settings (logo_url, logo_alt, show_cart, show_login, show_dealer_login) VALUES 
    ('', 'AlloyGator Logo', 1, 1, 1)
  `)

  // Insert header navigation items
  db.run(`INSERT OR IGNORE INTO header_navigation (title, url, order_position) VALUES 
    ('Winkel', '/winkel', 1),
    ('Wat is AlloyGator', '/wat-is-alloygator', 2),
    ('Foto''s en video''s', '/fotos-en-videos', 3),
    ('Vind een dealer', '/vind-een-dealer', 4)
  `)

  // Insert sample products with vat_category
  db.run(`INSERT OR IGNORE INTO products (name, description, price, category, stock, vat_category) VALUES 
    ('Set van 4 AlloyGators-Geel-12"-19"', 'Complete set van 4 gele AlloyGators voor velgbescherming. Geschikt voor velgen van 12" tot 19".', 119.83, 'alloygator-set', 50, 'standard'),
    ('Set van 4 AlloyGators-Blauw-12"-19"', 'Complete set van 4 blauwe AlloyGators voor velgbescherming. Geschikt voor velgen van 12" tot 19".', 119.83, 'alloygator-set', 45, 'standard'),
    ('Set van 4 AlloyGators-Rood-12"-19"', 'Complete set van 4 rode AlloyGators voor velgbescherming. Geschikt voor velgen van 12" tot 19".', 119.83, 'alloygator-set', 40, 'standard'),
    ('Montagehulpmiddel Set', 'Professionele tools voor eenvoudige montage van AlloyGators.', 24.95, 'montagehulpmiddelen', 100, 'reduced'),
    ('Accessoire Set', 'Extra onderdelen en accessoires voor onderhoud en reparatie.', 19.95, 'accessoires', 75, 'reduced')
  `)

  console.log('Database created successfully!')
})

db.close() 