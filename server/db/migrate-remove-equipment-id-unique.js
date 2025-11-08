const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting calibration equipment_id UNIQUE constraint removal migration...\n');

db.serialize(() => {
  // First check if we need to migrate
  db.all("PRAGMA table_info(calibrations)", (err, columns) => {
    if (err) {
      console.error('Error checking calibrations table:', err);
      db.close();
      return;
    }

    console.log('Current calibrations table schema:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    console.log('\nStep 1: Creating new calibrations table without UNIQUE constraint on equipment_id...');

    // Create new table with correct schema (no UNIQUE on equipment_id)
    db.run(`
      CREATE TABLE IF NOT EXISTS calibrations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_name TEXT NOT NULL,
        equipment_type TEXT NOT NULL,
        equipment_id TEXT NOT NULL,
        serial_number TEXT,
        calibration_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        calibrated_by TEXT,
        pdf_path TEXT,
        status TEXT DEFAULT 'valid',
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        superseded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('  ✗ Error creating new table:', err.message);
        db.close();
        return;
      }
      console.log('  ✓ New table created');

      console.log('\nStep 2: Copying data from old table to new table...');
      db.run(`
        INSERT INTO calibrations_new
        (id, equipment_name, equipment_type, equipment_id, serial_number,
         calibration_date, expiration_date, calibrated_by, pdf_path, status,
         notes, is_active, superseded_by, created_at)
        SELECT
          id, equipment_name, equipment_type, equipment_id, serial_number,
          calibration_date, expiration_date, calibrated_by, pdf_path, status,
          notes, is_active, superseded_by, created_at
        FROM calibrations
      `, (err) => {
        if (err) {
          console.error('  ✗ Error copying data:', err.message);
          db.close();
          return;
        }
        console.log('  ✓ Data copied successfully');

        // Count records to verify
        db.get('SELECT COUNT(*) as count FROM calibrations_new', (err, row) => {
          if (err) {
            console.error('  ✗ Error counting records:', err.message);
            db.close();
            return;
          }
          console.log(`  ✓ Verified ${row.count} records copied`);

          console.log('\nStep 3: Dropping old calibrations table...');
          db.run('DROP TABLE calibrations', (err) => {
            if (err) {
              console.error('  ✗ Error dropping old table:', err.message);
              db.close();
              return;
            }
            console.log('  ✓ Old table dropped');

            console.log('\nStep 4: Renaming new table to calibrations...');
            db.run('ALTER TABLE calibrations_new RENAME TO calibrations', (err) => {
              if (err) {
                console.error('  ✗ Error renaming table:', err.message);
                db.close();
                return;
              }
              console.log('  ✓ Table renamed');

              console.log('\nStep 5: Creating indexes for performance...');
              db.run('CREATE INDEX IF NOT EXISTS idx_calibrations_equipment_id ON calibrations(equipment_id)', (err) => {
                if (err) {
                  console.error('  ✗ Error creating equipment_id index:', err.message);
                } else {
                  console.log('  ✓ Created index on equipment_id');
                }

                db.run('CREATE INDEX IF NOT EXISTS idx_calibrations_is_active ON calibrations(is_active)', (err) => {
                  if (err) {
                    console.error('  ✗ Error creating is_active index:', err.message);
                  } else {
                    console.log('  ✓ Created index on is_active');
                  }

                  console.log('\n✅ Migration complete!');
                  console.log('The equipment_id column no longer has a UNIQUE constraint.');
                  console.log('Multiple calibration records can now exist for the same equipment.\n');

                  db.close();
                });
              });
            });
          });
        });
      });
    });
  });
});
