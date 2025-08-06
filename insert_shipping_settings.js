const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'alloygator.db');
const db = new sqlite3.Database(dbPath);

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
];

async function insertShippingSettings() {
  return new Promise((resolve, reject) => {
    console.log('Inserting shipping settings...');
    
    // First, create the table if it doesn't exist
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating shipping_settings table:', err);
        reject(err);
        return;
      }
      
      // Clear existing data
      db.run('DELETE FROM shipping_settings', (err) => {
        if (err) {
          console.error('Error clearing shipping_settings:', err);
          reject(err);
          return;
        }
        
        // Insert new data
        const stmt = db.prepare(`
          INSERT INTO shipping_settings (
            method_name, display_name, cost, description, delivery_time, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        let completed = 0;
        shippingMethods.forEach((method) => {
          stmt.run([
            method.method_name,
            method.display_name,
            method.cost,
            method.description,
            method.delivery_time,
            method.sort_order
          ], (err) => {
            if (err) {
              console.error('Error inserting shipping method:', err);
              reject(err);
              return;
            }
            
            completed++;
            if (completed === shippingMethods.length) {
              stmt.finalize();
              console.log('Shipping settings inserted successfully!');
              resolve();
            }
          });
        });
      });
    });
  });
}

insertShippingSettings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  }); 