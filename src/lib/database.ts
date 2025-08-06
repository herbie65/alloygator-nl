import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { FirebaseService } from './firebase'

let db: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (!db) {
    try {
      // Check if we're in production (Netlify) or development
      const isProduction = process.env.NODE_ENV === 'production'
      
      if (isProduction) {
        // In production, use Firebase
        console.log('🔥 Using Firebase in production');
        throw new Error('Firebase should be used directly in production, not through getDatabase()');
      } else {
        // In development, use SQLite
        const dbPath = path.join(process.cwd(), 'alloygator.db')
        console.log('💾 Using SQLite in development at:', dbPath)
        
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        })

        // Check if tables exist, if not create them
        const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'")
        if (!tableExists) {
          console.log('Tables do not exist, creating them...')
          await createTables()
          await insertInitialData()
          console.log('Database initialized successfully')
        } else {
          console.log('Database already exists, checking for missing settings...')
          // Check if VAT settings exist, if not add them
          const vatSettingsCount = await db.get('SELECT COUNT(*) as count FROM vat_settings')
          if (vatSettingsCount.count === 0) {
            console.log('Adding VAT settings to existing database...')
            await insertVatSettings()
          }
          
          const vatDisplaySettingsCount = await db.get('SELECT COUNT(*) as count FROM vat_display_settings')
          if (vatDisplaySettingsCount.count === 0) {
            console.log('Adding VAT display settings to existing database...')
            await insertVatDisplaySettings()
          }

          const shippingSettingsCount = await db.get('SELECT COUNT(*) as count FROM shipping_settings')
          if (shippingSettingsCount.count === 0) {
            console.log('Adding shipping settings to existing database...')
            await insertShippingSettings(db)
          }

          const paymentSettingsCount = await db.get('SELECT COUNT(*) as count FROM payment_settings')
          if (paymentSettingsCount.count === 0) {
            console.log('Adding payment settings to existing database...')
            await insertPaymentSettings(db)
          }
        }
      }
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }
  return db
}

// Firebase wrapper functions for API routes
export async function getCustomers() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getCustomers()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM customers')
  }
}

export async function getCustomerById(id: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getCustomerById(id)
  } else {
    const db = await getDatabase()
    return await db.get('SELECT * FROM customers WHERE id = ?', id)
  }
}

export async function addCustomer(customerData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.addCustomer(customerData)
  } else {
    const db = await getDatabase()
    const result = await db.run(
      'INSERT INTO customers (name, email, phone, address, city, postal_code, country, customer_group_id, is_dealer, first_name, last_name, company_name, vat_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customerData.name, customerData.email, customerData.phone, customerData.address, customerData.city, customerData.postal_code, customerData.country, customerData.customer_group_id, customerData.is_dealer, customerData.first_name, customerData.last_name, customerData.company_name, customerData.vat_number]
    )
    return { id: result.lastID, ...customerData }
  }
}

export async function updateCustomer(id: string, customerData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateCustomer(id, customerData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, country = ?, customer_group_id = ?, is_dealer = ?, first_name = ?, last_name = ?, company_name = ?, vat_number = ? WHERE id = ?',
      [customerData.name, customerData.email, customerData.phone, customerData.address, customerData.city, customerData.postal_code, customerData.country, customerData.customer_group_id, customerData.is_dealer, customerData.first_name, customerData.last_name, customerData.company_name, customerData.vat_number, id]
    )
    return { id, ...customerData }
  }
}

export async function deleteCustomer(id: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.deleteCustomer(id)
  } else {
    const db = await getDatabase()
    await db.run('DELETE FROM customers WHERE id = ?', id)
    return true
  }
}

export async function getProducts() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getProducts()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM products')
  }
}

export async function addProduct(productData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.addProduct(productData)
  } else {
    const db = await getDatabase()
    const result = await db.run(
      'INSERT INTO products (sku, name, short_description, description, price, cost, category, stock, weight, colour, ean, image, meta_title, meta_keywords, meta_description, is_active, is_featured, vat_category, dimensions, material, warranty, shipping_class, min_order_quantity, max_order_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [productData.sku, productData.name, productData.short_description, productData.description, productData.price, productData.cost, productData.category, productData.stock, productData.weight, productData.colour, productData.ean, productData.image, productData.meta_title, productData.meta_keywords, productData.meta_description, productData.is_active, productData.is_featured, productData.vat_category, productData.dimensions, productData.material, productData.warranty, productData.shipping_class, productData.min_order_quantity, productData.max_order_quantity]
    )
    return { id: result.lastID, ...productData }
  }
}

export async function updateProduct(id: string, productData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateProduct(id, productData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE products SET sku = ?, name = ?, short_description = ?, description = ?, price = ?, cost = ?, category = ?, stock = ?, weight = ?, colour = ?, ean = ?, image = ?, meta_title = ?, meta_keywords = ?, meta_description = ?, is_active = ?, is_featured = ?, vat_category = ?, dimensions = ?, material = ?, warranty = ?, shipping_class = ?, min_order_quantity = ?, max_order_quantity = ? WHERE id = ?',
      [productData.sku, productData.name, productData.short_description, productData.description, productData.price, productData.cost, productData.category, productData.stock, productData.weight, productData.colour, productData.ean, productData.image, productData.meta_title, productData.meta_keywords, productData.meta_description, productData.is_active, productData.is_featured, productData.vat_category, productData.dimensions, productData.material, productData.warranty, productData.shipping_class, productData.min_order_quantity, productData.max_order_quantity, id]
    )
    return { id, ...productData }
  }
}

export async function getVatSettings() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getVatSettings()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM vat_settings')
  }
}

export async function updateVatSettings(id: string, vatData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateVatSettings(id, vatData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE vat_settings SET country_code = ?, country_name = ?, standard_rate = ?, reduced_rate = ?, super_reduced_rate = ?, parking_rate = ?, is_eu = ? WHERE id = ?',
      [vatData.country_code, vatData.country_name, vatData.standard_rate, vatData.reduced_rate, vatData.super_reduced_rate, vatData.parking_rate, vatData.is_eu, id]
    )
    return { id, ...vatData }
  }
}

export async function getShippingSettings() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getShippingSettings()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM shipping_settings')
  }
}

export async function updateShippingSettings(id: string, shippingData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateShippingSettings(id, shippingData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE shipping_settings SET name = ?, cost = ?, is_active = ?, description = ? WHERE id = ?',
      [shippingData.name, shippingData.cost, shippingData.is_active, shippingData.description, id]
    )
    return { id, ...shippingData }
  }
}

export async function getPaymentSettings() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getPaymentSettings()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM payment_settings')
  }
}

export async function updatePaymentSettings(id: string, paymentData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updatePaymentSettings(id, paymentData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE payment_settings SET provider = ?, api_key = ?, test_mode = ?, supported_methods = ? WHERE id = ?',
      [paymentData.provider, paymentData.api_key, paymentData.test_mode, paymentData.supported_methods, id]
    )
    return { id, ...paymentData }
  }
}

export async function getHeaderSettings() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getHeaderSettings()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM header_settings')
  }
}

export async function updateHeaderSettings(id: string, headerData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateHeaderSettings(id, headerData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE header_settings SET logo_url = ?, show_cart = ?, show_login = ?, show_dealer_login = ? WHERE id = ?',
      [headerData.logo_url, headerData.show_cart, headerData.show_login, headerData.show_dealer_login, id]
    )
    return { id, ...headerData }
  }
}

export async function getDhlSettings() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.getDhlSettings()
  } else {
    const db = await getDatabase()
    return await db.all('SELECT * FROM dhl_settings')
  }
}

export async function updateDhlSettings(id: string, dhlData: any) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return await FirebaseService.updateDhlSettings(id, dhlData)
  } else {
    const db = await getDatabase()
    await db.run(
      'UPDATE dhl_settings SET api_key = ?, test_mode = ?, is_active = ? WHERE id = ?',
      [dhlData.api_key, dhlData.test_mode, dhlData.is_active, id]
    )
    return { id, ...dhlData }
  }
}

async function createTables() {
  try {
    const database = await getDatabase()
    
    console.log('Creating tables...')
    
    // Products table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS products (
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
      )
    `)

    // Customer groups table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS customer_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        discount_percentage REAL DEFAULT 0,
        show_on_map BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Customers table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'Nederland',
        customer_group_id INTEGER,
        is_dealer BOOLEAN DEFAULT 0,
        show_on_map BOOLEAN DEFAULT 0,
        lat REAL,
        lng REAL,
        first_name TEXT,
        last_name TEXT,
        company_name TEXT,
        invoice_email TEXT,
        website TEXT,
        vat_number TEXT,
        vat_verified BOOLEAN DEFAULT 0,
        vat_reverse_charge BOOLEAN DEFAULT 0,
        separate_shipping_address BOOLEAN DEFAULT 0,
        shipping_address TEXT,
        shipping_city TEXT,
        shipping_postal_code TEXT,
        shipping_country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_group_id) REFERENCES customer_groups (id)
      )
    `)

    // Dealers table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS dealers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        address TEXT,
        city TEXT,
        phone TEXT,
        website TEXT,
        group_type TEXT DEFAULT 'brons',
        lat REAL,
        lng REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Shipping addresses table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS shipping_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT DEFAULT 'Nederland',
        phone TEXT,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `)

    // Orders table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        customer_address TEXT NOT NULL,
        customer_city TEXT NOT NULL,
        customer_postal_code TEXT NOT NULL,
        customer_country TEXT DEFAULT 'Nederland',
        customer_first_name TEXT,
        customer_last_name TEXT,
        customer_company_name TEXT,
        customer_invoice_email TEXT,
        shipping_address TEXT,
        shipping_city TEXT,
        shipping_postal_code TEXT,
        shipping_country TEXT,
        separate_shipping_address BOOLEAN DEFAULT 0,
        total_amount REAL NOT NULL,
        vat_amount REAL NOT NULL,
        shipping_cost REAL DEFAULT 0,
        payment_method TEXT,
        status TEXT DEFAULT 'pending',
        dealer_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dealer_id) REFERENCES dealers (id)
      )
    `)

    // Order items table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `)

    // CMS pages table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS cms_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        image TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Company info table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS company_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        kvk_number TEXT NOT NULL,
        btw_number TEXT NOT NULL,
        iban TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // VAT Settings table
    await database.exec(`
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
    `)

    // VAT Display Settings table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS vat_display_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // CRM Notes table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS crm_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        note_type TEXT DEFAULT 'general',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_important BOOLEAN DEFAULT 0,
        is_private BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `)

    // CRM Activities table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS crm_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        due_date DATETIME,
        completed_at DATETIME,
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `)

    // CRM Customer Stats table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS crm_customer_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER UNIQUE NOT NULL,
        total_orders INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        average_order_value REAL DEFAULT 0,
        last_order_date DATETIME,
        first_order_date DATETIME,
        preferred_categories TEXT,
        preferred_products TEXT,
        customer_lifetime_value REAL DEFAULT 0,
        days_since_last_order INTEGER DEFAULT 0,
        order_frequency_days REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `)

    // CRM Tags table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS crm_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3B82F6',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // CRM Customer Tags table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS crm_customer_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES crm_tags (id) ON DELETE CASCADE,
        UNIQUE(customer_id, tag_id)
      )
    `)

    // DHL Settings table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS dhl_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled BOOLEAN DEFAULT 0,
        api_key TEXT,
        api_secret TEXT,
        account_number TEXT,
        test_mode BOOLEAN DEFAULT 1,
        default_service TEXT DEFAULT 'parcel',
        pickup_location TEXT,
        sender_name TEXT,
        sender_company TEXT,
        sender_address TEXT,
        sender_city TEXT,
        sender_postal_code TEXT,
        sender_country TEXT DEFAULT 'NL',
        sender_phone TEXT,
        sender_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create shipping_settings table
    await database.run(`
      CREATE TABLE IF NOT EXISTS shipping_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        cost DECIMAL(10,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT 1,
        description TEXT,
        delivery_time TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create header_settings table
    
    // Payment settings table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        api_key TEXT,
        api_secret TEXT,
        webhook_url TEXT,
        test_mode BOOLEAN DEFAULT 1,
        supported_methods TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Payment transactions table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        transaction_id TEXT UNIQUE NOT NULL,
        provider TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'EUR',
        status TEXT NOT NULL,
        payment_method TEXT,
        customer_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    `)
    
    console.log('Tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

async function insertShippingSettings(database: any) {
  try {
    console.log('Inserting shipping settings...')
    
    // Check if shipping settings already exist
    const existingSettings = await database.get('SELECT COUNT(*) as count FROM shipping_settings')
    if (existingSettings.count > 0) {
      console.log('Shipping settings already exist, skipping...')
      return
    }

    const shippingMethods = [
      {
        method_name: 'pickup',
        display_name: 'Afhalen bij AlloyGator in Almere',
        cost: 0.00,
        description: 'Gratis afhalen',
        delivery_time: 'Direct beschikbaar',
        sort_order: 1
      },
      {
        method_name: 'standard',
        display_name: 'Standaard bezorging',
        cost: 7.50,
        description: '3-5 werkdagen',
        delivery_time: '3-5 werkdagen',
        sort_order: 2
      },
      {
        method_name: 'servicepoint',
        display_name: 'ServicePoint',
        cost: 7.50,
        description: 'Afhalen bij een ServicePoint',
        delivery_time: '2-4 werkdagen',
        sort_order: 3
      }
    ]

    for (const method of shippingMethods) {
      await database.run(`
        INSERT INTO shipping_settings (
          method_name, display_name, cost, description, delivery_time, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        method.method_name,
        method.display_name,
        method.cost,
        method.description,
        method.delivery_time,
        method.sort_order
      ])
    }

    console.log('Shipping settings inserted successfully')
  } catch (error) {
    console.error('Error inserting shipping settings:', error)
    throw error
  }
}

async function insertVatSettings() {
  try {
    const database = await getDatabase()
    
    console.log('Inserting VAT settings...')
    await database.run(`
      INSERT INTO vat_settings (country_code, country_name, standard_rate, reduced_rate, zero_rate, is_eu_member, reverse_charge_enabled) VALUES 
      ('NL', 'Nederland', 21.0, 9.0, 0.0, 1, 1),
      ('BE', 'België', 21.0, 6.0, 0.0, 1, 1),
      ('DE', 'Duitsland', 19.0, 7.0, 0.0, 1, 1),
      ('FR', 'Frankrijk', 20.0, 10.0, 0.0, 1, 1),
      ('GB', 'Verenigd Koninkrijk', 20.0, 5.0, 0.0, 0, 0)
    `)
  } catch (error) {
    console.error('Error inserting VAT settings:', error)
  }
}

async function insertPaymentSettings(database: any) {
  try {
    console.log('Inserting payment settings...')
    
    // Check if payment settings already exist
    const existingSettings = await database.get('SELECT COUNT(*) as count FROM payment_settings')
    if (existingSettings.count > 0) {
      console.log('Payment settings already exist, skipping...')
      return
    }

    // Insert Mollie payment settings
    await database.run(`
      INSERT INTO payment_settings (
        provider_name, is_active, api_key, api_secret, test_mode, supported_methods
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'mollie',
      1,
      'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Test API key
      'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Test API secret
      1, // Test mode
      JSON.stringify(['ideal', 'creditcard', 'banktransfer', 'paypal'])
    ])

    console.log('Payment settings inserted successfully')
  } catch (error) {
    console.error('Error inserting payment settings:', error)
    throw error
  }
}

async function insertVatDisplaySettings() {
  try {
    const database = await getDatabase()
    
    console.log('Inserting VAT display settings...')
    await database.run(`
      INSERT INTO vat_display_settings (setting_key, setting_value, description) VALUES 
      ('frontend_prices_include_vat', 'true', 'Toon prijzen inclusief BTW in frontend'),
      ('dealer_prices_exclude_vat', 'true', 'Toon prijzen exclusief BTW voor dealers'),
      ('backend_prices_exclude_vat', 'true', 'Prijzen in backend zijn exclusief BTW'),
      ('auto_calculate_vat', 'true', 'Automatische BTW berekening'),
      ('reverse_charge_enabled', 'true', 'BTW verlegging inschakelen')
    `)
  } catch (error) {
    console.error('Error inserting VAT display settings:', error)
  }
}

async function insertInitialData() {
  try {
    const database = await getDatabase()
    
    console.log('Inserting initial data...')
    
    // Check if company info exists
    const companyExists = await database.get('SELECT COUNT(*) as count FROM company_info')
    if (companyExists.count === 0) {
      console.log('Inserting company info...')
      await database.run(`
        INSERT INTO company_info (
          name, address, city, postal_code, country, phone, email, kvk_number, btw_number, iban
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'AlloyGator Nederland B.V.',
        'Kweekgrasstraat 36',
        'Almere',
        '1313BX',
        'Nederland',
        '085-3033400',
        'info@alloygator.nl',
        'KvK 71883614',
        'BTW NL8588.87.447.B01',
        'IBAN NL66KNAB0256771685'
      ])
    }

    // Check if sample products exist
    const productsExist = await database.get('SELECT COUNT(*) as count FROM products')
    if (productsExist.count === 0) {
      console.log('Inserting sample products...')
      await database.run(`
        INSERT INTO products (name, description, price, category, stock) VALUES 
        ('AlloyGator Complete Set 17"', 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen', 89.95, 'alloygator-set', 50),
        ('AlloyGator Complete Set 18"', 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen', 99.95, 'alloygator-set', 45),
        ('AlloyGator Complete Set 19"', 'Complete set voor 19 inch velgen inclusief montagehulpmiddelen', 109.95, 'alloygator-set', 40),
        ('Montage Tool Set', 'Professionele montagehulpmiddelen voor eenvoudige installatie', 24.95, 'montagehulpmiddelen', 100),
        ('Vervangingsonderdelen Set', 'Extra onderdelen voor onderhoud en reparatie', 19.95, 'accessoires', 75)
      `)
    }

    // Check if sample customer groups exist
    const groupsExist = await database.get('SELECT COUNT(*) as count FROM customer_groups')
    if (groupsExist.count === 0) {
      console.log('Inserting sample customer groups...')
      await database.run(`
        INSERT INTO customer_groups (name, description, discount_percentage, show_on_map) VALUES 
        ('Particulieren', 'Reguliere particuliere klanten', 0, 0),
        ('Brons Dealers', 'Brons niveau dealers', 10, 1),
        ('Zilver Dealers', 'Zilver niveau dealers', 15, 1),
        ('Goud Dealers', 'Goud niveau dealers', 20, 1)
      `)
    }



    // Check if sample customers exist
    const customersExist = await database.get('SELECT COUNT(*) as count FROM customers')
    if (customersExist.count === 0) {
      console.log('Inserting sample customers...')
      await database.run(`
        INSERT INTO customers (
          name, email, phone, address, city, postal_code, country, customer_group_id,
          is_dealer, show_on_map, first_name, last_name,
          company_name, invoice_email, website, vat_number, vat_verified,
          vat_reverse_charge, lat, lng
        ) VALUES 
        ('Jan Jansen', 'jan.jansen@email.com', '0612345678', 'Hoofdstraat 123', 'Amsterdam', '1000 AA', 'Nederland', 1, 0, 0, 'Jan', 'Jansen', '', 'jan.jansen@email.com', '', NULL, 0, 0, NULL, NULL),
        ('Maria de Vries', 'maria.devries@email.com', '0623456789', 'Kerkstraat 56', 'Den Haag', '2500 DD', 'Nederland', 1, 0, 0, 'Maria', 'de Vries', '', 'maria.devries@email.com', '', NULL, 0, 0, NULL, NULL)
      `)
    }

    // Create default shipping addresses for existing customers
    console.log('Creating default shipping addresses for existing customers...')
    const customers = await database.all('SELECT * FROM customers')
    for (const customer of customers) {
      // Check if customer already has shipping addresses
      const shippingAddressesExist = await database.get(
        'SELECT COUNT(*) as count FROM shipping_addresses WHERE customer_id = ?',
        [customer.id]
      )
      
      if (shippingAddressesExist.count === 0) {
        // Create default shipping address based on customer's invoice address
        const addressName = customer.company_name ? 'Factuuradres' : 'Thuisadres'
        await database.run(`
          INSERT INTO shipping_addresses (
            customer_id, name, address, city, postal_code, country, phone, is_default
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          customer.id,
          addressName,
          customer.address || '',
          customer.city || '',
          customer.postal_code || '',
          customer.country || 'Nederland',
          customer.phone || '',
        ])
      }
    }

    // Check if sample dealers exist - geen sample dealers meer
    const dealersExist = await database.get('SELECT COUNT(*) as count FROM dealers')
    if (dealersExist.count === 0) {
      console.log('No sample dealers to insert...')
    }

    // Check if sample CMS pages exist
    const pagesExist = await database.get('SELECT COUNT(*) as count FROM cms_pages')
    if (pagesExist.count === 0) {
      console.log('Inserting sample CMS pages...')
      await database.run(`
        INSERT INTO cms_pages (slug, title, content, meta_description) VALUES 
        ('over-ons', 'Over AlloyGator Nederland', 'AlloyGator Nederland B.V. is de officiële distributeur van AlloyGator velgbescherming voor Nederland en België. Wij bieden professionele oplossingen voor het beschermen van uw dure velgen tegen stoeprandschade.', 'Leer meer over AlloyGator Nederland B.V., de officiële distributeur van velgbescherming voor Nederland en België.'),
        ('contact', 'Contact', 'Neem contact met ons op voor vragen over onze producten of voor professioneel advies. Onze experts staan klaar om u te helpen.', 'Contact AlloyGator Nederland voor vragen over velgbescherming, bestellingen of professioneel advies.'),
        ('waarom-alloygator', 'Waarom AlloyGator?', 'AlloyGator biedt bewezen effectieve velgbescherming die uw dure velgen beschermt tegen beschadigingen door stoepranden. Ontdek waarom duizenden klanten voor AlloyGator kiezen.', 'Ontdek waarom AlloyGator de beste keuze is voor velgbescherming. Bewezen effectiviteit en professionele kwaliteit.')
      `)
    }
    
    // Insert shipping settings
    await insertShippingSettings(database)
    
    // Insert payment settings
    await insertPaymentSettings(database)
    
    console.log('Initial data inserted successfully')
  } catch (error) {
    console.error('Error inserting initial data:', error)
    throw error
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close()
    db = null
  }
} 