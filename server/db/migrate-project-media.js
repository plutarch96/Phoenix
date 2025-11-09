const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'phoenix.db');
const db = new sqlite3.Database(dbPath);

console.log('Creating project_media table...');

db.serialize(() => {
  // Create project_media table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      media_category TEXT DEFAULT 'document',
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by INTEGER,
      description TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating project_media table:', err);
    } else {
      console.log('✓ project_media table created successfully');
    }
  });

  // Create index for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_project_media_project_id
    ON project_media(project_id)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('✓ Index created on project_id');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_project_media_category
    ON project_media(media_category)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('✓ Index created on media_category');
      console.log('\nMigration completed successfully!');
    }

    db.close();
  });
});
