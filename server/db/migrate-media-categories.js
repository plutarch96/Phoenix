const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Migrating Media Categories ===\n');

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
  console.log('Updating test_media table for document categories...\n');

  // The table already has media_category, but let's make sure it exists
  // and update the description to clarify the categories
  addColumnIfNotExists('test_media', 'category', 'TEXT DEFAULT "media"', (err) => {
    if (err) return;

    console.log('\n✅ Media categories migration complete!');
    console.log('\nSupported categories:');
    console.log('  - test_data: Test data files (CSV, Excel, etc.)');
    console.log('  - media: Images and videos');
    console.log('  - calibration: Calibration PDFs');
    console.log('  - other: Other documents\n');

    db.close();
  });
});
