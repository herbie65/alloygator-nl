const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function exportDatabase() {
  console.log('Exporting database for migration...');
  
  try {
    const db = await open({
      filename: './alloygator.db',
      driver: sqlite3.Database
    });

    // Export all tables
    const tables = [
      'customers',
      'customer_groups', 
      'products',
      'orders',
      'order_items',
      'vat_settings',
      'vat_display_settings',
      'shipping_settings',
      'payment_settings',
      'payment_transactions',
      'header_settings',
      'header_navigation',
      'dhl_settings',
      'cms_pages',
      'company_info',
      'crm_notes',
      'crm_activities',
      'crm_customer_stats',
      'crm_tags',
      'crm_customer_tags'
    ];

    const exportData = {};

    for (const table of tables) {
      try {
        const rows = await db.all(`SELECT * FROM ${table}`);
        exportData[table] = rows;
        console.log(`✅ Exported ${rows.length} rows from ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} not found or empty`);
      }
    }

    // Save to JSON file
    const exportPath = './database_export.json';
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n📁 Database exported to: ${exportPath}`);
    console.log(`📊 Total tables exported: ${Object.keys(exportData).length}`);

    // Show summary
    console.log('\n📋 Export Summary:');
    Object.entries(exportData).forEach(([table, rows]) => {
      console.log(`  ${table}: ${rows.length} records`);
    });

    await db.close();
    
  } catch (error) {
    console.error('Error exporting database:', error);
  }
}

exportDatabase().catch(console.error); 