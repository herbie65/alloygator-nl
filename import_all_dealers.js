const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'alloygator.db');

// Sample dealers data (you can replace this with your actual CSV data)
const dealers = [
  {
    name: "AlloyGator Dealer Amsterdam",
    email: "amsterdam@alloygator.nl",
    phone: "0201234567",
    address: "Kalverstraat 1",
    city: "Amsterdam",
    postal_code: "1012 NX",
    country: "Nederland",
    customer_group_id: 2, // Brons
    is_dealer: 1,
    first_name: "Jan",
    last_name: "Amsterdam",
    company_name: "AlloyGator Dealer Amsterdam",
    vat_number: "NL123456789B01"
  },
  {
    name: "AlloyGator Dealer Rotterdam",
    email: "rotterdam@alloygator.nl",
    phone: "0101234567",
    address: "Coolsingel 1",
    city: "Rotterdam",
    postal_code: "3011 AL",
    country: "Nederland",
    customer_group_id: 3, // Zilver
    is_dealer: 1,
    first_name: "Piet",
    last_name: "Rotterdam",
    company_name: "AlloyGator Dealer Rotterdam",
    vat_number: "NL987654321B02"
  },
  {
    name: "AlloyGator Dealer Den Haag",
    email: "denhaag@alloygator.nl",
    phone: "0701234567",
    address: "Grote Marktstraat 1",
    city: "Den Haag",
    postal_code: "2511 BL",
    country: "Nederland",
    customer_group_id: 4, // Goud
    is_dealer: 1,
    first_name: "Klaas",
    last_name: "Den Haag",
    company_name: "AlloyGator Dealer Den Haag",
    vat_number: "NL456789123B03"
  },
  {
    name: "AlloyGator Dealer Utrecht",
    email: "utrecht@alloygator.nl",
    phone: "0301234567",
    address: "Stadhuisbrug 1",
    city: "Utrecht",
    postal_code: "3511 LZ",
    country: "Nederland",
    customer_group_id: 2, // Brons
    is_dealer: 1,
    first_name: "Henk",
    last_name: "Utrecht",
    company_name: "AlloyGator Dealer Utrecht",
    vat_number: "NL789123456B04"
  },
  {
    name: "AlloyGator Dealer Eindhoven",
    email: "eindhoven@alloygator.nl",
    phone: "0401234567",
    address: "Markt 1",
    city: "Eindhoven",
    postal_code: "5611 EB",
    country: "Nederland",
    customer_group_id: 3, // Zilver
    is_dealer: 1,
    first_name: "Frans",
    last_name: "Eindhoven",
    company_name: "AlloyGator Dealer Eindhoven",
    vat_number: "NL321654987B05"
  },
  {
    name: "AlloyGator Dealer Groningen",
    email: "groningen@alloygator.nl",
    phone: "0501234567",
    address: "Grote Markt 1",
    city: "Groningen",
    postal_code: "9711 HN",
    country: "Nederland",
    customer_group_id: 2, // Brons
    is_dealer: 1,
    first_name: "Gerard",
    last_name: "Groningen",
    company_name: "AlloyGator Dealer Groningen",
    vat_number: "NL147258369B06"
  },
  {
    name: "AlloyGator Dealer Tilburg",
    email: "tilburg@alloygator.nl",
    phone: "0131234567",
    address: "Heuvel 1",
    city: "Tilburg",
    postal_code: "5038 CP",
    country: "Nederland",
    customer_group_id: 3, // Zilver
    is_dealer: 1,
    first_name: "Theo",
    last_name: "Tilburg",
    company_name: "AlloyGator Dealer Tilburg",
    vat_number: "NL963852741B07"
  },
  {
    name: "AlloyGator Dealer Almere",
    email: "almere@alloygator.nl",
    phone: "0361234567",
    address: "Stadhuisplein 1",
    city: "Almere",
    postal_code: "1315 HP",
    country: "Nederland",
    customer_group_id: 4, // Goud
    is_dealer: 1,
    first_name: "Bert",
    last_name: "Almere",
    company_name: "AlloyGator Dealer Almere",
    vat_number: "NL741852963B08"
  },
  {
    name: "AlloyGator Dealer Breda",
    email: "breda@alloygator.nl",
    phone: "0761234567",
    address: "Grote Markt 1",
    city: "Breda",
    postal_code: "4811 WG",
    country: "Nederland",
    customer_group_id: 2, // Brons
    is_dealer: 1,
    first_name: "Wim",
    last_name: "Breda",
    company_name: "AlloyGator Dealer Breda",
    vat_number: "NL369258147B09"
  },
  {
    name: "AlloyGator Dealer Nijmegen",
    email: "nijmegen@alloygator.nl",
    phone: "0241234567",
    address: "Grote Markt 1",
    city: "Nijmegen",
    postal_code: "6511 KB",
    country: "Nederland",
    customer_group_id: 3, // Zilver
    is_dealer: 1,
    first_name: "Hans",
    last_name: "Nijmegen",
    company_name: "AlloyGator Dealer Nijmegen",
    vat_number: "NL852963741B10"
  }
];

async function importDealers() {
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Starting dealer import...');

      // First, delete existing dealers
      db.run("DELETE FROM customers WHERE is_dealer = 1", (err) => {
        if (err) {
          console.error('Error deleting existing dealers:', err);
          reject(err);
          return;
        }
        console.log('Deleted existing dealers');

        // Insert new dealers
        const stmt = db.prepare(`
          INSERT INTO customers (
            name, email, phone, address, city, postal_code, country,
            customer_group_id, is_dealer, first_name, last_name, company_name,
            vat_number, invoice_email, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        let inserted = 0;
        dealers.forEach((dealer, index) => {
          stmt.run([
            dealer.name,
            dealer.email,
            dealer.phone,
            dealer.address,
            dealer.city,
            dealer.postal_code,
            dealer.country,
            dealer.customer_group_id,
            dealer.is_dealer,
            dealer.first_name,
            dealer.last_name,
            dealer.company_name,
            dealer.vat_number,
            dealer.email, // invoice_email same as email
          ], (err) => {
            if (err) {
              console.error(`Error inserting dealer ${index + 1}:`, err);
            } else {
              inserted++;
              console.log(`Inserted dealer ${index + 1}: ${dealer.name}`);
            }

            if (index === dealers.length - 1) {
              stmt.finalize((err) => {
                if (err) {
                  console.error('Error finalizing statement:', err);
                  reject(err);
                } else {
                  console.log(`Successfully imported ${inserted} dealers`);
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
importDealers()
  .then(() => {
    console.log('Dealer import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Dealer import failed:', error);
    process.exit(1);
  }); 