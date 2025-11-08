const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('Running database migrations...');

db.serialize(() => {
  // Function to safely add a column if it doesn't exist
  const addColumnIfNotExists = (tableName, columnName, columnDef, callback) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        console.error(`Error checking table ${tableName}:`, err);
        return callback(err);
      }

      const columnExists = columns.some(col => col.name === columnName);

      if (!columnExists) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
          if (err) {
            console.error(`Error adding column ${columnName} to ${tableName}:`, err);
            return callback(err);
          }
          console.log(`✓ Added column '${columnName}' to ${tableName}`);
          callback(null);
        });
      } else {
        console.log(`✓ Column '${columnName}' already exists in ${tableName}`);
        callback(null);
      }
    });
  };

  // Migrate tests table
  const testMigrations = [
    { column: 'test_type', def: 'TEXT' },
    { column: 'governing_standard', def: 'TEXT' },
    { column: 'location', def: 'TEXT' }
  ];

  let migrationsComplete = 0;
  const totalMigrations = testMigrations.length;

  testMigrations.forEach(migration => {
    addColumnIfNotExists('tests', migration.column, migration.def, (err) => {
      migrationsComplete++;
      if (migrationsComplete === totalMigrations) {
        console.log('\nAll migrations complete!');
        console.log('You can now restart your server.');
        db.close();
        process.exit(0);
      }
    });
  });
});
