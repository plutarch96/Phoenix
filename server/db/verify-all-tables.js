const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'testtracking.db');
const db = new sqlite3.Database(dbPath);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       PHOENIX APPLICATION - DATABASE VERIFICATION          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`Database: ${dbPath}\n`);

const expectedSchema = {
  users: ['id', 'username', 'email', 'password_hash', 'role', 'client_id', 'is_active', 'created_at', 'last_login'],
  clients: ['id', 'name', 'client_number', 'address', 'city', 'state', 'zip_code', 'contact_email', 'contact_phone', 'created_at'],
  client_contacts: ['id', 'client_id', 'name', 'title', 'email', 'phone', 'is_primary', 'created_at'],
  projects: ['id', 'client_id', 'project_number', 'project_name', 'description', 'status', 'created_at', 'updated_at'],
  tests: ['id', 'title', 'description', 'test_type', 'governing_standard', 'location', 'client_id', 'project_id', 'test_number', 'test_date', 'status', 'created_at', 'updated_at'],
  test_tags: ['id', 'test_id', 'tag'],
  equipment_types: ['id', 'type_code', 'type_name', 'next_sequence'],
  calibrations: ['id', 'equipment_name', 'equipment_type', 'equipment_id', 'serial_number', 'calibration_date', 'expiration_date', 'calibrated_by', 'pdf_path', 'status', 'notes', 'is_active', 'superseded_by', 'created_at'],
  test_calibrations: ['id', 'test_id', 'calibration_id', 'linked_at'],
  calibration_snapshots: ['id', 'test_calibration_id', 'equipment_name', 'equipment_type', 'equipment_id', 'calibration_date', 'expiration_date', 'calibrated_by', 'pdf_path', 'notes', 'snapshot_created_at'],
  test_media: ['id', 'test_id', 'media_type', 'media_category', 'file_name', 'file_path', 'file_size', 'uploaded_at', 'description'],
  audit_logs: ['id', 'user_id', 'username', 'action', 'entity_type', 'entity_id', 'details', 'ip_address', 'timestamp']
};

let totalTables = 0;
let totalIssues = 0;
let totalColumns = 0;

function checkTable(tableName, expectedColumns, callback) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.log(`\n❌ ERROR checking ${tableName}:`, err.message);
      totalIssues++;
      return callback();
    }

    if (!columns || columns.length === 0) {
      console.log(`\n❌ TABLE MISSING: ${tableName}`);
      console.log(`   Expected ${expectedColumns.length} columns: ${expectedColumns.join(', ')}`);
      totalIssues++;
      return callback();
    }

    totalTables++;
    const actualColumns = columns.map(col => col.name);
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

    console.log(`\n📋 ${tableName.toUpperCase()}`);
    console.log(`   Columns: ${actualColumns.length}`);

    if (missingColumns.length > 0) {
      console.log(`   ❌ MISSING: ${missingColumns.join(', ')}`);
      totalIssues++;
    }

    if (extraColumns.length > 0) {
      console.log(`   ℹ️  Extra columns (not critical): ${extraColumns.join(', ')}`);
    }

    if (missingColumns.length === 0) {
      console.log(`   ✅ All expected columns present`);
    }

    totalColumns += actualColumns.length;

    // Show column details for key tables
    if (['calibrations', 'tests', 'projects'].includes(tableName)) {
      console.log(`   Details:`);
      columns.forEach(col => {
        const marker = expectedColumns.includes(col.name) ? '✓' : 'ℹ';
        console.log(`     ${marker} ${col.name} (${col.type})`);
      });
    }

    callback();
  });
}

function checkCriticalConstraints(callback) {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('CRITICAL CONSTRAINT CHECKS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check if equipment_id still has UNIQUE constraint (should NOT)
  db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='calibrations'", (err, results) => {
    if (err) {
      console.log('❌ Error checking calibrations constraints:', err.message);
      return callback();
    }

    if (results.length > 0) {
      const hasUniqueConstraint = results[0].sql.includes('equipment_id TEXT UNIQUE');
      console.log('🔍 Calibrations equipment_id UNIQUE constraint:');
      if (hasUniqueConstraint) {
        console.log('   ❌ FOUND - This will break calibration uploads!');
        console.log('   Action needed: Run node db/complete-migration.js');
        totalIssues++;
      } else {
        console.log('   ✅ NOT FOUND (correct - allows multiple calibrations per equipment)');
      }
    }

    callback();
  });
}

function showIndexes(callback) {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('DATABASE INDEXES');
  console.log('═══════════════════════════════════════════════════════════\n');

  db.all("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'", (err, indexes) => {
    if (err) {
      console.log('❌ Error checking indexes:', err.message);
      return callback();
    }

    const indexCount = indexes.length;
    console.log(`Found ${indexCount} custom indexes:\n`);

    const groupedIndexes = {};
    indexes.forEach(idx => {
      if (!groupedIndexes[idx.tbl_name]) {
        groupedIndexes[idx.tbl_name] = [];
      }
      groupedIndexes[idx.tbl_name].push(idx.name);
    });

    Object.keys(groupedIndexes).sort().forEach(table => {
      console.log(`  ${table}:`);
      groupedIndexes[table].forEach(idx => {
        console.log(`    ✓ ${idx}`);
      });
    });

    callback();
  });
}

// Run all checks
const tableNames = Object.keys(expectedSchema);
let checkedTables = 0;

console.log('Checking database schema...\n');

function checkNextTable() {
  if (checkedTables < tableNames.length) {
    const tableName = tableNames[checkedTables];
    const expectedColumns = expectedSchema[tableName];
    checkedTables++;
    checkTable(tableName, expectedColumns, checkNextTable);
  } else {
    checkCriticalConstraints(() => {
      showIndexes(() => {
        printSummary();
      });
    });
  }
}

function printSummary() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    VERIFICATION SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Total Tables: ${totalTables}/${tableNames.length}`);
  console.log(`📊 Total Columns: ${totalColumns}`);
  console.log(`📊 Issues Found: ${totalIssues}\n`);

  if (totalIssues === 0) {
    console.log('🎉 DATABASE IS FULLY MIGRATED AND READY!\n');
    console.log('All tables and columns are present.');
    console.log('No UNIQUE constraint issues found.');
    console.log('Your Phoenix application is ready to run!\n');
  } else {
    console.log('⚠️  ISSUES DETECTED!\n');
    console.log('Please review the issues above and run the necessary migrations.\n');
    console.log('To fix all issues at once:');
    console.log('  node db/run-all-migrations.js\n');
  }

  db.close();
}

checkNextTable();
