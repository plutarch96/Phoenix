const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
console.log('Checking database at:', dbPath);
console.log('');

const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(calibrations)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Calibrations table columns:');
  console.log('');

  const columnNames = columns.map(c => c.name);

  columns.forEach(col => {
    const details = [];
    if (col.type) details.push(col.type);
    if (col.notnull) details.push('NOT NULL');
    if (col.pk) details.push('PRIMARY KEY');
    if (col.dflt_value) details.push(`DEFAULT ${col.dflt_value}`);

    console.log(`  ${col.cid}. ${col.name.padEnd(20)} ${details.join(' ')}`);
  });

  console.log('');
  console.log('Column checklist:');
  console.log(`  ✓ id:                 ${columnNames.includes('id') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ equipment_name:     ${columnNames.includes('equipment_name') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ equipment_type:     ${columnNames.includes('equipment_type') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ equipment_id:       ${columnNames.includes('equipment_id') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ serial_number:      ${columnNames.includes('serial_number') ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  ✓ calibration_date:   ${columnNames.includes('calibration_date') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ expiration_date:    ${columnNames.includes('expiration_date') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ calibrated_by:      ${columnNames.includes('calibrated_by') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ pdf_path:           ${columnNames.includes('pdf_path') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ status:             ${columnNames.includes('status') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ notes:              ${columnNames.includes('notes') ? 'EXISTS' : 'MISSING'}`);
  console.log(`  ✓ is_active:          ${columnNames.includes('is_active') ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  ✓ superseded_by:      ${columnNames.includes('superseded_by') ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  ✓ created_at:         ${columnNames.includes('created_at') ? 'EXISTS' : 'MISSING'}`);

  console.log('');

  // Check for UNIQUE constraint on equipment_id
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='calibrations'", (err, results) => {
    if (err) {
      console.error('Error checking table definition:', err);
    } else if (results.length > 0) {
      const hasUniqueConstraint = results[0].sql.includes('equipment_id TEXT UNIQUE');
      console.log('UNIQUE constraint check:');
      console.log(`  equipment_id UNIQUE: ${hasUniqueConstraint ? '❌ FOUND (NEEDS REMOVAL)' : '✅ NOT FOUND (CORRECT)'}`);
      console.log('');

      if (hasUniqueConstraint) {
        console.log('⚠️  WARNING: UNIQUE constraint still exists!');
        console.log('   Run: node db/complete-migration.js');
      }
    }

    db.close();
  });
});
