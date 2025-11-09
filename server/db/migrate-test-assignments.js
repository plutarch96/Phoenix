const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting test assignments migration...');

db.serialize(() => {
  // Create test_members table for staff to join specific tests
  db.run(`
    CREATE TABLE IF NOT EXISTS test_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(test_id, user_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating test_members table:', err.message);
    } else {
      console.log('✓ test_members table created');
    }
  });

  // Create index for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_test_members_test_id ON test_members(test_id)
  `, (err) => {
    if (err) {
      console.error('Error creating test_id index:', err.message);
    } else {
      console.log('✓ test_id index created');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_test_members_user_id ON test_members(user_id)
  `, (err) => {
    if (err) {
      console.error('Error creating user_id index:', err.message);
    } else {
      console.log('✓ user_id index created');
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
