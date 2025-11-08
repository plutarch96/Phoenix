const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database tables...\n');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Tables in database:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });

  if (tables.find(t => t.name === 'calibrations')) {
    console.log('\nCalibrations table schema:');
    db.all("PRAGMA table_info(calibrations)", (err, columns) => {
      if (err) {
        console.error('Error:', err);
      } else {
        columns.forEach(col => {
          console.log(`  ${col.cid}: ${col.name} ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
        });
      }

      // Check for indexes
      db.all("PRAGMA index_list(calibrations)", (err, indexes) => {
        if (err) {
          console.error('Error checking indexes:', err);
        } else if (indexes.length > 0) {
          console.log('\nIndexes:');
          indexes.forEach(idx => {
            console.log(`  - ${idx.name} (unique: ${idx.unique})`);
          });
        }
        db.close();
      });
    });
  } else {
    console.log('\nCalibrations table does not exist!');
    db.close();
  }
});
