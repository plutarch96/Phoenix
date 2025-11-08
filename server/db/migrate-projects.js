const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Running project hierarchy migration...');

db.serialize(() => {
  // Create projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_number TEXT NOT NULL,
      project_name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      UNIQUE(client_id, project_number)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating projects table:', err);
    } else {
      console.log('✓ Projects table created');
    }
  });

  // Add project_id to tests table
  db.all(`PRAGMA table_info(tests)`, (err, columns) => {
    if (err) {
      console.error('Error checking tests table:', err);
      return;
    }

    const hasProjectId = columns.some(col => col.name === 'project_id');
    const hasTestNumber = columns.some(col => col.name === 'test_number');

    if (!hasProjectId) {
      db.run(`ALTER TABLE tests ADD COLUMN project_id INTEGER REFERENCES projects(id)`, (err) => {
        if (err) {
          console.error('Error adding project_id to tests:', err);
        } else {
          console.log('✓ Added project_id column to tests');
        }
      });
    } else {
      console.log('✓ project_id column already exists in tests');
    }

    if (!hasTestNumber) {
      db.run(`ALTER TABLE tests ADD COLUMN test_number TEXT`, (err) => {
        if (err) {
          console.error('Error adding test_number to tests:', err);
        } else {
          console.log('✓ Added test_number column to tests');
        }
      });
    } else {
      console.log('✓ test_number column already exists in tests');
    }
  });

  // Create index for projects
  db.run(`CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)`, (err) => {
    if (err) {
      console.error('Error creating projects index:', err);
    } else {
      console.log('✓ Created index on projects.client_id');
    }
  });

  // Create index for tests.project_id
  db.run(`CREATE INDEX IF NOT EXISTS idx_tests_project ON tests(project_id)`, (err) => {
    if (err) {
      console.error('Error creating tests project index:', err);
    } else {
      console.log('✓ Created index on tests.project_id');
    }
  });

  setTimeout(() => {
    console.log('\n✅ Project hierarchy migration complete!');
    console.log('Structure: Client (549) → Project (007) → Test (001, 002, 003...)');
    console.log('Full test ID format: 549-007-002');
    db.close();
    process.exit(0);
  }, 1000);
});
