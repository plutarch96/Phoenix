const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting audit log migration...\n');

db.serialize(() => {
  console.log('Creating audit_logs table...');

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('  ✗ Error creating audit_logs table:', err.message);
      return;
    }
    console.log('  ✓ audit_logs table created successfully');

    // Create indexes for better query performance
    console.log('\nCreating indexes...');

    db.run('CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)', (err) => {
      if (err) {
        console.error('  ✗ Error creating user_id index:', err.message);
      } else {
        console.log('  ✓ Created index on user_id');
      }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC)', (err) => {
      if (err) {
        console.error('  ✗ Error creating timestamp index:', err.message);
      } else {
        console.log('  ✓ Created index on timestamp');
      }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id)', (err) => {
      if (err) {
        console.error('  ✗ Error creating entity index:', err.message);
      } else {
        console.log('  ✓ Created index on entity_type and entity_id');
      }

      console.log('\n✅ Audit log migration complete!');
      db.close();
    });
  });
});
