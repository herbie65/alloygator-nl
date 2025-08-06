const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'alloygator.db');
const db = new sqlite3.Database(dbPath);

async function insertPaymentSettings() {
  return new Promise((resolve, reject) => {
    console.log('Inserting payment settings...');
    
    // Create payment_settings table if not exists
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating payment_settings table:', err);
        reject(err);
        return;
      }

      // Check if payment settings already exist
      db.get('SELECT COUNT(*) as count FROM payment_settings', (err, row) => {
        if (err) {
          console.error('Error checking existing payment settings:', err);
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('Payment settings already exist, skipping...');
          resolve();
          return;
        }

        // Insert Mollie payment settings
        db.run(`
          INSERT INTO payment_settings (
            provider_name, is_active, api_key, api_secret, test_mode, supported_methods
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          'mollie',
          1,
          'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Test API key
          'live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Live API secret
          1, // Test mode
          JSON.stringify(['ideal', 'creditcard', 'banktransfer', 'paypal'])
        ], (err) => {
          if (err) {
            console.error('Error inserting payment settings:', err);
            reject(err);
          } else {
            console.log('Payment settings inserted successfully');
            resolve();
          }
        });
      });
    });
  });
}

async function createPaymentTransactionsTable() {
  return new Promise((resolve, reject) => {
    console.log('Creating payment_transactions table...');
    
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating payment_transactions table:', err);
        reject(err);
      } else {
        console.log('Payment transactions table created successfully');
        resolve();
      }
    });
  });
}

async function main() {
  try {
    await createPaymentTransactionsTable();
    await insertPaymentSettings();
    console.log('All payment settings initialized successfully!');
  } catch (error) {
    console.error('Error initializing payment settings:', error);
  } finally {
    db.close();
  }
}

main(); 