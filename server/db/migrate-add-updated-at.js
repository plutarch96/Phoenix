const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting updated_at column migration...');

db.serialize(() => {
  // Check and add updated_at column to calibrations table only
  // (tests and projects already have updated_at in their schema)
  // Note: SQLite doesn't allow DEFAULT CURRENT_TIMESTAMP in ALTER TABLE, so we add without default
  db.run(`
    ALTER TABLE calibrations ADD COLUMN updated_at DATETIME
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ calibrations.updated_at column already exists');
      } else {
        console.error('Error adding updated_at to calibrations:', err.message);
      }
    } else {
      console.log('✓ Added updated_at column to calibrations table');

      // Initialize existing rows with created_at value, new rows will use trigger
      db.run(`
        UPDATE calibrations SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)
      `, (err) => {
        if (err) {
          console.error('Error initializing calibrations.updated_at:', err.message);
        } else {
          console.log('✓ Initialized calibrations.updated_at with created_at values');
        }
      });
    }
  });

  // Create trigger for tests table
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_tests_timestamp
    BEFORE UPDATE ON tests
    FOR EACH ROW
    BEGIN
      UPDATE tests SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `, (err) => {
    if (err) {
      console.error('Error creating tests trigger:', err.message);
    } else {
      console.log('✓ Created trigger for tests table');
    }
  });

  // Create trigger for projects table
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW
    BEGIN
      UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `, (err) => {
    if (err) {
      console.error('Error creating projects trigger:', err.message);
    } else {
      console.log('✓ Created trigger for projects table');
    }
  });

  // Create trigger for calibrations table (on UPDATE)
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_calibrations_timestamp
    BEFORE UPDATE ON calibrations
    FOR EACH ROW
    BEGIN
      UPDATE calibrations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `, (err) => {
    if (err) {
      console.error('Error creating calibrations UPDATE trigger:', err.message);
    } else {
      console.log('✓ Created UPDATE trigger for calibrations table');
    }
  });

  // Create trigger for calibrations table (on INSERT) to set initial updated_at
  db.run(`
    CREATE TRIGGER IF NOT EXISTS insert_calibrations_timestamp
    AFTER INSERT ON calibrations
    FOR EACH ROW
    BEGIN
      UPDATE calibrations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, (err) => {
    if (err) {
      console.error('Error creating calibrations INSERT trigger:', err.message);
    } else {
      console.log('✓ Created INSERT trigger for calibrations table');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Migration completed successfully!');
  }
});
