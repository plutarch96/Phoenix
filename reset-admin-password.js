const bcrypt = require('bcryptjs');
const db = require('./server/db/database');

// Change this to your desired password
const NEW_PASSWORD = 'admin123'; // <-- CHANGE THIS!

async function resetPassword() {
  try {
    const password_hash = await bcrypt.hash(NEW_PASSWORD, 10);

    db.run(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [password_hash, 'admin'],
      function(err) {
        if (err) {
          console.error('Error updating password:', err);
        } else {
          console.log('\n✓ Admin password updated successfully!');
          console.log(`  Username: admin`);
          console.log(`  Password: ${NEW_PASSWORD}`);
          console.log('\n⚠️  Remember to change this password after logging in!\n');
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

resetPassword();
