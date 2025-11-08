const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Database Structure ===\n');

// Check if projects table exists
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'", (err, tables) => {
  if (err) {
    console.error('Error checking projects table:', err);
  } else if (tables.length > 0) {
    console.log('✓ Projects table EXISTS');

    // Get projects table structure
    db.all("PRAGMA table_info(projects)", (err, columns) => {
      if (err) {
        console.error('Error getting projects columns:', err);
      } else {
        console.log('  Projects table columns:');
        columns.forEach(col => {
          console.log(`    - ${col.name} (${col.type})`);
        });
      }
    });
  } else {
    console.log('✗ Projects table DOES NOT EXIST');
    console.log('  → Run: npm run migrate-projects');
  }
});

// Check tests table structure
setTimeout(() => {
  db.all("PRAGMA table_info(tests)", (err, columns) => {
    if (err) {
      console.error('\nError checking tests table:', err);
    } else {
      console.log('\n✓ Tests table columns:');
      columns.forEach(col => {
        console.log(`    - ${col.name} (${col.type})`);
      });

      const hasProjectId = columns.some(col => col.name === 'project_id');
      const hasTestNumber = columns.some(col => col.name === 'test_number');
      const hasTestType = columns.some(col => col.name === 'test_type');
      const hasGoverningStandard = columns.some(col => col.name === 'governing_standard');
      const hasLocation = columns.some(col => col.name === 'location');

      console.log('\n=== Migration Status ===');
      console.log(`  project_id:          ${hasProjectId ? '✓ EXISTS' : '✗ MISSING'}`);
      console.log(`  test_number:         ${hasTestNumber ? '✓ EXISTS' : '✗ MISSING'}`);
      console.log(`  test_type:           ${hasTestType ? '✓ EXISTS' : '✗ MISSING'}`);
      console.log(`  governing_standard:  ${hasGoverningStandard ? '✓ EXISTS' : '✗ MISSING'}`);
      console.log(`  location:            ${hasLocation ? '✓ EXISTS' : '✗ MISSING'}`);

      if (!hasProjectId || !hasTestNumber) {
        console.log('\n⚠️  Need to run: npm run migrate-projects');
      }
      if (!hasTestType || !hasGoverningStandard || !hasLocation) {
        console.log('\n⚠️  Need to run: npm run migrate');
      }
      if (hasProjectId && hasTestNumber && hasTestType && hasGoverningStandard && hasLocation) {
        console.log('\n✅ All migrations complete! Database is ready.');
      }
    }

    setTimeout(() => {
      db.close();
      process.exit(0);
    }, 100);
  });
}, 100);
