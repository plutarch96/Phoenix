const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Migrating Test Assignments and Reports ===\n');

db.serialize(() => {
  // Create test_assignments table for "My Tests" feature
  console.log('Creating test_assignments table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS test_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(test_id, user_id)
    )
  `, (err) => {
    if (err) {
      console.error('  ✗ Error creating test_assignments table:', err.message);
    } else {
      console.log('  ✓ test_assignments table created');
    }
  });

  // Create test_reports table for report uploads
  console.log('\nCreating test_reports table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS test_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      uploaded_by INTEGER NOT NULL,
      uploaded_by_name TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('  ✗ Error creating test_reports table:', err.message);
    } else {
      console.log('  ✓ test_reports table created');
    }
  });

  // Create indexes
  setTimeout(() => {
    console.log('\nCreating indexes...');

    db.run('CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON test_assignments(test_id)', (err) => {
      if (err) {
        console.error('  ✗ Error creating test_assignments test index:', err.message);
      } else {
        console.log('  ✓ Created index on test_assignments.test_id');
      }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_test_assignments_user ON test_assignments(user_id)', (err) => {
      if (err) {
        console.error('  ✗ Error creating test_assignments user index:', err.message);
      } else {
        console.log('  ✓ Created index on test_assignments.user_id');
      }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_test_reports_test ON test_reports(test_id)', (err) => {
      if (err) {
        console.error('  ✗ Error creating test_reports test index:', err.message);
      } else {
        console.log('  ✓ Created index on test_reports.test_id');
      }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_test_reports_status ON test_reports(status)', (err) => {
      if (err) {
        console.error('  ✗ Error creating test_reports status index:', err.message);
      } else {
        console.log('  ✓ Created index on test_reports.status');
      }
    });

    setTimeout(() => {
      console.log('\n✅ Test Assignments and Reports migration complete!');
      console.log('\nNew Features Enabled:');
      console.log('  • Users can tag tests as "Mine"');
      console.log('  • "My Tests" page to view tagged tests');
      console.log('  • Upload test reports (draft/final)');
      console.log('  • Track report versions and status\n');
      db.close();
      process.exit(0);
    }, 500);
  }, 500);
});
