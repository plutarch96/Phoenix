const db = require('./server/db/database');

db.get('SELECT username, email, role FROM users WHERE role = "admin"', (err, user) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  if (user) {
    console.log('\n✓ Admin user already exists:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log('\nThe password was displayed when the admin was first created.');
    console.log('If you don\'t know the password, you can reset the database or create a new admin.\n');
  } else {
    console.log('\n✗ No admin user found in database.');
    console.log('The admin user should be created automatically on next server start.\n');
  }

  db.close();
});
