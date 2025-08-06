const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'alloygator-nl', 'alloygator.db');

// Read the JSON file
const jsonData = JSON.parse(fs.readFileSync('brons_dealers_import.json', 'utf8'));

async function importBronsDealers() {
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Starting brons dealers import...');

      // First, delete existing brons dealers (group_id = 2)
      db.run("DELETE FROM customers WHERE customer_group_id = 2 AND is_dealer = 1", (err) => {
        if (err) {
          console.error('Error deleting existing brons dealers:', err);
          reject(err);
          return;
        }
        console.log('Deleted existing brons dealers');

        // Insert new dealers
        const stmt = db.prepare(`
          INSERT INTO customers (
            name, email, phone, address, city, postal_code, country,
            customer_group_id, is_dealer, show_on_map, first_name, last_name, company_name,
            vat_number, invoice_email, website, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        let inserted = 0;
        jsonData.customers.forEach((dealer, index) => {
          stmt.run([
            dealer.name,
            dealer.email,
            dealer.phone,
            dealer.address,
            dealer.city,
            dealer.postal_code,
            dealer.country,
            dealer.customer_group_id,
            dealer.is_dealer ? 1 : 0,
            dealer.show_on_map ? 1 : 0,
            dealer.first_name,
            dealer.last_name,
            dealer.company_name,
            dealer.vat_number,
            dealer.invoice_email,
            dealer.website
          ], (err) => {
            if (err) {
              console.error(`Error inserting dealer ${index + 1}:`, err);
            } else {
              inserted++;
              console.log(`Inserted dealer ${index + 1}: ${dealer.name}`);
            }

            if (index === jsonData.customers.length - 1) {
              stmt.finalize((err) => {
                if (err) {
                  console.error('Error finalizing statement:', err);
                  reject(err);
                } else {
                  console.log(`Successfully imported ${inserted} brons dealers`);
                  resolve();
                }
              });
            }
          });
        });
      });
    });
  });
}

// Run the import
importBronsDealers()
  .then(() => {
    console.log('Brons dealers import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Brons dealers import failed:', error);
    process.exit(1);
  }); 