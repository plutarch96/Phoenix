const db = require('./db/database');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         PHOENIX APPLICATION - SETUP VERIFICATION           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if database is initialized
db.get('SELECT name FROM sqlite_master WHERE type="table"', (err, row) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }

  console.log('✅ Database connection successful\n');

  // Check all tables
  db.all('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name', (err, tables) => {
    if (err) {
      console.error('❌ Error fetching tables:', err.message);
      process.exit(1);
    }

    console.log('📊 Database Tables:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.name}`);
    });

    console.log('\n');

    // Check for new features
    const checks = [
      {
        name: 'Project Assignments (claimed_by column)',
        query: "SELECT sql FROM sqlite_master WHERE type='table' AND name='projects'",
        check: (row) => row && row.sql.includes('claimed_by')
      },
      {
        name: 'Project Members Table',
        query: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='project_members'",
        check: (row) => row && row.count > 0
      },
      {
        name: 'Test Members Table',
        query: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='test_members'",
        check: (row) => row && row.count > 0
      },
      {
        name: 'User Project Tags Table',
        query: "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='user_project_tags'",
        check: (row) => row && row.count > 0
      },
      {
        name: 'Updated At Column (calibrations)',
        query: "SELECT sql FROM sqlite_master WHERE type='table' AND name='calibrations'",
        check: (row) => row && row.sql.includes('updated_at')
      },
      {
        name: 'Updated At Column (tests)',
        query: "SELECT sql FROM sqlite_master WHERE type='table' AND name='tests'",
        check: (row) => row && row.sql.includes('updated_at')
      },
      {
        name: 'Updated At Column (projects)',
        query: "SELECT sql FROM sqlite_master WHERE type='table' AND name='projects'",
        check: (row) => row && row.sql.includes('updated_at')
      }
    ];

    let passedChecks = 0;
    let totalChecks = checks.length;

    console.log('🔍 Feature Checks:\n');

    const runCheck = (index) => {
      if (index >= checks.length) {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                  VERIFICATION SUMMARY                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
        console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks}\n`);

        if (passedChecks === totalChecks) {
          console.log('🎉 ALL CHECKS PASSED! System is ready.\n');
          console.log('Next steps:');
          console.log('  1. Start the server: npm run server');
          console.log('  2. Start the client: npm start');
          console.log('  3. Navigate to http://localhost:3000\n');
        } else {
          console.log('⚠️  Some checks failed. Run migrations:');
          console.log('  node db/run-all-migrations.js\n');
        }

        db.close();
        return;
      }

      const check = checks[index];
      db.get(check.query, (err, row) => {
        if (err) {
          console.log(`   ❌ ${check.name}: ERROR - ${err.message}`);
        } else if (check.check(row)) {
          console.log(`   ✅ ${check.name}`);
          passedChecks++;
        } else {
          console.log(`   ❌ ${check.name}: Not found`);
        }
        runCheck(index + 1);
      });
    };

    runCheck(0);
  });
});
