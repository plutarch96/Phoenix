const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Users table for authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      client_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);

  // Clients table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_number TEXT UNIQUE,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Client contacts table (multiple contacts per client)
  db.run(`
    CREATE TABLE IF NOT EXISTS client_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      title TEXT,
      email TEXT,
      phone TEXT,
      is_primary BOOLEAN DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      claimed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (claimed_by) REFERENCES users(id)
    )
  `);

  // Project members table (staff who join projects)
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
  `);

  // Tests table
  db.run(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      test_type TEXT,
      governing_standard TEXT,
      location TEXT,
      client_id INTEGER,
      project_id INTEGER,
      test_date DATE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Test tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS test_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER,
      tag TEXT NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    )
  `);

  // User test tags table (for "My Tests" feature)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_test_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      test_id INTEGER NOT NULL,
      tagged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      UNIQUE(user_id, test_id)
    )
  `);

  // Test members table (users who have joined tests)
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
  `);

  // Test reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS test_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'draft',
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Equipment types tracking for auto-generated IDs
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_code TEXT UNIQUE NOT NULL,
      type_name TEXT NOT NULL,
      next_sequence INTEGER DEFAULT 1
    )
  `);

  // Calibration equipment table
  db.run(`
    CREATE TABLE IF NOT EXISTS calibrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_name TEXT NOT NULL,
      equipment_type TEXT NOT NULL,
      equipment_id TEXT NOT NULL,
      serial_number TEXT,
      calibration_date DATE NOT NULL,
      expiration_date DATE NOT NULL,
      calibrated_by TEXT,
      pdf_path TEXT,
      status TEXT DEFAULT 'valid',
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      superseded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Test media table (images, videos, datafiles)
  db.run(`
    CREATE TABLE IF NOT EXISTS test_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER,
      media_type TEXT NOT NULL,
      media_category TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    )
  `);

  // Audit logs table for tracking all user actions
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Test-Calibration junction table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS test_calibrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER,
      calibration_id INTEGER,
      linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (calibration_id) REFERENCES calibrations(id) ON DELETE CASCADE,
      UNIQUE(test_id, calibration_id)
    )
  `);

  // Calibration snapshots - preserves calibration data when linked to tests
  db.run(`
    CREATE TABLE IF NOT EXISTS calibration_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_calibration_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      equipment_type TEXT NOT NULL,
      equipment_id TEXT NOT NULL,
      calibration_date DATE NOT NULL,
      expiration_date DATE NOT NULL,
      calibrated_by TEXT,
      pdf_path TEXT,
      notes TEXT,
      snapshot_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_calibration_id) REFERENCES test_calibrations(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_projects_claimed_by ON projects(claimed_by)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_client ON tests(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_project ON tests(project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_tags_test ON test_tags(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_test_tags_user ON user_test_tags(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_test_tags_test ON user_test_tags(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_members_test ON test_members(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_members_user ON test_members(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_reports_test ON test_reports(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_media_test ON test_media(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_cal_test ON test_calibrations(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_cal_cal ON test_calibrations(calibration_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cal_snapshots_tc ON calibration_snapshots(test_calibration_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);

  // Initialize default equipment types for FRA Lab
  const defaultEquipmentTypes = [
    { code: 'HFG', name: 'Heat Flux Gauge' },
    { code: 'TCM', name: 'TC Mod' },
    { code: 'CRM', name: 'Current Mod' },
    { code: 'VLM', name: 'Voltage Mod' },
    { code: 'SRM', name: 'Serial Mod' },
    { code: 'MM', name: 'Multimeter' },
    { code: 'RH', name: 'Relative Humidity Sensor' },
    { code: 'ANM', name: 'Anemometer' },
    { code: 'SW', name: 'Stop Watch' },
    { code: 'TM', name: 'Tape Measure' }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO equipment_types (type_code, type_name, next_sequence)
    VALUES (?, ?, 1)
  `);

  defaultEquipmentTypes.forEach(type => {
    stmt.run(type.code, type.name);
  });

  stmt.finalize();
});

module.exports = db;
