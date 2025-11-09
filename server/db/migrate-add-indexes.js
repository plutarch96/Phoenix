const db = require('./database');

console.log('Starting index creation migration...');

// List of indexes to create for performance optimization
const indexes = [
  // Tests table indexes
  {
    name: 'idx_tests_status',
    table: 'tests',
    column: 'status',
    reason: 'Frequently filtered by status in queries'
  },
  {
    name: 'idx_tests_test_date',
    table: 'tests',
    column: 'test_date',
    reason: 'Used in date range queries and sorting'
  },
  {
    name: 'idx_tests_client_id',
    table: 'tests',
    column: 'client_id',
    reason: 'Frequently joined and filtered'
  },
  {
    name: 'idx_tests_project_id',
    table: 'tests',
    column: 'project_id',
    reason: 'Frequently joined and filtered'
  },
  {
    name: 'idx_tests_created_at',
    table: 'tests',
    column: 'created_at',
    reason: 'Used for sorting in most queries'
  },

  // Test tags indexes
  {
    name: 'idx_test_tags_test_id',
    table: 'test_tags',
    column: 'test_id',
    reason: 'Used in joins to fetch tags'
  },
  {
    name: 'idx_test_tags_tag',
    table: 'test_tags',
    column: 'tag',
    reason: 'Filtered by tag value'
  },

  // Projects table indexes
  {
    name: 'idx_projects_client_id',
    table: 'projects',
    column: 'client_id',
    reason: 'Frequently filtered by client'
  },
  {
    name: 'idx_projects_status',
    table: 'projects',
    column: 'status',
    reason: 'Filtered by status'
  },
  {
    name: 'idx_projects_claimed_by',
    table: 'projects',
    column: 'claimed_by',
    reason: 'Used to find projects by project manager'
  },
  {
    name: 'idx_projects_created_at',
    table: 'projects',
    column: 'created_at',
    reason: 'Used for sorting'
  },

  // Calibrations table indexes
  {
    name: 'idx_calibrations_equipment_id',
    table: 'calibrations',
    column: 'equipment_id',
    reason: 'Frequently filtered by equipment'
  },
  {
    name: 'idx_calibrations_expiration_date',
    table: 'calibrations',
    column: 'expiration_date',
    reason: 'Used for sorting and expiration checks'
  },
  {
    name: 'idx_calibrations_is_active',
    table: 'calibrations',
    column: 'is_active',
    reason: 'Filtered to show only active calibrations'
  },
  {
    name: 'idx_calibrations_created_at',
    table: 'calibrations',
    column: 'created_at',
    reason: 'Used for sorting'
  },

  // Audit logs indexes
  {
    name: 'idx_audit_logs_action',
    table: 'audit_logs',
    column: 'action',
    reason: 'Frequently filtered by action type'
  },
  {
    name: 'idx_audit_logs_user_id',
    table: 'audit_logs',
    column: 'user_id',
    reason: 'Filtered by user'
  },
  {
    name: 'idx_audit_logs_timestamp',
    table: 'audit_logs',
    column: 'timestamp',
    reason: 'Used for date range queries and sorting'
  },

  // Users table indexes
  {
    name: 'idx_users_role',
    table: 'users',
    column: 'role',
    reason: 'Filtered by role in authorization checks'
  },
  {
    name: 'idx_users_client_id',
    table: 'users',
    column: 'client_id',
    reason: 'Used to find users for a client'
  },

  // Media table indexes
  {
    name: 'idx_media_test_id',
    table: 'media',
    column: 'test_id',
    reason: 'Used in joins to fetch media for tests'
  },
  {
    name: 'idx_media_created_at',
    table: 'media',
    column: 'created_at',
    reason: 'Used for sorting'
  }
];

// Composite indexes for common query patterns
const compositeIndexes = [
  {
    name: 'idx_calibrations_equipment_active',
    table: 'calibrations',
    columns: ['equipment_id', 'is_active'],
    reason: 'Common filter pattern: active calibrations for specific equipment'
  },
  {
    name: 'idx_tests_client_status',
    table: 'tests',
    columns: ['client_id', 'status'],
    reason: 'Common filter pattern: tests by client and status'
  },
  {
    name: 'idx_projects_client_status',
    table: 'projects',
    columns: ['client_id', 'status'],
    reason: 'Common filter pattern: projects by client and status'
  }
];

// Function to check if index exists
function indexExists(indexName, callback) {
  db.get(
    `SELECT name FROM sqlite_master WHERE type='index' AND name=?`,
    [indexName],
    (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, !!row);
      }
    }
  );
}

// Function to check if table exists
function tableExists(tableName, callback) {
  db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName],
    (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, !!row);
      }
    }
  );
}

// Function to create single-column index
function createIndex(index, callback) {
  tableExists(index.table, (err, exists) => {
    if (err) {
      console.error(`Error checking table ${index.table}:`, err.message);
      return callback(err);
    }

    if (!exists) {
      console.log(`⊘ Table ${index.table} does not exist, skipping index ${index.name}`);
      return callback(null);
    }

    indexExists(index.name, (err, exists) => {
      if (err) {
        console.error(`Error checking index ${index.name}:`, err.message);
        return callback(err);
      }

      if (exists) {
        console.log(`✓ Index ${index.name} already exists, skipping`);
        return callback(null);
      }

      const sql = `CREATE INDEX ${index.name} ON ${index.table}(${index.column})`;
      console.log(`Creating index: ${index.name} on ${index.table}(${index.column})`);
      console.log(`  Reason: ${index.reason}`);

      db.run(sql, (err) => {
        if (err) {
          console.error(`✗ Error creating index ${index.name}:`, err.message);
          callback(err);
        } else {
          console.log(`✓ Created index ${index.name}`);
          callback(null);
        }
      });
    });
  });
}

// Function to create composite index
function createCompositeIndex(index, callback) {
  tableExists(index.table, (err, exists) => {
    if (err) {
      console.error(`Error checking table ${index.table}:`, err.message);
      return callback(err);
    }

    if (!exists) {
      console.log(`⊘ Table ${index.table} does not exist, skipping composite index ${index.name}`);
      return callback(null);
    }

    indexExists(index.name, (err, exists) => {
      if (err) {
        console.error(`Error checking index ${index.name}:`, err.message);
        return callback(err);
      }

      if (exists) {
        console.log(`✓ Composite index ${index.name} already exists, skipping`);
        return callback(null);
      }

      const columns = index.columns.join(', ');
      const sql = `CREATE INDEX ${index.name} ON ${index.table}(${columns})`;
      console.log(`Creating composite index: ${index.name} on ${index.table}(${columns})`);
      console.log(`  Reason: ${index.reason}`);

      db.run(sql, (err) => {
        if (err) {
          console.error(`✗ Error creating composite index ${index.name}:`, err.message);
          callback(err);
        } else {
          console.log(`✓ Created composite index ${index.name}`);
          callback(null);
        }
      });
    });
  });
}

// Create all indexes sequentially
let currentIndex = 0;

function createNextIndex() {
  if (currentIndex < indexes.length) {
    createIndex(indexes[currentIndex], (err) => {
      if (err) {
        console.error('Migration failed!');
        process.exit(1);
      }
      currentIndex++;
      createNextIndex();
    });
  } else {
    createCompositeIndexes();
  }
}

// Create composite indexes
let currentCompositeIndex = 0;

function createCompositeIndexes() {
  if (currentCompositeIndex < compositeIndexes.length) {
    createCompositeIndex(compositeIndexes[currentCompositeIndex], (err) => {
      if (err) {
        console.error('Migration failed!');
        process.exit(1);
      }
      currentCompositeIndex++;
      createCompositeIndexes();
    });
  } else {
    finishMigration();
  }
}

function finishMigration() {
  console.log('\n=================================');
  console.log('Index migration completed successfully!');
  console.log(`Created ${indexes.length} single-column indexes`);
  console.log(`Created ${compositeIndexes.length} composite indexes`);
  console.log('=================================\n');
  process.exit(0);
}

// Start migration
console.log('=================================');
console.log('Creating performance indexes...');
console.log('=================================\n');
createNextIndex();
