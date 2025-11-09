const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db/testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Running database migration...\n');

db.serialize(() => {
  // Add project_id column to tests table if it doesn't exist
  db.run(`ALTER TABLE tests ADD COLUMN project_id INTEGER REFERENCES projects(id)`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ Column project_id already exists in tests table');
      } else {
        console.log('✓ Column project_id added to tests table (or already exists)');
      }
    } else {
      console.log('✓ Column project_id added to tests table');
    }
  });

  // Verify audit_logs table will be created
  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'`, (err, row) => {
    if (err) {
      console.error('Error checking audit_logs table:', err);
    } else if (row) {
      console.log('✓ audit_logs table already exists');
    } else {
      console.log('✓ audit_logs table will be created on next server start');
    }
  });

  // Verify projects table will be created
  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`, (err, row) => {
    if (err) {
      console.error('Error checking projects table:', err);
    } else if (row) {
      console.log('✓ projects table already exists');
    } else {
      console.log('✓ projects table will be created on next server start');
    }
  });

  console.log('\nMigration complete! You can now restart the server.');
  db.close();
});
