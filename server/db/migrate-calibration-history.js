const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting calibration history migration...\n');

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
  console.log('Adding calibration history tracking columns...\n');

  addColumnIfNotExists('calibrations', 'is_active', 'INTEGER DEFAULT 1', (err) => {
    if (err) return;

    addColumnIfNotExists('calibrations', 'superseded_by', 'INTEGER', (err) => {
      if (err) return;

      // Set all existing calibrations to active
      console.log('\nSetting existing calibrations as active...');
      db.run('UPDATE calibrations SET is_active = 1 WHERE is_active IS NULL', (err) => {
        if (err) {
          console.error('  ✗ Error updating existing calibrations:', err.message);
          return;
        }
        console.log('  ✓ Updated existing calibrations to active');

        console.log('\n✅ Calibration history migration complete!');
        db.close();
      });
    });
  });
});
