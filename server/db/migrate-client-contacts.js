const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Migrating Client Contact Fields ===\n');

// Helper function to check if column exists
const addColumnIfNotExists = (tableName, columnName, columnDef, callback) => {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Error checking ${tableName} columns:`, err);
      return callback(err);
    }

    const columnExists = columns.some(col => col.name === columnName);

    if (!columnExists) {
      console.log(`  Adding ${columnName} to ${tableName}...`);
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
        if (err) {
          console.error(`  ✗ Error adding ${columnName}:`, err.message);
          return callback(err);
        }
        console.log(`  ✓ Added ${columnName}`);
        callback(null);
      });
    } else {
      console.log(`  ✓ ${columnName} already exists`);
      callback(null);
    }
  });
};

// Add contact_email and contact_phone to clients table
db.serialize(() => {
  addColumnIfNotExists('clients', 'contact_email', 'TEXT', (err) => {
    if (err) return;

    addColumnIfNotExists('clients', 'contact_phone', 'TEXT', (err) => {
      if (err) return;

      console.log('\n✅ Client contact fields migration complete!');
      console.log('Clients table now has: name, client_number, address, city, state, zip_code, contact_email, contact_phone\n');

      db.close();
    });
  });
});
