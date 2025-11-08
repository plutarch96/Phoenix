const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Completing incomplete calibration migration...\n');

db.serialize(() => {
  // Check what tables exist
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    const hasCalibrations = tables.find(t => t.name === 'calibrations');
    const hasCalibrationsNew = tables.find(t => t.name === 'calibrations_new');

    console.log('Current state:');
    console.log(`  calibrations table exists: ${hasCalibrations ? 'YES' : 'NO'}`);
    console.log(`  calibrations_new table exists: ${hasCalibrationsNew ? 'YES' : 'NO'}\n`);

    if (hasCalibrationsNew && !hasCalibrations) {
      console.log('Found incomplete migration. Completing it now...\n');

      // Check schema of calibrations_new
      db.all("PRAGMA table_info(calibrations_new)", (err, columns) => {
        if (err) {
          console.error('Error checking calibrations_new schema:', err);
          db.close();
          return;
        }

        console.log('calibrations_new schema:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type}`);
        });

        // Just rename calibrations_new to calibrations
        console.log('\nRenaming calibrations_new to calibrations...');
        db.run('ALTER TABLE calibrations_new RENAME TO calibrations', (err) => {
          if (err) {
            console.error('  ✗ Error renaming table:', err.message);
            db.close();
            return;
          }
          console.log('  ✓ Table renamed successfully');

          console.log('\nCreating indexes...');
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

              console.log('\n✅ Migration completed successfully!');
              db.close();
            });
          });
        });
      });
    } else if (hasCalibrations && !hasCalibrationsNew) {
      console.log('Running full migration from scratch...\n');

      // Check if equipment_id has UNIQUE constraint
      db.all("PRAGMA index_list(calibrations)", (err, indexes) => {
        if (err) {
          console.error('Error checking indexes:', err);
          db.close();
          return;
        }

        // Check for unique index on equipment_id
        const hasUniqueEquipmentId = indexes.find(idx =>
          idx.name.includes('equipment_id') && idx.unique === 1
        );

        if (hasUniqueEquipmentId) {
          console.log('Found UNIQUE constraint on equipment_id. Removing it...\n');

          // Create new table
          console.log('Step 1: Creating new table without UNIQUE constraint...');
          db.run(`
            CREATE TABLE calibrations_new (
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
              console.error('  ✗ Error:', err.message);
              db.close();
              return;
            }
            console.log('  ✓ New table created');

            // Copy data
            console.log('\nStep 2: Copying data...');
            db.run(`
              INSERT INTO calibrations_new
              SELECT * FROM calibrations
            `, (err) => {
              if (err) {
                console.error('  ✗ Error:', err.message);
                db.close();
                return;
              }
              console.log('  ✓ Data copied');

              // Drop old table
              console.log('\nStep 3: Dropping old table...');
              db.run('DROP TABLE calibrations', (err) => {
                if (err) {
                  console.error('  ✗ Error:', err.message);
                  db.close();
                  return;
                }
                console.log('  ✓ Old table dropped');

                // Rename new table
                console.log('\nStep 4: Renaming new table...');
                db.run('ALTER TABLE calibrations_new RENAME TO calibrations', (err) => {
                  if (err) {
                    console.error('  ✗ Error:', err.message);
                    db.close();
                    return;
                  }
                  console.log('  ✓ Table renamed');

                  console.log('\nStep 5: Creating indexes...');
                  db.run('CREATE INDEX IF NOT EXISTS idx_calibrations_equipment_id ON calibrations(equipment_id)', (err) => {
                    if (err) {
                      console.error('  ✗ Error:', err.message);
                    } else {
                      console.log('  ✓ Created index on equipment_id');
                    }

                    db.run('CREATE INDEX IF NOT EXISTS idx_calibrations_is_active ON calibrations(is_active)', (err) => {
                      if (err) {
                        console.error('  ✗ Error:', err.message);
                      } else {
                        console.log('  ✓ Created index on is_active');
                      }

                      console.log('\n✅ Migration completed!');
                      db.close();
                    });
                  });
                });
              });
            });
          });
        } else {
          console.log('✅ No UNIQUE constraint found on equipment_id. Database is already in correct state!');
          db.close();
        }
      });
    } else if (hasCalibrations && hasCalibrationsNew) {
      console.log('⚠️  Warning: Both tables exist! This is an incomplete migration state.');
      console.log('Please manually inspect the database and decide which table to keep.');
      db.close();
    } else {
      console.log('⚠️  No calibrations table found. Please initialize the database first.');
      db.close();
    }
  });
});
