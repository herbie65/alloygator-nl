const fs = require('fs');

// Read the JSON file
const jsonData = JSON.parse(fs.readFileSync('brons_dealers_import.json', 'utf8'));

async function importBronsDealers() {
  console.log('Starting brons dealers import via API...');
  
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < jsonData.customers.length; i++) {
    const dealer = jsonData.customers[i];
    
    try {
      const response = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dealer.name,
          email: dealer.email,
          phone: dealer.phone,
          address: dealer.address,
          city: dealer.city,
          postal_code: dealer.postal_code,
          country: dealer.country,
          customer_group_id: dealer.customer_group_id,
          is_dealer: dealer.is_dealer,
          show_on_map: dealer.show_on_map,
          first_name: dealer.first_name,
          last_name: dealer.last_name,
          company_name: dealer.company_name,
          vat_number: dealer.vat_number,
          invoice_email: dealer.invoice_email,
          website: dealer.website
        })
      });

      if (response.ok) {
        imported++;
        console.log(`✓ Imported dealer ${i + 1}: ${dealer.name}`);
      } else {
        errors++;
        console.log(`✗ Failed to import dealer ${i + 1}: ${dealer.name}`);
      }
    } catch (error) {
      errors++;
      console.log(`✗ Error importing dealer ${i + 1}: ${dealer.name} - ${error.message}`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nImport completed: ${imported} imported, ${errors} errors`);
}

// Run the import
importBronsDealers()
  .then(() => {
    console.log('Brons dealers import completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Brons dealers import failed:', error);
    process.exit(1);
  }); 