const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(clients)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\n=== CLIENTS TABLE COLUMNS ===');
    columns.forEach(col => {
      console.log(`  ${col.cid}. ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    console.log('\nLooking for these columns:');
    const required = ['name', 'client_number', 'contact_email', 'contact_phone', 'address', 'city', 'state', 'zip_code'];
    required.forEach(colName => {
      const exists = columns.some(col => col.name === colName);
      console.log(`  ${colName}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    });
  }

  db.close();
});
