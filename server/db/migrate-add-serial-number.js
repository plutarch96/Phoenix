const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Adding Serial Number Field to Calibrations ===\n');

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

db.serialize(() => {
  console.log('Adding serial_number column for manufacturer serial numbers...\n');

  addColumnIfNotExists('calibrations', 'serial_number', 'TEXT', (err) => {
    if (err) return;

    console.log('\n✅ Serial number migration complete!');
    console.log('\nCalibration fields:');
    console.log('  - equipment_id: Auto-generated ID (e.g., HFG-001)');
    console.log('  - serial_number: Manufacturer serial (e.g., SN12345678)');
    console.log('  - equipment_name: Model/Equipment name\n');

    db.close();
  });
});
