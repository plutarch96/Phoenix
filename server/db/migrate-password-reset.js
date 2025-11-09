const db = require('./database');

console.log('Creating password_reset_tokens table...');

db.run(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating password_reset_tokens table:', err);
    process.exit(1);
  }

  console.log('✓ password_reset_tokens table created successfully');

  // Create index on token for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_token
    ON password_reset_tokens(token)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
      process.exit(1);
    }

    console.log('✓ Index on token created successfully');

    // Create index on user_id
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
      ON password_reset_tokens(user_id)
    `, (err) => {
      if (err) {
        console.error('Error creating user_id index:', err);
        process.exit(1);
      }

      console.log('✓ Index on user_id created successfully');
      console.log('\nPassword reset migration completed successfully!');
      process.exit(0);
    });
  });
});
