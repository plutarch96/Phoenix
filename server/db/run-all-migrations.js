const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const dbPath = path.join(__dirname, 'testtracking.db');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     PHOENIX APPLICATION - COMPLETE DATABASE MIGRATION      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`Database: ${dbPath}\n`);

const migrations = [
  {
    name: 'Base Tests Table',
    script: 'migrate.js',
    description: 'Adds test_type, governing_standard, and location columns to tests table'
  },
  {
    name: 'Project Hierarchy',
    script: 'migrate-projects.js',
    description: 'Creates projects table and adds project_id, test_number to tests'
  },
  {
    name: 'Client Contacts',
    script: 'migrate-client-contacts.js',
    description: 'Adds contact fields to clients table'
  },
  {
    name: 'Media Categories',
    script: 'migrate-media-categories.js',
    description: 'Adds media_category column to test_media table'
  },
  {
    name: 'Audit Logging',
    script: 'migrate-audit-log.js',
    description: 'Creates audit_logs table with indexes'
  },
  {
    name: 'Calibration Serial Numbers',
    script: 'migrate-add-serial-number.js',
    description: 'Adds serial_number column to calibrations table'
  },
  {
    name: 'Calibration History',
    script: 'migrate-calibration-history.js',
    description: 'Adds is_active and superseded_by columns for version tracking'
  },
  {
    name: 'Calibration UNIQUE Constraint Fix',
    script: 'complete-migration.js',
    description: 'Removes UNIQUE constraint from equipment_id (critical for uploads)'
  },
  {
    name: 'User Project Tags',
    script: 'migrate-user-project-tags.js',
    description: 'Creates user_project_tags table for "Mark as Mine" feature'
  },
  {
    name: 'Project Assignments',
    script: 'migrate-project-assignments.js',
    description: 'Adds claimed_by and project_members for role-based project assignment'
  },
  {
    name: 'Test Assignments',
    script: 'migrate-test-assignments.js',
    description: 'Creates test_members table for test-level team assignments'
  },
  {
    name: 'Updated At Columns',
    script: 'migrate-add-updated-at.js',
    description: 'Adds updated_at columns and triggers for activity tracking'
  }
];

async function runMigration(migration, index) {
  console.log(`\n[${ index + 1}/${migrations.length}] ${migration.name}`);
  console.log(`    ${migration.description}`);
  console.log('    Running...');

  try {
    const { stdout, stderr } = await execPromise(`node ${path.join(__dirname, migration.script)}`);

    if (stderr && !stderr.includes('deprecated')) {
      console.log('    ⚠️  Warnings:', stderr);
    }

    // Show key output lines (filter out noise)
    const lines = stdout.split('\n').filter(line =>
      line.includes('✓') ||
      line.includes('✅') ||
      line.includes('Created') ||
      line.includes('Added') ||
      line.includes('Migration complete')
    );

    if (lines.length > 0) {
      lines.forEach(line => console.log('    ' + line.trim()));
    }

    console.log(`    ✅ COMPLETED`);
    return true;
  } catch (error) {
    console.log(`    ❌ FAILED: ${error.message}`);
    return false;
  }
}

async function runAllMigrations() {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < migrations.length; i++) {
    const success = await runMigration(migrations[i], i);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                  MIGRATION SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`❌ Failed: ${failCount}/${migrations.length}\n`);

  if (failCount === 0) {
    console.log('🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!\n');
    console.log('Next steps:');
    console.log('  1. Run verification: node db/verify-all-tables.js');
    console.log('  2. Restart your server');
    console.log('  3. Test all features (tests, calibrations, clients, projects)\n');
  } else {
    console.log('⚠️  Some migrations failed. Please review the errors above.\n');
  }
}

runAllMigrations().catch(error => {
  console.error('\n❌ Migration process error:', error);
  process.exit(1);
});
