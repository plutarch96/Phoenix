const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Running project assignments migration...');

db.serialize(() => {
  // Add claimed_by column to projects table
  db.all('PRAGMA table_info(projects)', (err, columns) => {
    if (err) {
      console.error('Error checking projects table:', err);
      return;
    }

    const hasClaimedBy = columns.some(col => col.name === 'claimed_by');

    if (!hasClaimedBy) {
      db.run(`ALTER TABLE projects ADD COLUMN claimed_by INTEGER REFERENCES users(id)`, (err) => {
        if (err) {
          console.error('Error adding claimed_by to projects:', err);
        } else {
          console.log('✓ Added claimed_by column to projects');
        }
      });
    } else {
      console.log('✓ claimed_by column already exists in projects');
    }
  });

  // Create project_members table for staff joins
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating project_members table:', err);
    } else {
      console.log('✓ project_members table created');
    }
  });

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_projects_claimed_by ON projects(claimed_by)`, (err) => {
    if (err) {
      console.error('Error creating projects claimed_by index:', err);
    } else {
      console.log('✓ Created index on projects.claimed_by');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)`, (err) => {
    if (err) {
      console.error('Error creating project_members project index:', err);
    } else {
      console.log('✓ Created index on project_members.project_id');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)`, (err) => {
    if (err) {
      console.error('Error creating project_members user index:', err);
    } else {
      console.log('✓ Created index on project_members.user_id');
    }
  });

  setTimeout(() => {
    console.log('\n✅ Project assignments migration complete!');
    console.log('Project Managers can now claim projects (exclusive)');
    console.log('Staff can now join projects (multiple allowed)');
    db.close();
    process.exit(0);
  }, 1000);
});
