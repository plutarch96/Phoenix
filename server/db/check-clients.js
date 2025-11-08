const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Clients Table Structure ===\n');

db.all("PRAGMA table_info(clients)", (err, columns) => {
  if (err) {
    console.error('Error checking clients table:', err);
  } else {
    console.log('Clients table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  }

  setTimeout(() => {
    db.close();
    process.exit(0);
  }, 100);
});
