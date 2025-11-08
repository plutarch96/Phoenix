const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const oldDbPath = path.join(__dirname, '..', 'database.db');

console.log('Checking for old database file...');
console.log('Path:', oldDbPath);
console.log('');

if (fs.existsSync(oldDbPath)) {
  console.log('⚠️  OLD DATABASE FOUND!');
  console.log('');

  const stats = fs.statSync(oldDbPath);
  console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`Last modified: ${stats.mtime}`);
  console.log('');

  const db = new sqlite3.Database(oldDbPath);

  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error reading old database:', err);
      db.close();
      return;
    }

    console.log('Tables in old database:');
    tables.forEach(t => console.log(`  - ${t.name}`));
    console.log('');

    if (tables.find(t => t.name === 'calibrations')) {
      db.get("SELECT COUNT(*) as count FROM calibrations", (err, row) => {
        if (err) {
          console.error('Error counting calibrations:', err);
        } else {
          console.log(`Calibration records: ${row.count}`);
        }
        console.log('');
        console.log('RECOMMENDATION:');
        if (row && row.count > 0) {
          console.log('  This old database has data. You should:');
          console.log('  1. Export any important data');
          console.log('  2. Delete this file (it is not used by the server)');
          console.log('  3. The server uses /server/db/testtracking.db instead');
        } else {
          console.log('  This old database is empty. Safe to delete.');
          console.log('  The server uses /server/db/testtracking.db instead');
        }

        db.close();
      });
    } else {
      console.log('No calibrations table found in old database.');
      console.log('Safe to delete this file.');
      db.close();
    }
  });
} else {
  console.log('✅ No old database.db file found.');
  console.log('You are using the correct database: /server/db/testtracking.db');
}
