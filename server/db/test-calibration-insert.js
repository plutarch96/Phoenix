const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
console.log('Testing calibration insert on:', dbPath);
console.log('');

const db = new sqlite3.Database(dbPath);

// Test the exact INSERT query that the server uses
const testData = {
  equipment_name: 'Test Equipment',
  equipment_type: 'HFG',
  equipment_id: 'HFG-999',
  serial_number: 'TEST123',
  calibration_date: '2025-11-08',
  expiration_date: '2026-11-08',
  calibrated_by: 'Test User',
  pdf_path: '/uploads/test.pdf',
  status: 'valid',
  notes: 'Test calibration',
  is_active: 1
};

console.log('Attempting to insert test calibration...');
console.log('Data:', testData);
console.log('');

db.run(
  `INSERT INTO calibrations (equipment_name, equipment_type, equipment_id, serial_number, calibration_date, expiration_date, calibrated_by, pdf_path, status, notes, is_active)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    testData.equipment_name,
    testData.equipment_type,
    testData.equipment_id,
    testData.serial_number,
    testData.calibration_date,
    testData.expiration_date,
    testData.calibrated_by,
    testData.pdf_path,
    testData.status,
    testData.notes,
    testData.is_active
  ],
  function(err) {
    if (err) {
      console.log('❌ INSERT FAILED:');
      console.log('Error:', err.message);
      console.log('');

      // Check if it's a column issue
      if (err.message.includes('no such column') || err.message.includes('no column')) {
        console.log('This is a COLUMN ERROR!');
        console.log('The column mentioned in the error does not exist in the table.');
        console.log('');

        // Show current schema
        db.all("PRAGMA table_info(calibrations)", (err, columns) => {
          if (!err) {
            console.log('Current calibrations table columns:');
            columns.forEach(col => {
              console.log(`  - ${col.name} (${col.type})`);
            });
          }
          db.close();
        });
      } else {
        console.log('Error type:', err.code || 'UNKNOWN');
        db.close();
      }
    } else {
      console.log('✅ INSERT SUCCESSFUL!');
      console.log('New calibration ID:', this.lastID);
      console.log('');

      // Clean up - delete the test record
      db.run('DELETE FROM calibrations WHERE id = ?', [this.lastID], (err) => {
        if (err) {
          console.log('Note: Could not clean up test record');
        } else {
          console.log('Test record cleaned up');
        }
        db.close();
      });
    }
  }
);
