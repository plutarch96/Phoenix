const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Running user project tags migration...');

db.serialize(() => {
  // Create user_project_tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_project_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      tagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(user_id, project_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_project_tags table:', err);
    } else {
      console.log('✓ user_project_tags table created');
    }
  });

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_project_tags_user ON user_project_tags(user_id)`, (err) => {
    if (err) {
      console.error('Error creating user_project_tags user index:', err);
    } else {
      console.log('✓ Created index on user_project_tags.user_id');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_user_project_tags_project ON user_project_tags(project_id)`, (err) => {
    if (err) {
      console.error('Error creating user_project_tags project index:', err);
    } else {
      console.log('✓ Created index on user_project_tags.project_id');
    }
  });

  setTimeout(() => {
    console.log('\n✅ User project tags migration complete!');
    console.log('Users can now tag projects as "mine"');
    db.close();
    process.exit(0);
  }, 1000);
});
