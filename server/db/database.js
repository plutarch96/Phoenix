const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Clients table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      client_id INTEGER,
      test_date DATE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
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
      equipment_id TEXT UNIQUE NOT NULL,
      calibration_date DATE NOT NULL,
      expiration_date DATE NOT NULL,
      calibrated_by TEXT,
      pdf_path TEXT,
      status TEXT DEFAULT 'valid',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Test-Calibration junction table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS test_calibrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER,
      calibration_id INTEGER,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (calibration_id) REFERENCES calibrations(id) ON DELETE CASCADE,
      UNIQUE(test_id, calibration_id)
    )
  `);

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_client ON tests(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_tags_test ON test_tags(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_media_test ON test_media(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_cal_test ON test_calibrations(test_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_test_cal_cal ON test_calibrations(calibration_id)`);

  // Initialize default equipment types for fire testing
  const defaultEquipmentTypes = [
    { code: 'PT', name: 'Pressure Transducer' },
    { code: 'TC', name: 'Thermocouple' },
    { code: 'MM', name: 'Multimeter' },
    { code: 'HF', name: 'Heat Flux Meter' },
    { code: 'FG', name: 'Flow Gauge' },
    { code: 'VR', name: 'Video Recorder' },
    { code: 'DAQ', name: 'Data Acquisition System' },
    { code: 'LM', name: 'Load Meter' },
    { code: 'TH', name: 'Thermometer' },
    { code: 'GS', name: 'Gas Sensor' },
    { code: 'SM', name: 'Smoke Meter' },
    { code: 'WS', name: 'Weather Station' },
    { code: 'CAM', name: 'Camera' },
    { code: 'MIC', name: 'Microphone' }
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
